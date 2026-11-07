import { db } from "../config/db.js";

export const Setting = {
  get(key, fallback = null) {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? row.value : fallback;
  },
  set(key, value) {
    db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(key, String(value));
  },
  killSwitchOn() {
    return this.get("kill_switch", "false") === "true";
  },
};
