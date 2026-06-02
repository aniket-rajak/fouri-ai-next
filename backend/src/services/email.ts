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
  // Timeouts to fail fast instead of hanging
  connectionTimeout: 10000,  // 10s to connect
  greetingTimeout: 10000,    // 10s for SMTP greeting
  socketTimeout: 15000,      // 15s for mail sending
});

/** Verify SMTP connection at startup */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("✓ SMTP Connected Successfully");
    return true;
  } catch (err: any) {
    console.error("✗ SMTP Authentication Failed:", err?.message || err);
    return false;
  }
}

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

export function wrapWithBranding(
  content: string,
  options?: { logoUrl?: string | null; headerImage?: string | null; footerLogo?: string | null; copyright?: string | null }
): string {
  const logo = options?.logoUrl
    ? `<tr><td align="center" style="padding: 20px 20px 0 20px;"><img src="${options.logoUrl}" alt="" width="auto" height="auto" style="display: block; max-height: 60px; width: auto; border: 0;" /></td></tr>`
    : "";
  const header = options?.headerImage
    ? `<tr><td align="center" style="padding: 10px 20px 0 20px;"><img src="${options.headerImage}" alt="" width="auto" height="auto" style="display: block; max-width: 100%; max-height: 200px; width: auto; height: auto; border: 0;" /></td></tr>`
    : "";
  const footerLogo = options?.footerLogo
    ? `<tr><td align="center" style="padding: 10px 20px 0 20px;"><img src="${options.footerLogo}" alt="" width="auto" height="auto" style="display: block; max-height: 40px; width: auto; border: 0;" /></td></tr>`
    : "";
  const copyright = options?.copyright
    ? `<tr><td align="center" style="padding: 6px 20px 20px 20px;"><p style="margin: 0; font-size: 11px; color: #888899; line-height: 1.4;">${options.copyright}</p></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title></title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f6; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f6;">
<tr>
<td align="center" style="padding: 20px 10px;">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
      ${logo}
      ${header}
      <tr>
        <td style="padding: 24px; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
          ${content}
        </td>
      </tr>
      ${footerLogo}
      ${copyright}
    </table>
  </div>
  <!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</body>
</html>`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendBroadcastEmail(options: {
  emails: Array<{ to: string; subject: string; html: string }>;
}): Promise<{ delivered: number; failed: number; errors: string[] }> {
  let delivered = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const email of options.emails) {
    try {
      const text = stripHtml(email.html);
      console.log(`[Email] Sending to: ${email.to}`);
      const info = await transporter.sendMail({
        from: `"FOURI" <${env.smtp.from}>`,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text,
      });
      console.log(`[Email] ✅ Delivered to ${email.to}: ${info.messageId}`);
      delivered++;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error(`[Email] ❌ Failed for ${email.to}: ${errorMsg}`);
      errors.push(`Failed for ${email.to}: ${errorMsg}`);
      failed++;
    }
  }

  return { delivered, failed, errors };
}
