import { pgTable, text, serial, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { loansTable } from "./loans";

export const emisTable = pgTable("emis", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id, { onDelete: "cascade" }),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  paidDate: date("paid_date", { mode: "string" }),
  amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  status: text("status", { enum: ["paid", "pending", "overdue", "partial"] })
    .notNull()
    .default("pending"),
});

export const insertEmiSchema = createInsertSchema(emisTable).omit({ id: true });
export type InsertEmi = z.infer<typeof insertEmiSchema>;
export type Emi = typeof emisTable.$inferSelect;
