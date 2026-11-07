// // লেখা সাজানো: শুধু উৎসের তথ্য + আপনার নিজের লেখা লাইন (content/*.json)। কোনো AI/API লাগে না।
// // কোনো তথ্য বানানো হয় না, যে তথ্য নেই সেই অংশ বাদ যায়।
// import fs from "node:fs";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
// import { firstSentences, metaOf } from "./meta.js";

// const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "content");
// const pick = (arr) =>
//   arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : "";

// function loadContent(niche) {
//   const out = { intros: [], contexts: [], closers: [] };
//   for (const name of ["default", niche]) {
//     try {
//       const j = JSON.parse(
//         fs.readFileSync(path.join(dir, `${name}.json`), "utf8"),
//       );
//       for (const k of Object.keys(out)) out[k].push(...(j[k] || []));
//     } catch {
//       /* ফাইল না থাকলে বাদ */
//     }
//   }
//   return out;
// }

// function tags(profile) {
//   const list = [...(profile.hashtags || [])].sort(() => Math.random() - 0.5);
//   return list.slice(0, 3).join(" ");
// }

// const q = (s) => `\u201C${s}\u201D`;

// // প্রতিটি ফরম্যাট টেক্সট ফেরত দেয়; দরকারি তথ্য না থাকলে null
// const FORMATS = {
//   story(a, m, c, profile) {
//     const by = a.creator ? ` by ${a.creator}` : "";
//     const when = a.date_text ? `, ${a.date_text}` : "";
//     const desc = firstSentences(m.description);
//     const body =
//       desc ||
//       (m.medium ? `${pick(["Medium:", "Materials:"])} ${m.medium}.` : "");
//     return [
//       pick(c.intros),
//       `${q(a.title)}${by}${when}.`,
//       body,
//       pick(c.contexts),
//       pick(c.closers),
//       tags(profile),
//     ];
//   },
//   didYouKnow(a, m, c, profile) {
//     const ctx = pick(c.contexts);
//     if (!ctx) return null;
//     const when = a.date_text ? ` (${a.date_text})` : "";
//     return [
//       `Did you know? ${ctx}`,
//       `${q(a.title)}${when} is from the same era.`,
//       firstSentences(m.description, 200, 1),
//       tags(profile),
//     ];
//   },
//   question(a, m, c, profile) {
//     const by = a.creator ? ` by ${a.creator}` : "";
//     const when = a.date_text ? ` (${a.date_text})` : "";
//     const desc =
//       firstSentences(m.description, 220, 1) ||
//       (m.medium ? `Medium: ${m.medium}.` : "");
//     const ask = pick([
//       "What is the first detail that catches your eye?",
//       "What do you think life was like when this was made? Tell us in the comments.",
//       "If you could ask the maker one question, what would it be?",
//       "Would you have recognized this scene? Share your thoughts below.",
//     ]);
//     return [`${q(a.title)}${by}${when}.`, desc, ask, tags(profile)];
//   },
//   detail(a, m, c, profile) {
//     const desc = firstSentences(m.description, 300, 2);
//     if (!m.medium && !desc) return null;
//     const lead = pick([
//       "Look closer.",
//       "Details matter.",
//       "Take a moment with this one.",
//     ]);
//     const mat = m.medium ? `Medium: ${m.medium}.` : "";
//     return [
//       lead,
//       `${q(a.title)}${a.date_text ? `, ${a.date_text}` : ""}.`,
//       mat,
//       desc,
//       tags(profile),
//     ];
//   },
//   maker(a, m, c, profile) {
//     if (!a.creator) return null;
//     const bio = m.creatorBio ? ` (${m.creatorBio})` : "";
//     const when = a.date_text ? `, ${a.date_text}` : "";
//     return [
//       `Behind the work: ${a.creator}${bio}.`,
//       `${q(a.title)}${when}.`,
//       m.medium ? `Medium: ${m.medium}.` : "",
//       pick(c.contexts),
//       tags(profile),
//     ];
//   },
// };

