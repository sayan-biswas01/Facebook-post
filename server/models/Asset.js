import { db } from "../config/db.js";

const COLS =
  "id, source, source_id, title, creator, date_text, image_url, page_url, license_field, license_value, license_status, reject_reason, fetched_at";

export const Asset = {
  exists: (source, sourceId) =>
    !!db
      .prepare("SELECT 1 FROM assets WHERE source = ? AND source_id = ?")
      .get(source, sourceId),
  existsHash: (hash) =>
    !!db.prepare("SELECT 1 FROM assets WHERE hash = ?").get(hash),
  byId: (id) => db.prepare("SELECT * FROM assets WHERE id = ?").get(id),
  list: (status) =>
    status
      ? db
          .prepare(
            `SELECT ${COLS} FROM assets WHERE license_status = ? ORDER BY id DESC LIMIT 200`,
          )
          .all(status)
      : db
          .prepare(`SELECT ${COLS} FROM assets ORDER BY id DESC LIMIT 200`)
          .all(),
  insert: (a) =>
    db
      .prepare(
        `INSERT INTO assets (source, source_id, title, creator, date_text, image_url, page_url, local_path,
          license_field, license_value, license_status, reject_reason, hash, raw_json)
         VALUES (@source,@sourceId,@title,@creator,@dateText,@imageUrl,@pageUrl,@localPath,
          @licenseField,@licenseValue,@licenseStatus,@rejectReason,@hash,@rawJson)`,
      )
      .run(a).lastInsertRowid,
  setStatus: (id, status, reason = "") =>
    db
      .prepare(
        "UPDATE assets SET license_status = ?, reject_reason = ? WHERE id = ?",
      )
      .run(status, reason, id),
};
