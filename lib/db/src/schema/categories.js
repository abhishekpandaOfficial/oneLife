import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const categoriesTable = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    color: text("color").notNull(),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
    id: true,
    createdAt: true,
});
