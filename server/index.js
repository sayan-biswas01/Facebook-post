// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import { config, missingEnv } from "./config/config.js";

// if (missingEnv.length) {
//   console.error(`.env এ এই মানগুলো নেই: ${missingEnv.join(", ")}`);
//   process.exit(1);
// }

// await import("./config/db.js");
// const { requireAuth } = await import("./middleware/auth.js");
// const { errorHandler } = await import("./middleware/errorHandler.js");
// const { default: authRoutes } = await import("./routes/authRoutes.js");
// const { default: pageRoutes } = await import("./routes/pageRoutes.js");
// const { default: assetRoutes } = await import("./routes/assetRoutes.js");
// const { default: postRoutes } = await import("./routes/postRoutes.js");
// const { default: systemRoutes } = await import("./routes/systemRoutes.js");
// const { default: agentRoutes } = await import("./routes/agentRoutes.js");

// const { startPublishJob } = await import("./jobs/publishjob.js");
// const { startAgentJob } = await import("./jobs/agentjob.js");
// const { startCleanupJob } = await import("./jobs/cleanupjob.js");
// const { startKeepAlive } = await import("./jobs/keepAlive.js");

// const app = express();
// app.use(helmet());
// app.set("trust proxy", 1);

// // CORS কনফিগারেশন: লোকালহোস্ট এবং ক্লাউডফ্লাওয়ার ডোমেইন উভատ অ্যালাউ করার জন্য
// const allowedOrigins = ["http://localhost:5173", config.clientOrigin].filter(
//   Boolean,
// );

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin) || true) {
//         // প্রয়োজনে সব অরিজিন অ্যালাউ রাখতে true দিন
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   }),
// );

// app.use(express.json({ limit: "1mb" }));

// // সমস্ত API রাউটগুলো errorHandler-এর আগে বসাতে হবে
// app.use("/api/auth", authRoutes);
// app.use("/api/system", requireAuth, systemRoutes);
// app.use("/api/pages", requireAuth, pageRoutes);
// app.use("/api/assets", requireAuth, assetRoutes);
// app.use("/api/posts", requireAuth, postRoutes);
// app.use("/api/agent", requireAuth, agentRoutes);

// app.get("/health", (req, res) => res.json({ ok: true }));
// // app.get("/health", (req, res) => {
// //   res.status(200).send("OK");
// // });

// // errorHandler সবসময় সবার শেষে থাকবে
// app.use(errorHandler);

// app.listen(config.port, () => {
//   console.log(`Server চালু: http://localhost:${config.port}`);
//   startPublishJob();
//   startAgentJob();
//   startCleanupJob();
//   startKeepAlive();
// });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config, missingEnv } from "./config/config.js";

if (missingEnv.length) {
  console.error(`.env এ এই মানগুলো নেই: ${missingEnv.join(", ")}`);
  process.exit(1);
}

await import("./config/db.js");
const { requireAuth } = await import("./middleware/auth.js");
const { errorHandler } = await import("./middleware/errorHandler.js");
const { default: authRoutes } = await import("./routes/authRoutes.js");
const { default: pageRoutes } = await import("./routes/pageRoutes.js");
const { default: assetRoutes } = await import("./routes/assetRoutes.js");
const { default: postRoutes } = await import("./routes/postRoutes.js");
const { default: systemRoutes } = await import("./routes/systemRoutes.js");
const { default: agentRoutes } = await import("./routes/agentRoutes.js");

const { startPublishJob } = await import("./jobs/publishjob.js");
const { startAgentJob } = await import("./jobs/agentjob.js");
const { startCleanupJob } = await import("./jobs/cleanupjob.js");
const { startKeepAlive } = await import("./jobs/keepAlive.js");

const app = express();
app.use(helmet());
app.set("trust proxy", 1);

// CORS কনফিগারেশন: লোকালহোস্ট এবং ক্লাউডফ্লাওয়ার ডোমেইন উভատ অ্যালাউ করার জন্য
const allowedOrigins = ["http://localhost:5173", config.clientOrigin].filter(
  Boolean,
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || true) {
        // প্রয়োজনে সব অরিজিন অ্যালাউ রাখতে true দিন
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

// সমস্ত API রাউটগুলো errorHandler-এর আগে বসাতে হবে
app.use("/api/auth", authRoutes);
app.use("/api/system", requireAuth, systemRoutes);
app.use("/api/pages", requireAuth, pageRoutes);
app.use("/api/assets", requireAuth, assetRoutes);
app.use("/api/posts", requireAuth, postRoutes);
app.use("/api/agent", requireAuth, agentRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

// errorHandler সবসময় সবার শেষে থাকবে
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server চালু: http://localhost:${config.port}`);
  startPublishJob();
  startAgentJob();
  startCleanupJob();
  startKeepAlive();
});
