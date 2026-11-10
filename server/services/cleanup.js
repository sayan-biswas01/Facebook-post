import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../config/db.js";
import { audit } from "../utils/audit.js";
import { config, mediaPath } from "../config/config.js";

/**
 * পুরোনো ফাইল মোছা। কখনো মুছে না: শিডিউল করা পোস্টের ছবি।
 *  ১. পোস্ট হয়ে যাওয়া ছবির ফাইল (keepPostedDays দিন পরে), রেকর্ড থাকে তাই একই ছবি আর পোস্ট হয় না
 *  ২. অব্যবহৃত approved ছবি maxPool এর বেশি হলে পুরোনোগুলো
 *  ৩. কোনো রেকর্ডে নেই এমন "এতিম" ফাইল (১ ঘণ্টার পুরোনো)
 *  ৪. ৬০ দিনের পুরোনো লগ
 */
export async function cleanup({ keepPostedDays = 3, maxPool = 300 } = {}) {
  const stats = {
    postedFiles: 0,
    poolTrimmed: 0,
    orphans: 0,
    logs: 0,
    freedMB: 0,
  };
  let freed = 0;
  const unlink = async (p) => {
    try {
      const st = await fs.stat(p);
      await fs.unlink(p);
      freed += st.size;
      return true;
    } catch {
      return false;
    }
  };

  // ১. পোস্ট হয়ে যাওয়া ছবি
  const cutoff = new Date(
    Date.now() - keepPostedDays * 86_400_000,
  ).toISOString();
  const posted = db
    .prepare(
      `SELECT a.id, a.local_path FROM assets a
       WHERE a.local_path IS NOT NULL
         AND EXISTS (SELECT 1 FROM posts p WHERE p.asset_id = a.id AND p.status = 'posted' AND p.posted_at < ?)
         AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.asset_id = a.id AND p.status = 'scheduled')`,
    )
    .all(cutoff);
  for (const r of posted) {
    // if (await unlink(r.local_path)) stats.postedFiles++;
    if (await unlink(mediaPath(r.local_path))) stats.postedFiles++;
    db.prepare("UPDATE assets SET local_path = NULL WHERE id = ?").run(r.id);
  }

  // ২. অব্যবহৃত ছবির ভাণ্ডার সীমিত রাখা (নতুনগুলো থাকে)
  const unused = db
    .prepare(
      `SELECT id, local_path FROM assets
       WHERE license_status = 'approved' AND local_path IS NOT NULL
         AND id NOT IN (SELECT asset_id FROM posts WHERE status IN ('scheduled','posted'))
       ORDER BY id DESC`,
    )
    .all();
  for (const r of unused.slice(maxPool)) {
    await unlink(mediaPath(r.local_path));
    const referenced = db
      .prepare("SELECT 1 FROM posts WHERE asset_id = ?")
      .get(r.id);
    if (referenced)
      db.prepare("UPDATE assets SET local_path = NULL WHERE id = ?").run(r.id);
    else db.prepare("DELETE FROM assets WHERE id = ?").run(r.id);
    stats.poolTrimmed++;
  }

  // ৩. এতিম ফাইল
  const known = new Set(
    db
      .prepare("SELECT local_path FROM assets WHERE local_path IS NOT NULL")
      .all()
      .map((r) => path.resolve(mediaPath(r.local_path))),
  );
  for (const file of await fs.readdir(config.mediaDir).catch(() => [])) {
    if (file.startsWith(".")) continue;
    const full = path.join(config.mediaDir, file);
    if (known.has(path.resolve(full))) continue;
    const st = await fs.stat(full).catch(() => null);
    if (st && Date.now() - st.mtimeMs > 3_600_000 && (await unlink(full)))
      stats.orphans++;
  }

  // ৪. পুরোনো লগ
  stats.logs = db
    .prepare("DELETE FROM audit_log WHERE time < datetime('now','-60 days')")
    .run().changes;

  stats.freedMB = Math.round((freed / 1048576) * 10) / 10;
  audit("cleanup", stats);
  return stats;
}

export async function mediaStats() {
  let files = 0;
  let bytes = 0;
  for (const f of await fs.readdir(config.mediaDir).catch(() => [])) {
    if (f.startsWith(".")) continue;
    const st = await fs.stat(path.join(config.mediaDir, f)).catch(() => null);
    if (st?.isFile()) {
      files++;
      bytes += st.size;
    }
  }
  return { files, mb: Math.round((bytes / 1048576) * 10) / 10 };
}
