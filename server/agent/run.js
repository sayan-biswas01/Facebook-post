import { NICHES, DEFAULTS } from "./niches.js";
import { rank, shuffleTop } from "./curator.js";
import { write } from "./formats.js";
import { zonedToUtc, localDate, addDays } from "./timeutil.js";
import { Page } from "../models/page.js";
import { Post } from "../models/Post.js";
import { Setting } from "../models/Setting.js";
import { SOURCES } from "../sources/index.js";
import { ingest } from "../services/ingest.js";
import { audit } from "../utils/audit.js";

export function resolveProfile(raw) {
  const preset = NICHES[raw.niche] || null;
  if (!preset) return null;
  return {
    ...DEFAULTS,
    ...preset,
    ...raw,
    nicheKey: raw.niche,
    include: [...preset.include, ...(raw.extraInclude || [])],
    exclude: [...(preset.exclude || []), ...(raw.extraExclude || [])],
    formats: { ...DEFAULTS.formats, ...(raw.formats || {}) },
  };
}

// আগামী ২ দিনের (পেজের টাইমজোন অনুযায়ী) খালি স্লট, প্রতিটিতে ±১৫ মিনিট এলোমেলো সরানো
export function planSlots(page, profile, now = new Date()) {
  const out = [];
  const today = localDate(now, profile.tz);
  for (const day of [today, addDays(today, 1)]) {
    for (const t of profile.slots.slice(0, page.daily_limit)) {
      const slotKey = `${day}T${t}`;
      if (Post.slotTaken(page.id, slotKey)) continue;
      const jitter = (Math.floor(Math.random() * 31) - 15) * 60_000;
      const when = new Date(zonedToUtc(day, t, profile.tz).getTime() + jitter);
      if (when.getTime() < now.getTime() + 5 * 60_000) continue;
      out.push({ slotKey, when });
    }
  }
  return out;
}

async function refill(profile, log) {
  for (const [name] of Object.entries(SOURCES)) {
    const queries = [...profile.queries]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    for (const query of queries) {
      try {
        const r = await ingest({ source: name, query, limit: 6 });
        log.push(
          `refill ${name} "${query}": approved ${r.approved}, rejected ${r.rejected}`,
        );
      } catch (e) {
        log.push(`refill ${name} "${query}" ব্যর্থ: ${e.message}`);
      }
    }
  }
}

export async function runAgent({
  dryRun = false,
  pageId = null,
  now = new Date(),
} = {}) {
  if (Setting.killSwitchOn()) return { skipped: "kill switch চালু", pages: [] };
  const report = { pages: [], log: [] };

  for (const row of Page.allWithProfile()) {
    if (!row.active || (pageId && row.id !== pageId)) continue;
    let raw = {};
    try {
      raw = row.profile_json ? JSON.parse(row.profile_json) : {};
    } catch {
      /* ignore */
    }
    if (!raw.auto) continue;
    const profile = resolveProfile(raw);
    if (!profile) {
      report.log.push(`${row.name}: নিশ বাছা হয়নি`);
      continue;
    }

    const slots = planSlots(row, profile, now);
    const entry = { page: row.name, planned: [] };
    report.pages.push(entry);
    if (!slots.length) continue;

    let ranked = rank(Post.unusedApproved(), profile);
    if (ranked.length < slots.length + 5 && !dryRun) {
      await refill(profile, report.log);
      ranked = rank(Post.unusedApproved(), profile);
    }
    const queue = shuffleTop(ranked);
    let last = Post.lastFormat(row.id);

    // for (const slot of slots) {
    //   let made = null;
    //   while (queue.length && !made) {
    //     const cand = queue.shift();
    //     const w = write(cand.asset, profile, last);
    //     if (w) made = { cand, ...w };
    //   }

    const usedCreators = new Set(); // একই শিল্পীর ছবি পরপর না আসার জন্য
    for (const slot of slots) {
      let made = null;
      while (queue.length && !made) {
        // নতুন শিল্পীর ছবি আগে নেওয়া; না থাকলে যেটা আছে সেটাই
        let idx = queue.findIndex(
          (c) => !c.asset.creator || !usedCreators.has(c.asset.creator),
        );
        if (idx === -1) idx = 0;
        const cand = queue.splice(idx, 1)[0];
        const w = write(cand.asset, profile, last);
        if (w) made = { cand, ...w };
      }
      if (made?.cand.asset.creator) usedCreators.add(made.cand.asset.creator);

      if (!made) {
        entry.planned.push({
          slot: slot.slotKey,
          error: "উপযুক্ত ছবি/তথ্য পাওয়া যায়নি",
        });
        break;
      }

      entry.planned.push({
        slot: slot.slotKey,
        at: slot.when.toISOString(),
        asset: made.cand.asset.title,
        score: Math.round(made.cand.score * 10) / 10,
        why: made.cand.reason,
        format: made.format,
        text: made.text,
      });
      last = made.format;
      if (!dryRun) {
        Post.create({
          pageId: row.id,
          assetId: made.cand.asset.id,
          scriptText: made.text,
          scheduledAt: slot.when.toISOString(),
          format: made.format,
          slotKey: slot.slotKey,
        });
      }
    }
    if (!dryRun)
      audit("agent_run", {
        page: row.name,
        created: entry.planned.filter((p) => p.text).length,
      });
  }
  return report;
}
