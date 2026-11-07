import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config/config.js";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const same = (a, b) => {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

router.post("/login", limiter, (req, res) => {
  const { username, password } = z
    .object({ username: z.string().min(1), password: z.string().min(1) })
    .parse(req.body);
  const ok =
    same(username, config.adminUser) && same(password, config.adminPassword);
  if (!ok) return res.status(401).json({ error: "ইউজারনেম বা পাসওয়ার্ড ভুল" });
  const token = jwt.sign({ u: username }, config.jwtSecret, {
    expiresIn: "12h",
  });
  res.json({ token });
});

export default router;
