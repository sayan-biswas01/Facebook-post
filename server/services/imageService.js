import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../config/db.js";
import { config, mediaPath } from "../config/config.js";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 2048; // Facebook-এর জন্য এর বেশি দরকার নেই

// sharp ইনস্টল না থাকলে ছবি আসল আকারেই সংরক্ষণ হবে (কাজ থামবে না)
let sharpPromise;
const getSharp = () =>
  (sharpPromise ??= import("sharp").then((m) => m.default).catch(() => null));

export async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "facebook-post-tool/1.0" },
  });
  if (!res.ok) throw new Error(`ডাউনলোড ব্যর্থ (${res.status})`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`ছবি নয়: ${type}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("ফাইল খুব বড়");

  // ডুপ্লিকেট ধরার হ্যাশ আসল ছবির ওপর, তাই ছোট করলেও হিসাব বদলায় না
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  let out = buf;
  let ext = type.includes("png") ? "png" : "jpg";

  const sharp = await getSharp();
  if (sharp) {
    try {
      out = await sharp(buf)
        .rotate()
        .resize({
          width: MAX_SIDE,
          height: MAX_SIDE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 85 })
        .toBuffer();
      ext = "jpg";
    } catch {
      /* ছোট করা না গেলে আসল ছবিই থাকবে */
    }
  }

  await fs.mkdir(config.mediaDir, { recursive: true });
  const localPath = path.join(config.mediaDir, `${hash}.${ext}`);
  await fs.writeFile(localPath, out);
  return { hash, localPath };
}

/**
 * পোস্টের আগে ছবির ফাইল আছে কি না দেখে; না থাকলে উৎসের URL থেকে আবার নামায়।
 * ডাটাবেসে অন্য কম্পিউটারের পথ (যেমন C:\Users\...) থাকলেও এই কম্পিউটারের media ফোল্ডারে খোঁজে।
 * তাই মিডিয়া ফোল্ডার ডেপ্লয় না করলেও, বা মুছে গেলেও (Render-এ রিস্টার্ট) পোস্ট আটকায় না।
 */
export async function ensureLocalImage(asset) {
  if (asset.local_path) {
    const p = mediaPath(asset.local_path);
    try {
      await fs.access(p);
      return p;
    } catch {
      /* ফাইল নেই, আবার নামাব */
    }
  }
  if (!asset.image_url)
    throw new Error("ছবির ফাইল নেই এবং আবার নামানোর URL-ও নেই");
  console.log(`[media] ফাইল নেই, উৎস থেকে আবার নামানো হচ্ছে: "${asset.title}"`);
  let localPath;
  try {
    ({ localPath } = await downloadImage(asset.image_url));
  } catch (e) {
    throw new Error(`ছবি আবার নামানো যায়নি (${e.message})`);
  }
  db.prepare("UPDATE assets SET local_path = ? WHERE id = ?").run(
    localPath,
    asset.id,
  );
  return localPath;
}
