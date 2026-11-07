import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { Setting } from "../models/Setting.js";
import { audit } from "../utils/audit.js";
import { cleanup, mediaStats } from "../services/cleanup.js";
const router = Router();

router.get("/status", async (req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    killSwitch: Setting.killSwitchOn(),
    media: await mediaStats(),
    pages: count("SELECT COUNT(*) n FROM pages"),
    assets: {
      approved: count(
        "SELECT COUNT(*) n FROM assets WHERE license_status='approved'",
      ),
      review: count(
        "SELECT COUNT(*) n FROM assets WHERE license_status='review'",
      ),
      rejected: count(
        "SELECT COUNT(*) n FROM assets WHERE license_status='rejected'",
      ),
    },
    posts: {
      scheduled: count("SELECT COUNT(*) n FROM posts WHERE status='scheduled'"),
      posted: count("SELECT COUNT(*) n FROM posts WHERE status='posted'"),
      failed: count("SELECT COUNT(*) n FROM posts WHERE status='failed'"),
    },
  });
});

router.post("/kill-switch", (req, res) => {
  const { on } = z.object({ on: z.boolean() }).parse(req.body);
  Setting.set("kill_switch", on);
  audit("kill_switch", { on });
  res.json({ killSwitch: on });
});

router.post("/cleanup", async (req, res) => {
  res.json(await cleanup());
});

router.get("/logs", (req, res) => {
  res.json(
    db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 100").all(),
  );
});

export default router;
