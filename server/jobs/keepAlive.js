import cron from "node-cron";

export function startKeepAlive() {
  const base = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!base) return;
  const target = `${base.replace(/\/$/, "")}/health`;

  cron.schedule("*/10 * * * *", async () => {
    try {
      const r = await fetch(target, {
        headers: { "User-Agent": "keep-alive" },
      });
      console.log(
        `[keep-alive] ${new Date().toLocaleTimeString()} → ${r.status}`,
      );
    } catch (e) {
      console.error("[keep-alive] ব্যর্থ:", e.message);
    }
  });
  console.log(`[keep-alive] চালু: প্রতি ১০ মিনিটে ${target}`);
}
