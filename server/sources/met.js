// The Met Open Access API - কী লাগে না। ডক: https://metmuseum.github.io
// দ্রষ্টব্য: পুরোনো /v1/search ২০২৬-১০-০১ এ বন্ধ হয়েছে, এখন /v1.1/search (offset + limit দিয়ে পেজ করা)।
const BASE = "https://collectionapi.metmuseum.org/public/collection";
const AMERICAN_WING = 1; // departmentId
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const HEADERS = { "User-Agent": "facebook-post-tool/1.0" };

export const sourceName = "met";

// উত্তরে আইডির তালিকা কোন নামে আছে তা না জানলেও কাজ চালানোর জন্য একাধিক সম্ভাবনা দেখা হয়
function extractIds(json) {
  const key = ["objectIDs", "objects", "results", "data", "items"].find(
    (k) => k in json,
  );
  if (!key) {
    throw new Error(
      `Met-এর উত্তরের আকার অচেনা। পাওয়া ফিল্ড: ${Object.keys(json).join(", ")}`,
    );
  }
  const list = json[key];
  if (list === null) return []; // কোনো ফল নেই
  if (!Array.isArray(list)) throw new Error(`Met-এর "${key}" ফিল্ড তালিকা নয়`);
  return list.map((x) =>
    String(x !== null && typeof x === "object" ? (x.objectID ?? x.id) : x),
  );
}

export async function searchIds(q) {
  const ids = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      q,
      hasImages: "true",
      isPublicDomain: "true",
      departmentId: String(AMERICAN_WING),
      offset: String(offset),
      limit: String(PAGE_SIZE),
    });
    const res = await fetch(`${BASE}/v1.1/search?${params}`, {
      headers: HEADERS,
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      throw new Error(`Met search ব্যর্থ (${res.status}) ${body}`);
    }
    const json = await res.json();
    const batch = extractIds(json);
    if (!batch.length) break;

    ids.push(...batch);
    offset += batch.length;
    if (typeof json.total === "number" && offset >= json.total) break;
  }
  return [...new Set(ids)];
}

export async function getItem(id) {
  const res = await fetch(`${BASE}/v1/objects/${id}`, { headers: HEADERS });
  if (!res.ok) return null;
  const o = await res.json();
  return {
    source: sourceName,
    sourceId: String(o.objectID),
    title: o.title || "",
    creator: o.artistDisplayName || "",
    dateText: o.objectDate || "",
    imageUrl: o.primaryImage || "",
    pageUrl: o.objectURL || "",
    license: { field: "isPublicDomain", value: o.isPublicDomain },
    raw: o,
  };
}

// এজেন্টের জন্য: কাঁচা ডেটা থেকে একই আকারের তথ্য বের করা
export function extractMeta(o) {
  return {
    tags: (o.tags || []).map((t) => t.term).filter(Boolean),
    subjects: [],
    classification: o.classification || o.objectName || "",
    medium: o.medium || "",
    department: o.department || "",
    place: [o.city, o.state, o.country].filter(Boolean).join(", "),
    description: "", // Met API-তে ওয়াল-টেক্সট নেই
    creatorBio: o.artistDisplayBio || "",
    beginYear: Number.isFinite(o.objectBeginDate) ? o.objectBeginDate : null,
    endYear: Number.isFinite(o.objectEndDate) ? o.objectEndDate : null,
  };
}
