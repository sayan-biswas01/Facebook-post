// Art Institute of Chicago API - কী লাগে না। ডক: https://api.artic.edu/docs
const BASE = "https://api.artic.edu/api/v1";
const IIIF = "https://www.artic.edu/iiif/2";
const HEADERS = { "User-Agent": "facebook-post-tool/1.0" };
const FIELDS = [
  "id",
  "title",
  "artist_display",
  "date_display",
  "date_start",
  "date_end",
  "image_id",
  "is_public_domain",
  "description",
  "short_description",
  "place_of_origin",
  "medium_display",
  "classification_title",
  "subject_titles",
  "theme_titles",
  "term_titles",
  "style_title",
  "department_title",
].join(",");

export const sourceName = "artic";

export async function searchIds(q) {
  const params = new URLSearchParams({
    q,
    "query[term][is_public_domain]": "true",
    fields: "id",
    limit: "100",
  });
  const res = await fetch(`${BASE}/artworks/search?${params}`, {
    headers: HEADERS,
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`ARTIC search ব্যর্থ (${res.status}) ${body}`);
  }
  const json = await res.json();
  return (json.data || []).map((d) => String(d.id));
}

export async function getItem(id) {
  const res = await fetch(`${BASE}/artworks/${id}?fields=${FIELDS}`, {
    headers: HEADERS,
  });
  if (!res.ok) return null;
  const o = (await res.json()).data;
  return {
    source: sourceName,
    sourceId: String(o.id),
    title: o.title || "",
    creator: (o.artist_display || "").split("\n")[0],
    dateText: o.date_display || "",
    imageUrl: o.image_id ? `${IIIF}/${o.image_id}/full/843,/0/default.jpg` : "",
    pageUrl: `https://www.artic.edu/artworks/${o.id}`,
    license: { field: "is_public_domain", value: o.is_public_domain },
    raw: o,
  };
}

export function extractMeta(o) {
  const lines = (o.artist_display || "").split("\n");
  return {
    tags: [...(o.term_titles || []), ...(o.style_title ? [o.style_title] : [])],
    subjects: [...(o.subject_titles || []), ...(o.theme_titles || [])],
    classification: o.classification_title || "",
    medium: o.medium_display || "",
    department: o.department_title || "",
    place: o.place_of_origin || "",
    description: o.description || o.short_description || "",
    creatorBio: lines.slice(1).join(" ").trim(),
    beginYear: Number.isFinite(o.date_start) ? o.date_start : null,
    endYear: Number.isFinite(o.date_end) ? o.date_end : null,
  };
}
