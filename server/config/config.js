import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// DATA_DIR দিলে ডাটাবেস ও ছবি সেখানে থাকে (যেমন Render-এর স্থায়ী ডিস্ক বা VPS-এর আলাদা ফোল্ডার)
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : null;

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
  dbPath: dataDir
    ? path.join(dataDir, "app.db")
    : path.join(root, "data", "app.db"),
  mediaDir: dataDir ? path.join(dataDir, "media") : path.join(root, "media"),
};

// ডাটাবেসে সংরক্ষিত পথে Windows-এর পুরো ঠিকানা থাকতে পারে; অন্য কম্পিউটারে সরালেও যেন কাজ করে,
// তাই শুধু ফাইলের নামটা নিয়ে বর্তমান মিডিয়া ফোল্ডারে খোঁজা হয়
export const mediaPath = (p) =>
  path.join(config.mediaDir, String(p).split(/[\\/]/).pop());
