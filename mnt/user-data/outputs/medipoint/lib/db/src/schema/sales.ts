// lib/db/src/schema/sales.ts
import { pgTable, serial, integer, numeric, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "./products.js";

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 50 }).default("completed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectSaleSchema = createSelectSchema(sales);
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
