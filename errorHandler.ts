// artifacts/api-server/src/middleware/errorHandler.ts
// Global Express error handler — catches anything thrown in routes.

import { type ErrorRequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error(err);

  const status = (err as { status?: number }).status ?? 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : (err as Error).message ?? "Unknown error";

  res.status(status).json({ error: message });
};
