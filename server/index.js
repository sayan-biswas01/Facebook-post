import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config, missingEnv } from "./config/config.js";

if (missingEnv.length) {
  console.error(`.env এ এই মানগুলো নেই: ${missingEnv.join(", ")}`);
  process.exit(1);
}
0.3;

await import("./config/db.js");
const { requireAuth } = await import("./middleware/auth.js");
const { errorHandler } = await import("./middleware/errorHandler.js");
const { default: authRoutes } = await import("./routes/authRoutes.js");
const { default: pageRoutes } = await import("./routes/pageRoutes.js");
const { default: assetRoutes } = await import("./routes/assetRoutes.js");
const { default: postRoutes } = await import("./routes/postRoutes.js");
const { default: systemRoutes } = await import("./routes/systemRoutes.js");
const { startPublishJob } = await import("./jobs/publishjob.js");

const { default: agentRoutes } = await import("./routes/agentRoutes.js");
const { startAgentJob } = await import("./jobs/agentJob.js");
const { startCleanupJob } = await import("./jobs/cleanupjob.js");

const app = express();
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/system", requireAuth, systemRoutes);
app.use("/api/pages", requireAuth, pageRoutes);
app.use("/api/assets", requireAuth, assetRoutes);
app.use("/api/posts", requireAuth, postRoutes);
app.use(errorHandler);

app.use("/api/agent", requireAuth, agentRoutes);

app.listen(config.port, () => {
  console.log(`Server চালু: http://localhost:${config.port}`);
  startPublishJob();
  startAgentJob();
  startCleanupJob();
});
