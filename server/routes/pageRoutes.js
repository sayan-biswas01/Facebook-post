import { Router } from "express";
import { z } from "zod";
import { Page } from "../models/page.js";
import { encrypt } from "../services/tokenVault.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/", (req, res) => res.json(Page.all()));

router.post("/", (req, res) => {
  const b = z
    .object({
      name: z.string().min(1),
      fbPageId: z.string().regex(/^\d+$/, "Page ID শুধু সংখ্যা হবে"),
      token: z.string().min(20, "Page access token দিন"),
      niche: z.string().optional(),
      dailyLimit: z.coerce.number().int().min(1).max(10).default(3),
    })
    .parse(req.body);
  const id = Page.create({ ...b, encryptedToken: encrypt(b.token) });
  audit("page_add", { id, name: b.name });
  res.status(201).json(Page.publicById(id));
});

router.patch("/:id/active", (req, res) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  Page.setActive(Number(req.params.id), active);
  res.json(Page.publicById(Number(req.params.id)));
});

router.delete("/:id", (req, res) => {
  Page.remove(Number(req.params.id));
  audit("page_remove", { id: req.params.id });
  res.json({ ok: true });
});

export default router;
