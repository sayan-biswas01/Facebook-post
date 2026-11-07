import { ZodError } from "zod";

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: err.issues.map((i) => i.message).join(", ") });
  }
  console.error(err);
  res.status(500).json({ error: err.message || "সার্ভারে সমস্যা" });
}
