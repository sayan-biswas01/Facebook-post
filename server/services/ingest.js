import { SOURCES } from "../sources/index.js";
import { checkLicense } from "./licenseGate.js";
import { downloadImage } from "./imageService.js";
import { Asset } from "../models/Asset.js";
import { audit } from "../utils/audit.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ingest({ source, query, limit }) {
  const src = SOURCES[source];
  if (!src) throw new Error("অজানা উৎস");

  const ids = await src.searchIds(query);
  const stats = {
    checked: 0,
    approved: 0,
    review: 0,
    rejected: 0,
    duplicates: 0,
    errors: 0,
  };

  for (const id of ids) {
    if (stats.approved + stats.review >= limit || stats.checked >= limit * 5)
      break;
    if (Asset.exists(source, id)) continue;
    stats.checked++;

    try {
      const item = await src.getItem(id);
      if (!item) {
        stats.errors++;
        continue;
      }

      const gate = checkLicense(item);
      const base = {
        source: item.source,
        sourceId: item.sourceId,
        title: item.title,
        creator: item.creator,
        dateText: item.dateText,
        imageUrl: item.imageUrl,
        pageUrl: item.pageUrl,
        licenseField: item.license?.field ?? "",
        licenseValue: String(item.license?.value ?? ""),
        licenseStatus: gate.status,
        rejectReason: gate.reason,
        rawJson: JSON.stringify(item.raw ?? {}),
        localPath: null,
        hash: null,
      };

      if (gate.status === "rejected") {
        Asset.insert(base);
        stats.rejected++;
      } else {
        const { hash, localPath } = await downloadImage(item.imageUrl);
        if (Asset.existsHash(hash)) {
          stats.duplicates++;
          continue;
        }
        Asset.insert({ ...base, hash, localPath });
        stats[gate.status]++;
      }
    } catch (e) {
      stats.errors++;
    }
    await sleep(120); // উৎসের API-কে ধীরে ডাকা
  }

  audit("ingest", { source, query, ...stats });
  return stats;
}
