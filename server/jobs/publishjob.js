import cron from "node-cron";
import { Post } from "../models/Post.js";
import { Page } from "../models/page.js";
import { Asset } from "../models/Asset.js";
import { Setting } from "../models/Setting.js";
import { decrypt } from "../services/tokenVault.js";
import { publishPhoto } from "../services/facebookService.js";
import { audit } from "../utils/audit.js";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

let running = false;

export async function runOnce() {
  if (running) return;
  if (Setting.killSwitchOn()) return; // কিল সুইচ চালু থাকলে কিছুই পোস্ট হবে না
  running = true;
  try {
    for (const post of Post.due(new Date().toISOString())) {
      if (Setting.killSwitchOn()) break;

      const page = Page.withTokenById(post.page_id);
      const asset = Asset.byId(post.asset_id);
      if (!page || !page.active) continue; // নিষ্ক্রিয় পেজের পোস্ট অপেক্ষায় থাকে
      if (!asset || asset.license_status !== "approved" || !asset.local_path) {
        Post.markFailed(post.id, "ছবি approved নয় বা ফাইল নেই");
        continue;
      }
      if (Post.postedSince(page.id, startOfTodayIso()) >= page.daily_limit)
        continue; // আজকের সীমা শেষ

      const credit = `\n\nImage: ${asset.title}${asset.creator ? ` — ${asset.creator}` : ""} (${asset.source.toUpperCase()} Open Access)`;
      try {
        const fbId = await publishPhoto({
          fbPageId: page.fb_page_id,
          token: decrypt(page.encrypted_token),
          filePath: asset.local_path,
          caption: post.script_text + credit,
        });
        Post.markPosted(post.id, fbId);
        audit("post_published", { postId: post.id, page: page.name, fbId });
      } catch (e) {
        Post.markFailed(post.id, e.message);
        audit("post_failed", {
          postId: post.id,
          page: page.name,
          error: e.message,
          code: e.fbCode,
        });
        Page.setActive(page.id, false); // ত্রুটিতে ওই পেজের পোস্টিং থামে, আবার চেষ্টা নয়
      }
    }
  } finally {
    running = false;
  }
}

export function startPublishJob() {
  cron.schedule("* * * * *", () =>
    runOnce().catch((e) => console.error("publishJob", e)),
  );
}
