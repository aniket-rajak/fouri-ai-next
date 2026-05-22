import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
      </div>
      <div style="background: #1a1a2e; padding: 24px; border-radius: 0 0 8px 8px; color: #e0e0e0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888899; width: 100px;">Name:</td>
            <td style="padding: 8px 0; color: #f5f5f7; font-weight: 600;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888899;">Email:</td>
            <td style="padding: 8px 0; color: #f5f5f7;">
              <a href="mailto:${data.email}" style="color: #60a5fa;">${data.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888899;">Subject:</td>
            <td style="padding: 8px 0; color: #f5f5f7; font-weight: 600;">${data.subject}</td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #0f0f1a; border-radius: 6px; border-left: 3px solid #3b82f6;">
          <p style="margin: 0; color: #c0c0cc; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #555566;">
          Sent from the FOURI.IN contact form
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"FOURI Contact" <${env.smtp.from}>`,
    to: env.smtp.from,
    replyTo: data.email,
    subject: `Contact Form: ${data.subject}`,
    html,
  });
}
