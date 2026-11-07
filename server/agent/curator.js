// নিশ অনুযায়ী ছবি বাছাই: কিওয়ার্ড + সাল + তথ্যের সম্পূর্ণতা দিয়ে স্কোর। কোনো AI/API লাগে না।
import { GLOBAL_EXCLUDE } from "./niches.js";
import { metaOf } from "./meta.js";

const has = (text, kw) => text.includes(kw.toLowerCase());

export function scoreAsset(asset, profile) {
  const m = metaOf(asset);
  const fields = [
    [asset.title, 3],
    [m.tags.join(" "), 3],
    [m.subjects.join(" "), 2],
    [m.classification, 1],
    [m.description, 1.5],
    [asset.creator, 1],
    [m.medium, 0.5],
  ].map(([t, w]) => [String(t || "").toLowerCase(), w]);

  const all = fields.map(([t]) => t).join(" | ");
  const banned = [...GLOBAL_EXCLUDE, ...(profile.exclude || [])];
  if (banned.some((k) => has(all, k)))
    return { score: -Infinity, reason: "বাদ-তালিকার শব্দ" };
  if (!asset.title) return { score: -Infinity, reason: "শিরোনাম নেই" };

  let score = 0;
  const hits = [];
  for (const kw of profile.include || []) {
    for (const [t, w] of fields) {
      if (t && has(t, kw)) {
        score += w;
        hits.push(kw);
        break;
      }
    }
  }

  // সাল মিললে বোনাস, মেলেনি জানা থাকলে বাদ
  if (
    profile.yearFrom != null &&
    profile.yearTo != null &&
    m.beginYear != null
  ) {
    const end = m.endYear ?? m.beginYear;
    const overlaps = m.beginYear <= profile.yearTo && end >= profile.yearFrom;
    score += overlaps ? 3 : -4;
  }

  // তথ্য যত বেশি, লেখা তত ভালো হবে
  score +=
    0.5 *
    [asset.creator, asset.date_text, m.medium, m.description].filter(Boolean)
      .length;

  return { score, reason: hits.slice(0, 5).join(", ") };
}

export function rank(assets, profile) {
  return assets
    .map((a) => ({ asset: a, ...scoreAsset(a, profile) }))
    .filter((x) => x.score >= (profile.minScore ?? 3))
    .sort((a, b) => b.score - a.score);
}

// সেরা কয়েকটির মধ্যে এলোমেলোভাবে নেওয়া, যেন প্রতিবার একই ধাঁচের ছবি না আসে
export function shuffleTop(ranked, n = 12) {
  const top = ranked.slice(0, n);
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top[i], top[j]] = [top[j], top[i]];
  }
  return [...top, ...ranked.slice(n)];
}
