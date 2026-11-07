import { SOURCES } from "../sources/index.js";

// ছবির সংরক্ষিত কাঁচা ডেটা (raw_json) থেকে উৎস-অনুযায়ী তথ্য বের করা
export function metaOf(asset) {
  const empty = {
    tags: [],
    subjects: [],
    classification: "",
    medium: "",
    department: "",
    place: "",
    description: "",
    creatorBio: "",
    beginYear: null,
    endYear: null,
  };
  try {
    const raw = JSON.parse(asset.raw_json || "{}");
    const src = SOURCES[asset.source];
    return src?.extractMeta ? { ...empty, ...src.extractMeta(raw) } : empty;
  } catch {
    return empty;
  }
}

export function cleanText(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstSentences(text, maxChars = 280, maxSentences = 2) {
  const t = cleanText(text);
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of parts.slice(0, maxSentences)) {
    if ((out + " " + s).trim().length > maxChars) break;
    out = (out + " " + s).trim();
  }
  return out;
}
