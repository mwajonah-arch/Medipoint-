// artifacts/api-server/src/routes/auth.ts
// Auth routes do not broadcast — login/logout are per-user events,
// not shared data changes.

import { Router } from "express";
import { db, schema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Replace with your actual auth logic (bcrypt compare, JWT sign, etc.)
    const [user] = await db
      .select()
      .from(schema.settings) // ← swap to your users table
      .where(eq(schema.settings.key, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // TODO: verify password hash and sign JWT
    res.json({ message: "Login endpoint — wire up your auth logic here" });
  } catch (err) {
    res.status(500).json({ error: "Auth error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  // If using JWT: client just discards the token.
  // If using sessions: destroy session here.
  res.json({ message: "Logged out" });
});

export default router;
