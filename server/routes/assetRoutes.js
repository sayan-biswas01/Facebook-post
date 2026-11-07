import { Router } from "express";
import { z } from "zod";
import { Asset } from "../models/Asset.js";
import { ingest } from "../services/ingest.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/", (req, res) => {
  const status = ["approved", "review", "rejected"].includes(req.query.status)
    ? req.query.status
    : null;
  res.json(Asset.list(status));
});

router.post("/fetch", async (req, res) => {
  const b = z
    .object({
      source: z.string().default("met"),
      query: z.string().min(2),
      limit: z.coerce.number().int().min(1).max(30).default(10),
    })
    .parse(req.body);
  res.json(await ingest(b));
});

// শুধু review অবস্থার ছবি হাতে approve/reject করা যায়। rejected কখনো approve হবে না।
router.patch("/:id/review", (req, res) => {
  const { action } = z
    .object({ action: z.enum(["approve", "reject"]) })
    .parse(req.body);
  const asset = Asset.byId(Number(req.params.id));
  if (!asset) return res.status(404).json({ error: "পাওয়া যায়নি" });
  if (asset.license_status === "rejected") {
    return res.status(400).json({ error: "rejected ছবি approve করা যাবে না" });
  }
  if (action === "approve")
    Asset.setStatus(asset.id, "approved", "হাতে যাচাই করা");
  else Asset.setStatus(asset.id, "rejected", "হাতে বাতিল");
  audit("asset_review", { id: asset.id, action });
  res.json({ ok: true });
});

export default router;
