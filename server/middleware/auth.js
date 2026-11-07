import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "লগইন করুন" });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "সেশন শেষ, আবার লগইন করুন" });
  }
}
