// lib/db/src/schema/stockUpdates.ts
import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "./products.js";

export const stockUpdates = pgTable("stock_updates", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityChange: integer("quantity_change").notNull(), // positive = restock, negative = shrinkage
  reason: varchar("reason", { length: 100 }), // "purchase", "adjustment", "return", "shrinkage"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStockUpdateSchema = createInsertSchema(stockUpdates).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectStockUpdateSchema = createSelectSchema(stockUpdates);
export type StockUpdate = typeof stockUpdates.$inferSelect;
export type NewStockUpdate = typeof stockUpdates.$inferInsert;