// const compose = (parts) =>
//   parts.filter((p) => p && String(p).trim()).join("\n\n");

// function weightedOrder(weights, exclude) {
//   const items = Object.entries(weights).filter(
//     ([k]) => FORMATS[k] && k !== exclude,
//   );
//   const out = [];
//   let pool = items.map(([k, w]) => ({ k, w: Math.max(0.01, w) }));
//   while (pool.length) {
//     const total = pool.reduce((s, x) => s + x.w, 0);
//     let r = Math.random() * total;
//     const i = pool.findIndex((x) => (r -= x.w) < 0);
//     out.push(pool[i >= 0 ? i : 0].k);
//     pool.splice(i >= 0 ? i : 0, 1);
//   }
//   return out;
// }

// /** আগের ফরম্যাট বাদ দিয়ে ওজন অনুযায়ী বেছে লেখা তৈরি। ফেরত: { format, text } বা null */
// export function write(rawAsset, profile, lastFormat = "") {
//   // "Unknown", "Anonymous" ধরনের শিল্পীর নাম লেখায় আনা হয় না
//   const asset = /^(unknown|anonymous|artist unknown)/i.test(
//     rawAsset.creator || "",
//   )
//     ? { ...rawAsset, creator: "" }
//     : rawAsset;
//   const m = metaOf(asset);
//   const c = loadContent(profile.nicheKey);
//   const order = weightedOrder(profile.formats, lastFormat);
//   if (!order.includes("story")) order.push("story");
//   for (const name of order) {
//     const text = compose(FORMATS[name](asset, m, c, profile) || []);
//     if (text.length >= 80) return { format: name, text };
//     if (FORMATS[name](asset, m, c, profile) && name !== "story") {
//       // ছোট হলে প্রসঙ্গের একটি লাইন যোগ করে আবার দেখা
//       const longer = compose([
//         ...(FORMATS[name](asset, m, c, profile) || []),
//         pick(c.contexts),
//         pick(c.intros),
//       ]);
//       if (longer.length >= 80) return { format: name, text: longer };
//     }
//   }
//   return null; // এই ছবির জন্য যথেষ্ট তথ্য নেই
// }

// লেখা সাজানো: শুধু উৎসের তথ্য + আপনার নিজের লেখা লাইন (content/*.json)। কোনো AI/API লাগে না।
// কোনো তথ্য বানানো হয় না, যে তথ্য নেই সেই অংশ বাদ যায়।
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { firstSentences, metaOf } from "./meta.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "content");
const pick = (arr) =>
  arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : "";

function loadContent(niche) {
  const out = { intros: [], contexts: [], closers: [] };
  for (const name of ["default", niche]) {
    try {
      const j = JSON.parse(
        fs.readFileSync(path.join(dir, `${name}.json`), "utf8"),
      );
      for (const k of Object.keys(out)) out[k].push(...(j[k] || []));
    } catch {
      /* ফাইল না থাকলে বাদ */
    }
  }
  return out;
}

function tags(profile) {
  const list = [...(profile.hashtags || [])].sort(() => Math.random() - 0.5);
  return list.slice(0, 3).join(" ");
}

const q = (s) => `\u201C${s}\u201D`;

// সাম্প্রতিক ৮টি প্রসঙ্গ-লাইন মনে রাখা হয়, যেন একই লাইন বারবার না আসে
const recent = [];
function pickFresh(arr) {
  const fresh = (arr || []).filter((x) => !recent.includes(x));
  const v = pick(fresh.length ? fresh : arr);
  if (v) {
    recent.push(v);
    if (recent.length > 8) recent.shift();
  }
  return v;
}

