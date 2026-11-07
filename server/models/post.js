import { db } from "../config/db.js";

export const post = {
  list: () =>
    db
      .prepare(
        `SELECT p.id, p.page_id, pg.name AS page_name, p.asset_id, a.title AS asset_title, a.image_url,
                p.script_text, p.scheduled_at, p.status, p.fb_post_id, p.error, p.posted_at
         FROM posts p
         JOIN pages pg ON pg.id = p.page_id
         JOIN assets a ON a.id = p.asset_id
         ORDER BY p.scheduled_at DESC LIMIT 300`,
      )
      .all(),
  byId: (id) => db.prepare("SELECT * FROM posts WHERE id = ?").get(id),
  assetAlreadyUsed: (assetId) =>
    !!db
      .prepare(
        "SELECT 1 FROM posts WHERE asset_id = ? AND status IN ('scheduled','posted')",
      )
      .get(assetId),
  create: ({
    pageId,
    assetId,
    scriptText,
    scheduledAt,
    format = "",
    slotKey = "",
  }) =>
    db
      .prepare(
        "INSERT INTO posts (page_id, asset_id, script_text, scheduled_at, format, slot_key) VALUES (?,?,?,?,?,?)",
      )
      .run(pageId, assetId, scriptText, scheduledAt, format, slotKey)
      .lastInsertRowid,
  slotTaken: (pageId, slotKey) =>
    !!db
      .prepare(
        "SELECT 1 FROM posts WHERE page_id = ? AND slot_key = ? AND status IN ('scheduled','posted')",
      )
      .get(pageId, slotKey),
  lastFormat: (pageId) =>
    db
      .prepare(
        "SELECT format FROM posts WHERE page_id = ? AND format != '' AND status != 'cancelled' ORDER BY id DESC LIMIT 1",
      )
      .get(pageId)?.format || "",
  unusedApproved: () =>
    db
      .prepare(
        `SELECT * FROM assets WHERE license_status='approved' AND local_path IS NOT NULL
                AND id NOT IN (SELECT asset_id FROM posts WHERE status IN ('scheduled','posted'))`,
      )
      .all(),
  due: (nowIso) =>
    db
      .prepare(
        "SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= ? ORDER BY scheduled_at ASC",
      )
      .all(nowIso),
  postedSince: (pageId, sinceIso) =>
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM posts WHERE page_id = ? AND status = 'posted' AND posted_at >= ?",
      )
      .get(pageId, sinceIso).n,
  markPosted: (id, fbPostId) =>
    db
      .prepare(
        "UPDATE posts SET status='posted', fb_post_id=?, posted_at=?, error=NULL WHERE id=?",
      )
      .run(fbPostId, new Date().toISOString(), id),
  markFailed: (id, error) =>
    db
      .prepare("UPDATE posts SET status='failed', error=? WHERE id=?")
      .run(String(error).slice(0, 500), id),
  cancel: (id) =>
    db
      .prepare(
        "UPDATE posts SET status='cancelled' WHERE id=? AND status='scheduled'",
      )
      .run(id),
};
