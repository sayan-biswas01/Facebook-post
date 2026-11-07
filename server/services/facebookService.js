import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config/config.js";

/** অফিসিয়াল Graph API দিয়ে পেজে ছবি পোস্ট। (ভিডিও/রিল পরের ধাপে) */
export async function publishPhoto({ fbPageId, token, filePath, caption }) {
  const form = new FormData();
  form.append("caption", caption);
  form.append("access_token", token);
  form.append(
    "source",
    new Blob([await fs.readFile(filePath)]),
    path.basename(filePath),
  );

  const res = await fetch(
    `https://graph.facebook.com/${config.fbVersion}/${fbPageId}/photos`,
    {
      method: "POST",
      body: form,
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    const err = new Error(e.message || `Facebook API ত্রুটি (${res.status})`);
    err.fbCode = e.code;
    throw err;
  }
  return json.post_id || json.id;
}
