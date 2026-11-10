// "ফাইল খুঁজে পাচ্ছে না" সমস্যার সমাধান আপনার কোডে বসানো হয়েছে কি না যাচাই করে।
// ব্যবহার: server ফোল্ডারে   node scripts/checkFix.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => {
  try {
    return fs.readFileSync(path.join(root, f), "utf8");
  } catch {
    return null;
  }
};

const checks = [
  [
    "config/config.js",
    (s) => s.includes("export const mediaPath"),
    "`export const mediaPath = ...` লাইন নেই → নতুন config.js বসান",
  ],
  [
    "services/imageService.js",
    (s) => s.includes("export async function ensureLocalImage"),
    "`ensureLocalImage` ফাংশন নেই → নতুন imageService.js বসান",
  ],
  [
    "jobs/publishJob.js",
    (s) => s.includes("await ensureLocalImage("),
    "পোস্টের আগে `ensureLocalImage` ডাকা হচ্ছে না → নতুন publishJob.js বসান",
  ],
  [
    "jobs/publishJob.js",
    (s) => !s.includes("filePath: asset.local_path"),
    "এখনো পুরোনো `filePath: asset.local_path` আছে (এটাই ENOENT-এর কারণ) → নতুন publishJob.js বসান",
  ],
  [
    "services/cleanup.js",
    (s) => s.includes("mediaPath("),
    "cleanup.js-এ `mediaPath(` নেই → নতুন cleanup.js বসান",
  ],
];

let bad = 0;
for (const [file, ok, hint] of checks) {
  const s = read(file);
  if (s === null) {
    console.log(`❌ ${file}: ফাইলই পাওয়া যায়নি`);
    bad++;
    continue;
  }
  if (ok(s)) console.log(`✅ ${file}`);
  else {
    console.log(`❌ ${file}\n   ${hint}`);
    bad++;
  }
}
console.log(
  bad
    ? `\n${bad}টি বদল বাকি আছে।`
    : "\n✅ সব বদল বসানো আছে। ডেপ্লয় করলেই ফাইলের সমস্যা মিটবে।",
);
process.exit(bad ? 1 : 0);
