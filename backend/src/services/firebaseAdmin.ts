import admin, { type ServiceAccount } from "firebase-admin";
import { env } from "../config/env.js";

if (!admin.apps.length) {
  const serviceAccount: ServiceAccount = {
    projectId: env.firebase.projectId,
    privateKey: env.firebase.privateKey.replace(/\\n/g, "\n"),
    clientEmail: env.firebase.clientEmail,
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const auth: admin.auth.Auth = admin.auth();
export default admin;
