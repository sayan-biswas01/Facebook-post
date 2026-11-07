import { db } from "../config/db.js";

export function audit(action, details = "") {
  db.prepare("INSERT INTO audit_log (action, details) VALUES (?, ?)").run(
    action,
    typeof details === "string" ? details : JSON.stringify(details),
  );
}
