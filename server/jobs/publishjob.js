import cron from "node-cron";
import { Post } from "../models/post.js";
import { Page } from "../models/page.js";
import { Asset } from "../models/Asset.js";
import { Setting } from "../models/Setting.js";
import { decrypt } from "../services/tokenVault.js";
import { publishPhoto } from "../services/facebookService.js";
import { ensureLocalImage } from "../services/imageService.js";
import { audit } from "../utils/audit.js";

const MAX_LATE_MS = 3 * 3600_000; // ৩ ঘণ্টার বেশি দেরি হলে আর পোস্ট করা হয় না

// Facebook-এর যে ত্রুটিতে পেজ বন্ধ করা উচিত: টোকেন নষ্ট (190), অনুমতি নেই (10, 200-299), পলিসি-ব্লক (368)।
// বাকি ত্রুটিতে (ফাইল, নেটওয়ার্ক, রেট লিমিট) শুধু ওই একটি পোস্ট ব্যর্থ হয়, পেজ চালু থাকে।
const isFatal = (code) =>
  code === 190 || code === 10 || (code >= 200 && code <= 299) || code === 368;

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

      // সার্ভার বন্ধ থাকায় অনেক দেরি হয়ে গেলে বাসি পোস্ট একসাথে ছাড়া হয় না
      if (Date.now() - new Date(post.scheduled_at).getTime() > MAX_LATE_MS) {
        Post.markFailed(
          post.id,
          "সময় পেরিয়ে গেছে (সার্ভার বন্ধ ছিল?), পোস্ট করা হয়নি",
        );
        continue;
      }

      const page = Page.withTokenById(post.page_id);
      const asset = Asset.byId(post.asset_id);
      if (!page || !page.active) continue; // নিষ্ক্রিয় পেজের পোস্ট অপেক্ষায় থাকে
      if (!asset || asset.license_status !== "approved") {
        Post.markFailed(post.id, "ছবি approved নয়");
        continue;
      }
      if (Post.postedSince(page.id, startOfTodayIso()) >= page.daily_limit)
        continue; // আজকের সীমা শেষ

      const credit = `\n\nImage: ${asset.title}${asset.creator ? ` — ${asset.creator}` : ""} (${asset.source.toUpperCase()} Open Access)`;
      try {
        const filePath = await ensureLocalImage(asset); // ফাইল না থাকলে আবার নামায়
        const fbId = await publishPhoto({
          fbPageId: page.fb_page_id,
          token: decrypt(page.encrypted_token),
          filePath,
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
        if (isFatal(e.fbCode)) {
          Page.setActive(page.id, false); // টোকেন/অনুমতির সমস্যায় ওই পেজের পোস্টিং থামে
          audit("page_paused", { page: page.name, code: e.fbCode });
        }
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
