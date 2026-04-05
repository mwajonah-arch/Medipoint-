// artifacts/api-server/src/routes/index.ts
// Unchanged from your original — all route modules are the same.
// Pusher broadcasting is added inside each individual route file.

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import salesRouter from "./sales.js";
import stockUpdatesRouter from "./stockUpdates.js";
import transactionsRouter from "./transactions.js";
import activityLogRouter from "./activityLog.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/sales", salesRouter);
router.use("/stock-updates", stockUpdatesRouter);
router.use("/transactions", transactionsRouter);
router.use("/activity-log", activityLogRouter);

export default router;
