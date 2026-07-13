import { pgTable, text, serial, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  goalType: text("goal_type", {
    enum: ["emergency_fund", "vacation", "car", "house", "kids_education", "retirement", "other"],
  }).notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  currentAmount: numeric("current_amount", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  targetDate: date("target_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
