import { Router } from "express";
import { prisma, withRetry } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { resolveFileUrl } from "../lib/resolveFileUrl.js";

const router = Router();

router.post("/sync", authenticate, async (req, res) => {
  try {
    const { uid, email, name } = req.user!;

    const user = await withRetry(() =>
      prisma.user.upsert({
        where: { firebaseUid: uid },
        update: { email, name },
        create: {
          firebaseUid: uid,
          email: email || "",
          name: name || email?.split("@")[0] || "User",
        },
      }),
    );

    res.json({ user });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Auth sync error:", error?.message || error);
    if (error?.code === "P2002") {
      res.status(409).json({ error: "Email already registered" });
    } else if (["P1000", "P1001", "P1002", "P1017"].includes(error?.code)) {
      res.status(503).json({ error: "Database connection failed. Please try again." });
    } else {
      res.status(500).json({ error: error?.message || "Failed to sync user" });
    }
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: { ...user, avatarUrl: resolveFileUrl(user.avatarUrl, req) } });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
