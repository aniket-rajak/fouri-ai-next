import { env } from "../config/env.js";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

function getApiKey(): string {
  if (!env.brevo.apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }
  return env.brevo.apiKey;
}

async function sendViaBrevo(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  const apiKey = getApiKey();
  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.smtp.from, name: "FOURI" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || stripHtml(html),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${body}`);
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

  await sendViaBrevo(
    env.smtp.from,
    `Contact Form: ${data.subject}`,
    html
  );
}

export function wrapWithBranding(
  content: string,
  options?: { logoUrl?: string | null; headerImage?: string | null; footerLogo?: string | null; copyright?: string | null }
): string {
  const logo = options?.logoUrl
    ? `<tr><td align="center" style="padding: 24px 20px 16px 20px;"><img src="${options.logoUrl}" alt="" width="150" height="150" style="display: block; width: 150px; height: 150px; max-width: 100%; border: 0;" /></td></tr>`
    : "";
  const header = options?.headerImage
    ? `<tr><td align="center" style="line-height: 0;"><img src="${options.headerImage}" alt="" style="display: block; width: 100%; max-width: 560px; height: auto; border: 0;" /></td></tr>`
    : "";
  const footerLogo = options?.footerLogo
    ? `<tr><td align="center" style="padding: 24px 20px 16px 20px;"><img src="${options.footerLogo}" alt="" width="100" height="100" style="display: block; width: 100px; height: 100px; max-width: 100%; border: 0;" /></td></tr>`
    : "";
  const footerText = `<tr><td align="center" style="padding: 20px 30px; border-top: 1px solid #334155;"><p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 14px; font-weight: 600; line-height: 1.5;">Team FOURI</p><p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">AI-Powered Learning Platform</p></td></tr>`;
  const copyright = options?.copyright
    ? `<tr><td align="center" style="padding: 0 30px 24px 30px;"><p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">${options.copyright}</p></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title></title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a;">
<tr>
<td align="center" style="padding: 20px 10px;">
  <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <div style="max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1e293b; border-radius: 12px;">
      ${logo}
      ${header}
      <tr>
        <td style="padding: 0; color: #cbd5e1; font-size: 16px; line-height: 1.8; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
          ${content}
        </td>
      </tr>
      ${footerLogo}
      ${footerText}
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

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendBroadcastEmail(options: {
  emails: Array<{ to: string; subject: string; html: string }>;
}): Promise<{ delivered: number; failed: number; errors: string[] }> {
  let delivered = 0;
  let failed = 0;
  const errors: string[] = [];

  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 600;

  for (let i = 0; i < options.emails.length; i += BATCH_SIZE) {
    const batch = options.emails.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (email) => {
        if (!isValidEmail(email.to)) {
          throw new Error(`Invalid email address: ${email.to}`);
        }
        console.log(`[Email] Sending to: ${email.to}`);
        await sendViaBrevo(email.to, email.subject, email.html);
        console.log(`[Email] ✅ Delivered to ${email.to}`);
      })
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const emailTo = batch[j].to;
      if (result.status === "fulfilled") {
        delivered++;
      } else {
        const errorMsg = result.reason?.message || String(result.reason);
        console.error(`[Email] ❌ Failed for ${emailTo}: ${errorMsg}`);
        errors.push(`Failed for ${emailTo}: ${errorMsg}`);
        failed++;
      }
    }

    if (i + BATCH_SIZE < options.emails.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return { delivered, failed, errors };
}
