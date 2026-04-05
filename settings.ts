// lib/db/src/schema/settings.ts
import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectSettingSchema = createSelectSchema(settings);
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
