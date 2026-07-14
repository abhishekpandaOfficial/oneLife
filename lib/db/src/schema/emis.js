import { pgTable, text, serial, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
    penaltyAmount: numeric("penalty_amount", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
    overdueDays: integer("overdue_days").notNull().default(0),
});
export const insertEmiSchema = createInsertSchema(emisTable).omit({ id: true });
