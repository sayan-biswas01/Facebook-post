import cron from "node-cron";
import { runAgent } from "../agent/run.js";

let running = false;

export function startAgentJob() {
  // প্রতি ঘণ্টার ০৭ মিনিটে: আগামী ২ দিনের খালি স্লট ভরে দেয়
  cron.schedule("7 * * * *", async () => {
    if (running) return;
    running = true;
    try {
      const r = await runAgent();
      const created = (r.pages || []).reduce(
        (n, p) => n + p.planned.filter((x) => x.text).length,
        0,
      );
      console.log(
        `[agent] ${new Date().toLocaleTimeString()} চলেছে: নতুন পোস্ট ${created}${r.skipped ? ` (${r.skipped})` : ""}`,
      );
    } catch (e) {
      console.error("[agent] ত্রুটি", e);
    } finally {
      running = false;
    }
  });
}
