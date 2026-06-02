import "dotenv/config";

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    channelId: process.env.TELEGRAM_CHANNEL_ID || "",
  },
  sentryDsn: process.env.SENTRY_DSN || "",
  owner: {
    email: process.env.OWNER_EMAIL || "",
    password: process.env.OWNER_PASSWORD || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    user: process.env.SMTP_USER || "office@fouri.in",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "office@fouri.in",
  },
};
