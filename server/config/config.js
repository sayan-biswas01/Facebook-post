import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "JWT_SECRET",
  "TOKEN_SECRET",
];
export const missingEnv = required.filter((k) => !process.env[k]);

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  adminUser: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  tokenSecret: process.env.TOKEN_SECRET,
  fbVersion: process.env.FB_GRAPH_VERSION || "v23.0",
  dbPath: path.join(root, "data", "app.db"),
  mediaDir: path.join(root, "media"),
};
