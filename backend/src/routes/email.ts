import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { sendBroadcastEmail, wrapWithBranding } from "../services/email.js";
import { generateEmailContent } from "../services/openai.js";
import { uploadToTelegram } from "../services/telegramStorage.js";
import { resolveVariables, userToVariableData } from "../lib/emailVariables.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WebP, SVG, and GIF images are allowed"));
    }
  },
});

const router = Router();

// --- Upload branding image ---
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }
    const { fileId, cdnUrl } = await uploadToTelegram(file.buffer, file.originalname);

    // Store in media library
    await prisma.mediaFile.create({
      data: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileId,
        cdnUrl,
        category: "templates",
      },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({ url: `${baseUrl}/api/files/${fileId}` });
  } catch (error) {
    console.error("Email image upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Image upload failed",
    });
  }
});

// --- AI generate email ---
router.post("/generate-ai", async (req, res) => {
  try {
    const { instructions, tone } = req.body;
    if (!instructions) {
      res.status(400).json({ error: "instructions is required" });
      return;
    }

    const result = await generateEmailContent(instructions, tone || "Professional");
    res.json(result);
  } catch (error) {
    console.error("AI email generation error:", error);
    res.status(500).json({ error: "Failed to generate email" });
  }
});

// --- Send broadcast ---
router.post("/send", async (req, res) => {
  try {
    const { subject, body, recipientType, userIds, customEmails, templateId } = req.body;

    if (!subject || !body) {
      res.status(400).json({ error: "subject and body are required" });
      return;
    }

    let recipients: string[] = [];

    switch (recipientType) {
      case "ALL": {
        const users = await prisma.user.findMany({ select: { email: true } });
        recipients = users.map((u) => u.email).filter(Boolean);
        break;
      }
      case "FREE":
      case "PREMIUM": {
        const users = await prisma.user.findMany({ select: { email: true } });
        recipients = users.map((u) => u.email).filter(Boolean);
        break;
      }
      case "ACTIVE": {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const users = await prisma.user.findMany({
          where: {
            testAttempts: { some: { startedAt: { gte: thirtyDaysAgo } } },
          },
          select: { email: true },
        });
        recipients = users.map((u) => u.email).filter(Boolean);
        break;
      }
      case "INACTIVE": {
        const users = await prisma.user.findMany({
          where: {
            testAttempts: { none: {} },
          },
          select: { email: true },
        });
        recipients = users.map((u) => u.email).filter(Boolean);
        break;
      }
      case "SELECTED": {
        if (!Array.isArray(userIds) || userIds.length === 0) {
          res.status(400).json({ error: "userIds required for SELECTED type" });
          return;
        }
        console.log(`[Email] SELECTED user IDs:`, userIds);
        // Frontend sends User.id (UUID), not firebaseUid
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        });
        console.log(`[Email] Found ${users.length} users by ID:`, users.map((u) => ({ id: u.id, email: u.email, name: u.name })));
        recipients = users.map((u) => u.email).filter(Boolean);
        break;
      }
      case "CUSTOM": {
        if (!Array.isArray(customEmails) || customEmails.length === 0) {
          res.status(400).json({ error: "customEmails required for CUSTOM type" });
          return;
        }
        recipients = customEmails.filter((e: string) => e.includes("@"));
        break;
      }
      default: {
        res.status(400).json({ error: "Invalid recipientType" });
        return;
      }
    }

    console.log(`[Email] Recipients resolved: ${recipients.length}`, recipients);

    if (recipients.length === 0) {
      res.status(400).json({ error: "No recipients found" });
      return;
    }

    // Load template branding if a template is selected
    const currentBase = `${req.protocol}://${req.get("host")}`;
    let brandingOptions: { logoUrl?: string | null; headerImage?: string | null; footerLogo?: string | null; copyright?: string | null } | undefined;
    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
        select: { logoUrl: true, headerImage: true, footerLogo: true, copyright: true },
      });
      if (template) {
        // Rewrite image URLs to use the current server's base URL so they work
        // in external email clients (stored URLs may reference localhost or an old host)
        const rewriteUrl = (url: string | null) =>
          url ? url.replace(/https?:\/\/[^\/]+/, currentBase) : url;

        brandingOptions = {
          logoUrl: rewriteUrl(template.logoUrl),
          headerImage: rewriteUrl(template.headerImage),
          footerLogo: rewriteUrl(template.footerLogo),
          copyright: template.copyright,
        };
        console.log(`[Email] Branding URLs rewritten to base: ${currentBase}`);
      }
    }

    // Resolve {{appUrl}} with dynamic environment URL before user-specific resolution
    const appUrl =
      process.env.NODE_ENV === "production"
        ? "https://fouri.in"
        : "http://localhost:3000";
    const resolvedSubject = subject.replace(/\{\{appUrl\}\}/g, appUrl);
    const resolvedBody = body.replace(/\{\{appUrl\}\}/g, appUrl);
    console.log(`[Email] {{appUrl}} resolved to: ${appUrl}`);

    // Load user data for personalization
    const recipientUsers = await prisma.user.findMany({
      where: { email: { in: recipients } },
      select: { email: true, name: true, createdAt: true, role: true },
    });
    const userMap = new Map(recipientUsers.map((u) => [u.email, u]));

    // Build per-user personalized emails
    const personalizedEmails = recipients.map((email) => {
      const user = userMap.get(email);
      let personalSubject = resolvedSubject;
      let personalBody = resolvedBody;
      if (user) {
        const data = userToVariableData(user);
        personalSubject = resolveVariables(subject, data);
        personalBody = resolveVariables(body, data);
        console.log(`[Email] Personalized for ${email}: subject="${personalSubject}"`);
      }
      // Wrap in branded HTML structure for reliable email client rendering
      const brandedHtml = wrapWithBranding(personalBody, brandingOptions);
      return { to: email, subject: personalSubject, html: brandedHtml };
    });

    const { delivered, failed } = await sendBroadcastEmail({
      emails: personalizedEmails,
    });

    console.log(`[Email] Broadcast result: ${delivered} delivered, ${failed} failed of ${recipients.length}`);

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body,
        recipientType: recipientType || "ALL",
        recipientCount: recipients.length,
        status: failed > 0 && delivered === 0 ? "FAILED" : "SENT",
        deliveredCount: delivered,
        failedCount: failed,
        templateId: templateId || null,
        userIds: recipientType === "SELECTED" ? userIds : null,
        customEmails: recipientType === "CUSTOM" ? customEmails : null,
      },
    });

    res.json({ campaign, delivered, failed, total: recipients.length });
  } catch (error) {
    console.error("Send broadcast error:", error);
    res.status(500).json({
      error: `Email delivery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
});

// --- Preview (preview variable rendering before sending) ---
router.post("/preview", async (req, res) => {
  try {
    const { subject, body, userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true, role: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const data = userToVariableData(user);
    const appUrl =
      process.env.NODE_ENV === "production"
        ? "https://fouri.in"
        : "http://localhost:3000";
    const withAppUrl = (text: string) => text.replace(/\{\{appUrl\}\}/g, appUrl);
    const renderedSubject = subject ? withAppUrl(resolveVariables(subject, data)) : "";
    const renderedBody = body ? withAppUrl(resolveVariables(body, data)) : "";

    console.log(`[Email] Preview for ${user.email}: subject="${renderedSubject}"`);
    res.json({ renderedSubject, renderedBody, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ error: "Failed to render preview" });
  }
});

// --- Template CRUD ---

router.get("/templates", async (_req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ templates });
  } catch (error) {
    console.error("List templates error:", error);
    res.status(500).json({ error: "Failed to list templates" });
  }
});

router.get("/templates/:id", async (req, res) => {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: req.params.id },
    });
    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    res.json({ template });
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ error: "Failed to get template" });
  }
});

router.post("/templates", async (req, res) => {
  try {
    const { name, subject, body, logoUrl, headerImage, footerLogo, copyright } = req.body;
    if (!name || !subject || !body) {
      res.status(400).json({ error: "name, subject, and body are required" });
      return;
    }

    const template = await prisma.emailTemplate.create({
      data: { name, subject, body, logoUrl, headerImage, footerLogo, copyright },
    });
    res.status(201).json({ template });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

router.put("/templates/:id", async (req, res) => {
  try {
    const { name, subject, body, logoUrl, headerImage, footerLogo, copyright } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data: { name, subject, body, logoUrl, headerImage, footerLogo, copyright },
    });
    res.json({ template });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

router.delete("/templates/:id", async (req, res) => {
  try {
    await prisma.emailTemplate.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

router.post("/templates/:id/duplicate", async (req, res) => {
  try {
    const original = await prisma.emailTemplate.findUnique({
      where: { id: req.params.id },
    });
    if (!original) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    const template = await prisma.emailTemplate.create({
      data: {
        name: `${original.name} (Copy)`,
        subject: original.subject,
        body: original.body,
        logoUrl: original.logoUrl,
        headerImage: original.headerImage,
        footerLogo: original.footerLogo,
        copyright: original.copyright,
      },
    });
    res.status(201).json({ template });
  } catch (error) {
    console.error("Duplicate template error:", error);
    res.status(500).json({ error: "Failed to duplicate template" });
  }
});

// --- Campaign History ---

router.get("/history", async (_req, res) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { sentAt: "desc" },
      include: { template: { select: { name: true } } },
    });
    res.json({ campaigns });
  } catch (error) {
    console.error("List history error:", error);
    res.status(500).json({ error: "Failed to list history" });
  }
});

router.delete("/history/:id", async (req, res) => {
  try {
    await prisma.emailCampaign.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

export default router;
