import cron from "node-cron";
import { cleanup } from "../services/cleanup.js";

const run = () =>
  cleanup()
    .then((s) =>
      console.log(
        `[cleanup] মুছেছে: পোস্ট হওয়া ${s.postedFiles}, বাড়তি ${s.poolTrimmed}, এতিম ${s.orphans}, খালি হয়েছে ${s.freedMB} MB`,
      ),
    )
    .catch((e) => console.error("[cleanup] ত্রুটি", e));

export function startCleanupJob() {
  cron.schedule("30 3 * * *", run); // প্রতি রাত ৩:৩০
  setTimeout(run, 30_000); // সার্ভার চালুর ৩০ সেকেন্ড পরে একবার (পিসি রাতে বন্ধ থাকলে)
}
