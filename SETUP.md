# Medipoint — Vercel Deployment + Real-time Sync

## What these files do

Every file here is a drop-in replacement or new addition to your repo.
Nothing has been removed — only added or updated.

---

## Files changed vs your original repo

| File | Status | Change |
|------|--------|--------|
| `vercel.json` | **Updated** | Routes `/api/*` to serverless function; serves frontend via catch-all |
| `artifacts/api-server/api/index.ts` | **New** | Vercel entry point — exports your Express app |
| `artifacts/api-server/src/app.ts` | **Updated** | CORS now allows `*.vercel.app`; adds global error handler |
| `artifacts/api-server/src/index.ts` | **Updated** | Local dev only — unchanged in behaviour |
| `artifacts/api-server/src/lib/pusher.ts` | **New** | Pusher singleton + `broadcast()` helper |
| `artifacts/api-server/src/lib/logger.ts` | **New** | Pino logger (was already in your code, now explicit) |
| `artifacts/api-server/src/middleware/errorHandler.ts` | **New** | Global Express error handler |
| `artifacts/api-server/src/routes/index.ts` | **Updated** | `.js` extensions added for ESM; otherwise identical |
| `artifacts/api-server/src/routes/products.ts` | **Updated** | `broadcast()` added after every DB write |
| `artifacts/api-server/src/routes/sales.ts` | **Updated** | `broadcast()` added after every DB write |
| `artifacts/api-server/src/routes/stockUpdates.ts` | **Updated** | `broadcast()` added; also pings `products` on stock change |
| `artifacts/api-server/src/routes/transactions.ts` | **Updated** | `broadcast()` added on create |
| `artifacts/api-server/src/routes/activityLog.ts` | **Updated** | `broadcast()` added on create |
| `artifacts/api-server/src/routes/auth.ts` | **Updated** | No broadcast (auth is per-user, not shared state) |
| `artifacts/api-server/src/routes/health.ts` | **Updated** | No broadcast (read-only) |
| `lib/db/src/index.ts` | **Updated** | `pg` Pool → Neon serverless HTTP driver |
| `lib/db/src/schema/index.ts` | **Updated** | Barrel for all 6 tables |
| `lib/db/src/schema/products.ts` | **New** | Products table definition |
| `lib/db/src/schema/sales.ts` | **New** | Sales table definition |
| `lib/db/src/schema/stockUpdates.ts` | **New** | Stock updates table definition |
| `lib/db/src/schema/transactions.ts` | **New** | Transactions table definition |
| `lib/db/src/schema/activityLog.ts` | **New** | Activity log table definition |
| `lib/db/src/schema/settings.ts` | **New** | Settings table definition |
| `lib/db/drizzle.config.ts` | **Updated** | Points to Neon via DATABASE_URL |
| `lib/db/package.json` | **Updated** | `pg` removed; `@neondatabase/serverless` added |
| `lib/api-client-react/src/hooks/useRealtimeSync.ts` | **New** | React hook — auto-refreshes all data on change |
| `lib/api-client-react/package.json` | **Updated** | `pusher-js` + `@tanstack/react-query` added |
| `.env.example` | **New** | All required env vars documented |

---

## Step 1 — Install new dependencies

```bash
# In your repo root:
pnpm --filter @workspace/db remove pg
pnpm --filter @workspace/db add @neondatabase/serverless drizzle-orm drizzle-zod
pnpm --filter @workspace/api-server add pusher
pnpm --filter @workspace/api-client-react add pusher-js
```

---

## Step 2 — Set up Neon (free serverless Postgres)

1. Go to **https://neon.tech** → sign up free
2. Create a project → copy the connection string
3. Push your schema to Neon:
   ```bash
   DATABASE_URL="postgresql://..." pnpm db:push
   ```

---

## Step 3 — Set up Pusher (free real-time layer)

1. Go to **https://pusher.com** → sign up free
2. Create a new **Channels** app
3. Choose cluster `eu` (closest to Nairobi)
4. Copy: App ID, Key, Secret, Cluster from the **App Keys** tab

---

## Step 4 — Add environment variables to Vercel

In **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Variable | Value | Exposed to |
|----------|-------|-----------|
| `DATABASE_URL` | Neon connection string | Server only |
| `PUSHER_APP_ID` | Pusher App ID | Server only |
| `PUSHER_KEY` | Pusher Key | Server only |
| `PUSHER_SECRET` | Pusher Secret | Server only |
| `PUSHER_CLUSTER` | e.g. `eu` | Server only |
| `VITE_PUSHER_KEY` | Same as PUSHER_KEY | **Frontend (public)** |
| `VITE_PUSHER_CLUSTER` | Same as PUSHER_CLUSTER | **Frontend (public)** |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Server only |

⚠️ Never put `PUSHER_SECRET` or `DATABASE_URL` in any `VITE_` variable.

---

## Step 5 — Add the hook to your frontend pages

```tsx
// In any page component that shows synced data:
import { useRealtimeSync } from "@workspace/api-client-react";

export function ProductsPage() {
  // Watches products + sales. Auto-refetches when any device changes them.
  useRealtimeSync(["products", "sales"]);

  const { data: products } = useGetProducts(); // your existing React Query hook
  return <ProductList products={products} />;
}

// On a dashboard that shows everything:
export function Dashboard() {
  useRealtimeSync(); // no args = watch all entities
  // ...
}
```

React Query keys must match the entity names exactly:
`"products"`, `"sales"`, `"stock-updates"`, `"transactions"`, `"activity-log"`

---

## Step 6 — Deploy

1. Push these files to your `main` branch
2. Go to **https://vercel.com** → **Add New Project** → import your GitHub repo
3. Set all environment variables (Step 4)
4. Click **Deploy**

Every future `git push` to `main` auto-deploys.

---

## How sync works end-to-end

```
Device A (cashier tablet)
 └─► POST /api/sales           → Vercel serverless function
       └─► INSERT INTO sales   → Neon Postgres
       └─► pusher.trigger()    → Pusher cloud (~50ms)
             ├─► Device B (manager laptop)
             │     └─► useRealtimeSync receives "sales:created"
             │           └─► queryClient.invalidateQueries(["sales"])
             │                 └─► useGetSales() auto-refetches ✓
             └─► Device C (stock room tablet)
                   └─► same — updates instantly ✓
```

Round-trip write → all other devices updated: **~100–300ms**

---

## Troubleshooting

**Build fails on Vercel: `Cannot find module '@workspace/db'`**
→ Vercel needs to resolve workspace packages. Make sure `pnpm-workspace.yaml`
  is committed and the lockfile (`pnpm-lock.yaml`) is up to date.

**Pusher events not arriving on client**
→ Open browser DevTools → Network tab → look for a WebSocket connection to
  `ws://ws-eu.pusher.com`. If missing, check `VITE_PUSHER_KEY` and
  `VITE_PUSHER_CLUSTER` are set in Vercel env vars and redeploy.

**Neon cold start (~1s delay) on first request**
→ Normal on Neon free tier (suspends after 5 min idle). Upgrade to Neon
  Launch ($19/mo) to disable auto-suspend, or use Neon's free tier and
  accept the occasional cold start.

**`DATABASE_URL` missing in function logs**
→ Env vars must be set for the **Production** environment specifically
  in Vercel dashboard, not just Preview. Check the dropdown when adding.

**CORS error in browser**
→ Set `FRONTEND_URL` in Vercel to your exact deployed URL
  (e.g. `https://medipoint.vercel.app`).
