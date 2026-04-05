// artifacts/api-server/src/routes/sales.ts

import { Router } from "express";
import { db, schema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/pusher.js";

const router = Router();

// GET /api/sales
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(schema.sales);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// GET /api/sales/:id
router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Sale not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sale" });
  }
});

// POST /api/sales
router.post("/", async (req, res) => {
  try {
    const [created] = await db
      .insert(schema.sales)
      .values(req.body)
      .returning();

    // 🔔 Notify all connected devices
    await broadcast("sales", "created", created);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create sale" });
  }
});

// PATCH /api/sales/:id
router.patch("/:id", async (req, res) => {
  try {
    const [updated] = await db
      .update(schema.sales)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.sales.id, Number(req.params.id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Sale not found" });

    // 🔔 Notify all connected devices
    await broadcast("sales", "updated", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update sale" });
  }
});

// DELETE /api/sales/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(schema.sales).where(eq(schema.sales.id, id));

    // 🔔 Notify all connected devices
    await broadcast("sales", "deleted", { id });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete sale" });
  }
});

export default router;