// প্রতিটি ফরম্যাট টেক্সট ফেরত দেয়; দরকারি তথ্য না থাকলে null
const FORMATS = {
  story(a, m, c, profile) {
    const by = a.creator ? ` by ${a.creator}` : "";
    const when = a.date_text ? `, ${a.date_text}` : "";
    const desc = firstSentences(m.description);
    const body =
      desc ||
      (m.medium ? `${pick(["Medium:", "Materials:"])} ${m.medium}.` : "");
    return [
      pick(c.intros),
      `${q(a.title)}${by}${when}.`,
      body,
      pickFresh(c.contexts),
      pick(c.closers),
      tags(profile),
    ];
  },
  didYouKnow(a, m, c, profile) {
    const ctx = pickFresh(c.contexts);
    if (!ctx) return null;
    const when = a.date_text ? ` (${a.date_text})` : "";
    return [
      `Did you know? ${ctx}`,
      `From the collection: ${q(a.title)}${when}.`,
      firstSentences(m.description, 200, 1),
      tags(profile),
    ];
  },
  question(a, m, c, profile) {
    const by = a.creator ? ` by ${a.creator}` : "";
    const when = a.date_text ? ` (${a.date_text})` : "";
    const desc =
      firstSentences(m.description, 220, 1) ||
      (m.medium ? `Medium: ${m.medium}.` : "");
    const ask = pick([
      "What is the first detail that catches your eye?",
      "What do you think life was like when this was made? Tell us in the comments.",
      "If you could ask the maker one question, what would it be?",
      "Would you have recognized this scene? Share your thoughts below.",
    ]);
    return [`${q(a.title)}${by}${when}.`, desc, ask, tags(profile)];
  },
  detail(a, m, c, profile) {
    const desc = firstSentences(m.description, 300, 2);
    if (!m.medium && !desc) return null;
    const lead = pick([
      "Look closer.",
      "Details matter.",
      "Take a moment with this one.",
    ]);
    const mat = m.medium ? `Medium: ${m.medium}.` : "";
    return [
      lead,
      `${q(a.title)}${a.date_text ? `, ${a.date_text}` : ""}.`,
      mat,
      desc,
      tags(profile),
    ];
  },
  maker(a, m, c, profile) {
    if (!a.creator) return null;
    const bio = m.creatorBio ? ` (${m.creatorBio})` : "";
    const when = a.date_text ? `, ${a.date_text}` : "";
    return [
      `Behind the work: ${a.creator}${bio}.`,
      `${q(a.title)}${when}.`,
      m.medium ? `Medium: ${m.medium}.` : "",
      pickFresh(c.contexts),
      tags(profile),
    ];
  },
};

const compose = (parts) =>
  parts.filter((p) => p && String(p).trim()).join("\n\n");

function weightedOrder(weights, exclude) {
  const items = Object.entries(weights).filter(
    ([k]) => FORMATS[k] && k !== exclude,
  );
  const out = [];
  let pool = items.map(([k, w]) => ({ k, w: Math.max(0.01, w) }));
  while (pool.length) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    const i = pool.findIndex((x) => (r -= x.w) < 0);
    out.push(pool[i >= 0 ? i : 0].k);
    pool.splice(i >= 0 ? i : 0, 1);
  }
  return out;
}

/** আগের ফরম্যাট বাদ দিয়ে ওজন অনুযায়ী বেছে লেখা তৈরি। ফেরত: { format, text } বা null */
export function write(rawAsset, profile, lastFormat = "") {
  // "Unknown", "Anonymous" ধরনের শিল্পীর নাম লেখায় আনা হয় না
  const asset = /^(unknown|anonymous|artist unknown)/i.test(
    rawAsset.creator || "",
  )
    ? { ...rawAsset, creator: "" }
    : rawAsset;
  const m = metaOf(asset);
  const c = loadContent(profile.nicheKey);
  const order = weightedOrder(profile.formats, lastFormat);
  if (!order.includes("story")) order.push("story");
  for (const name of order) {
    const parts = FORMATS[name](asset, m, c, profile);
    if (!parts) continue;
    const text = compose(parts);
    if (text.length >= 80) return { format: name, text };
    // ছোট হলে প্রসঙ্গের একটি লাইন যোগ করে আবার দেখা
    const longer = compose([...parts, pickFresh(c.contexts), pick(c.intros)]);
    if (longer.length >= 80) return { format: name, text: longer };
  }
  return null; // এই ছবির জন্য যথেষ্ট তথ্য নেই
}
