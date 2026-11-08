import { Router } from "express";
import { z } from "zod";
import { Page } from "../models/page.js";
import { NICHES } from "../agent/niches.js";
import { runAgent } from "../agent/run.js";
import { validTz } from "../agent/timeutil.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/niches", (req, res) => {
  res.json(Object.entries(NICHES).map(([key, n]) => ({ key, label: n.label })));
});

router.get("/profile/:pageId", (req, res) => {
  res.json(Page.profile(Number(req.params.pageId)));
});

router.put("/profile/:pageId", (req, res) => {
  const b = z
    .object({
      auto: z.boolean(),
      niche: z.string().refine((k) => k in NICHES, "অচেনা নিশ"),
      tz: z.string().refine(validTz, "টাইমজোন সঠিক নয়"),
      slots: z
        .array(
          z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "সময় HH:MM আকারে দিন"),
        )
        .min(1)
        .max(10),
      extraInclude: z.array(z.string()).optional(),
      extraExclude: z.array(z.string()).optional(),
    })
    .parse(req.body);
  const id = Number(req.params.pageId);
  if (!Page.publicById(id))
    return res.status(404).json({ error: "পেজ পাওয়া যায়নি" });
  Page.setProfile(id, b);
  audit("agent_profile", { pageId: id, niche: b.niche, auto: b.auto });
  res.json(b);
});

// dryRun=true হলে কিছু শিডিউল হয় না, শুধু প্রিভিউ দেখায়
router.post("/run", async (req, res) => {
  const b = z
    .object({
      pageId: z.coerce.number().int().optional(),
      dryRun: z.boolean().default(true),
    })
    .parse(req.body);
  res.json(await runAgent({ dryRun: b.dryRun, pageId: b.pageId || null }));
});

export default router;
