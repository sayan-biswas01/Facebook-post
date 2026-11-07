import crypto from "node:crypto";
import { config } from "../config/config.js";

// TOKEN_SECRET যেকোনো লম্বা লেখা হতে পারে; তা থেকে ৩২ বাইটের কী বানানো হয়
const key = () =>
  crypto.createHash("sha256").update(config.tokenSecret).digest();

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload) {
  const [iv, tag, enc] = payload
    .split(".")
    .map((s) => Buffer.from(s, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
    "utf8",
  );
}
