// lib/db/src/schema/activityLog.ts
import { pgTable, serial, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(), // "created_sale", "updated_product", etc.
  entity: varchar("entity", { length: 100 }).notNull(), // "products", "sales", etc.
  entityId: varchar("entity_id", { length: 100 }),
  userId: varchar("user_id", { length: 100 }),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true, createdAt: true,
});
export const selectActivityLogSchema = createSelectSchema(activityLog);
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
