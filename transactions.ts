// artifacts/api-server/src/routes/transactions.ts

import { Router } from "express";
import { db, schema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/pusher.js";

const router = Router();

// GET /api/transactions
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(schema.transactions);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /api/transactions/:id
router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Transaction not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// POST /api/transactions
// Transactions are typically created, never mutated or deleted.
router.post("/", async (req, res) => {
  try {
    const [created] = await db
      .insert(schema.transactions)
      .values(req.body)
      .returning();

    // 🔔 Notify all connected devices — a new transaction affects
    //    dashboards, reports, and account balances everywhere
    await broadcast("transactions", "created", created);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

export default router;
