import { pgTable, text, serial, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investmentsTable = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  investmentType: text("investment_type", {
    enum: ["mutual_fund", "stocks", "ppf", "nps", "fd", "gold", "crypto"],
  }).notNull(),
  investedAmount: numeric("invested_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  currentValue: numeric("current_value", { precision: 14, scale: 2, mode: "number" }).notNull(),
  purchaseDate: date("purchase_date", { mode: "string" }).notNull(),
  xirr: numeric("xirr", { precision: 6, scale: 2, mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvestmentSchema = createInsertSchema(investmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investmentsTable.$inferSelect;
