import { pgTable, text, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  loanType: text("loan_type", {
    enum: ["home", "car", "personal", "gold", "education", "other"],
  }).notNull(),
  principalAmount: numeric("principal_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  outstandingAmount: numeric("outstanding_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 3, mode: "number" }).notNull(),
  emiAmount: numeric("emi_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  bankName: text("bank_name"),
  bankLogoUrl: text("bank_logo_url"),
  disbursementDocUrl: text("disbursement_doc_url"),
  repaymentScheduleDocUrl: text("repayment_schedule_doc_url"),
  penaltyRate: numeric("penalty_rate", { precision: 6, scale: 3, mode: "number" }).notNull().default(2.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
