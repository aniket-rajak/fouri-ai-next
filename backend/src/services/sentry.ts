import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

Sentry.init({
  dsn: env.sentryDsn,
  tracesSampleRate: 0.1,
  environment: env.nodeEnv,
  enabled: env.nodeEnv === "production",
});

export function captureError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export default Sentry;
