// artifacts/api-server/src/routes/activityLog.ts
// Activity log entries are append-only — no update or delete.

import { Router } from "express";
import { db, schema } from "@workspace/db";
import { broadcast } from "../lib/pusher.js";

const router = Router();

// GET /api/activity-log
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.activityLog)
      .orderBy(schema.activityLog.createdAt);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
});

// POST /api/activity-log
router.post("/", async (req, res) => {
  try {
    const [created] = await db
      .insert(schema.activityLog)
      .values(req.body)
      .returning();

    // 🔔 Push new log entry to all devices in real time
    //    (e.g. live audit feed on the admin dashboard)
    await broadcast("activity-log", "created", created);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create activity log entry" });
  }
});

export default router;
