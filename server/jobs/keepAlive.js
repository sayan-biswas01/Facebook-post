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

/////// utils/keepAlive.js
// import https from "node:https";
// import http from "node:http";

// export function startKeepAlive() {
//   // আপনার ডোমেন লিঙ্ক (Render Dashboard -> Environment-এ KEEP_ALIVE_URL সেট করতে পারেন অথবা সরাসরি স্ট্রিং বসিয়ে দিতে পারেন)
//   const appUrl = process.env.KEEP_ALIVE_URL || "https://your-service-name.onrender.com";
//   const targetUrl = `${appUrl.replace(/\/$/, "")}/health`;

//   // প্রোটোকল সিলেক্ট (https নাকি http)
//   const client = targetUrl.startsWith("https") ? https : http;

//   const INTERVAL = 8 * 60 * 1000; // ৮ মিনিট (Render ১৫ মিনিটে ঘুমায়, তাই ৮ মিনিট নিরাপদ)

//   console.log(`[Keep-Alive] সার্ভিস শুরু হয়েছে: ${targetUrl}`);

//   setInterval(() => {
//     client
//       .get(
//         targetUrl,
//         {
//           headers: {
//             "User-Agent": "RenderSelfPing/1.0",
//           },
//         },
//         (res) => {
//           // ডেটা ড্রেন করে মেমরি লিক আটকানো
//           res.on("data", () => {});
//           res.on("end", () => {
//             console.log(
//               `[Keep-Alive] পিং সফল: ${new Date().toLocaleTimeString()} (Status: ${res.statusCode})`
//             );
//           });
//         }
//       )
//       .on("error", (err) => {
//         console.error(`[Keep-Alive] পিং ব্যর্থ: ${err.message}`);
//       });
//   }, INTERVAL);
// }
