import { Router } from "express";
import { sendContactEmail } from "../services/email.js";
import { validate, schemas } from "../middleware/validate.js";
import { contactLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/", contactLimiter, validate(schemas.contact), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await sendContactEmail({ name, email, subject, message });
    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

export default router;
