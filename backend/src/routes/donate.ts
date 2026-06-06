import { Router } from "express";
import { sendContactEmail } from "../services/email.js";
import { standardLimiter } from "../middleware/rateLimiter.js";

const router = Router();

interface DonateBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

router.post("/", standardLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body as DonateBody;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: "All fields are required: name, email, subject, message" });
      return;
    }

    if (typeof name !== "string" || name.length > 200) {
      res.status(400).json({ error: "Name must be under 200 characters" });
      return;
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    if (typeof subject !== "string" || subject.length > 500) {
      res.status(400).json({ error: "Subject must be under 500 characters" });
      return;
    }

    if (typeof message !== "string" || message.length > 5000) {
      res.status(400).json({ error: "Message must be under 5000 characters" });
      return;
    }

    await sendContactEmail({
      name,
      email,
      subject: `[Donation] ${subject}`,
      message,
    });

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Donate form error:", error);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

export default router;
