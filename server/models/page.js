import { db } from "../config/db.js";

const PUBLIC = "id, name, fb_page_id, niche, active, daily_limit, created_at";

export const Page = {
  all: () => db.prepare(`SELECT ${PUBLIC} FROM pages ORDER BY id DESC`).all(),
  publicById: (id) =>
    db.prepare(`SELECT ${PUBLIC} FROM pages WHERE id = ?`).get(id),
  withTokenById: (id) => db.prepare("SELECT * FROM pages WHERE id = ?").get(id),
  create: ({ name, fbPageId, encryptedToken, niche, dailyLimit }) =>
    db
      .prepare(
        "INSERT INTO pages (name, fb_page_id, encrypted_token, niche, daily_limit) VALUES (?,?,?,?,?)",
      )
      .run(name, fbPageId, encryptedToken, niche || "", dailyLimit)
      .lastInsertRowid,
  setActive: (id, active) =>
    db
      .prepare("UPDATE pages SET active = ? WHERE id = ?")
      .run(active ? 1 : 0, id),
  allWithProfile: () =>
    db
      .prepare("SELECT id, name, active, daily_limit, profile_json FROM pages")
      .all(),
  profile: (id) => {
    const r = db.prepare("SELECT profile_json FROM pages WHERE id = ?").get(id);
    try {
      return r && r.profile_json ? JSON.parse(r.profile_json) : {};
    } catch {
      return {};
    }
  },
  setProfile: (id, obj) =>
    db
      .prepare("UPDATE pages SET profile_json = ? WHERE id = ?")
      .run(JSON.stringify(obj), id),
  remove: (id) => db.prepare("DELETE FROM pages WHERE id = ?").run(id),
};
