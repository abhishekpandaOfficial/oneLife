import { pgTable, text, serial, integer, numeric, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { categoriesTable } from "./categories";
export const transactionsTable = pgTable("transactions", {
    id: serial("id").primaryKey(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
    description: text("description").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
    isRecurring: boolean("is_recurring").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
    id: true,
    createdAt: true,
});
