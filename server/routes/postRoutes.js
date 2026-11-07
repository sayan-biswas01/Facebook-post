import { Router } from "express";
import { z } from "zod";
import { Post } from "../models/Post.js";
import { Asset } from "../models/Asset.js";
import { Page } from "../models/Page.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/", (req, res) => res.json(Post.list()));

router.post("/", (req, res) => {
  const b = z
    .object({
      pageId: z.coerce.number().int(),
      assetId: z.coerce.number().int(),
      scriptText: z
        .string()
        .trim()
        .min(80, "নিজের লেখা কমপক্ষে ৮০ অক্ষর হতে হবে"),
      scheduledAt: z.string().datetime({ message: "সময় সঠিক নয়" }),
    })
    .parse(req.body);

  const page = Page.publicById(b.pageId);
  if (!page) return res.status(404).json({ error: "পেজ পাওয়া যায়নি" });
  const asset = Asset.byId(b.assetId);
  if (!asset) return res.status(404).json({ error: "ছবি পাওয়া যায়নি" });
  if (asset.license_status !== "approved") {
    return res.status(400).json({ error: "শুধু approved ছবি পোস্ট করা যায়" });
  }
  if (Post.assetAlreadyUsed(asset.id)) {
    return res.status(400).json({ error: "এই ছবি আগেই শিডিউল/পোস্ট হয়েছে" });
  }
  if (new Date(b.scheduledAt).getTime() < Date.now() - 60_000) {
    return res.status(400).json({ error: "অতীতের সময় দেওয়া যাবে না" });
  }

  const id = Post.create(b);
  audit("post_schedule", { id, pageId: b.pageId, assetId: b.assetId });
  res.status(201).json(Post.byId(id));
});

router.delete("/:id", (req, res) => {
  Post.cancel(Number(req.params.id));
  audit("post_cancel", { id: req.params.id });
  res.json({ ok: true });
});

export default router;
