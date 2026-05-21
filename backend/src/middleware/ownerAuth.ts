import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_SECRET = env.jwtSecret || "fouri-owner-secret";

export function ownerAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const token = header.split("Bearer ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    if (decoded.email !== env.owner.email || decoded.role !== "owner") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
