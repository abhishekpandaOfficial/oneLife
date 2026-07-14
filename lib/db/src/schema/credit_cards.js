import { pgTable, text, serial, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const creditCardsTable = pgTable("credit_cards", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    bankName: text("bank_name").notNull(),
    bankLogoUrl: text("bank_logo_url"),
    creditLimit: numeric("credit_limit", { precision: 14, scale: 2, mode: "number" }).notNull(),
    outstandingAmount: numeric("outstanding_amount", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    minimumDue: numeric("minimum_due", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertCreditCardSchema = createInsertSchema(creditCardsTable).omit({
    id: true,
    createdAt: true,
});
