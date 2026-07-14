import { pgTable, text, serial, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const insurancesTable = pgTable("insurances", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    insuranceType: text("insurance_type", {
        enum: ["health", "life", "car", "house", "term"],
    }).notNull(),
    provider: text("provider").notNull(),
    premiumAmount: numeric("premium_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
    coverageAmount: numeric("coverage_amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
    renewalDate: date("renewal_date", { mode: "string" }).notNull(),
    policyNumber: text("policy_number"),
    status: text("status", { enum: ["active", "expired"] }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertInsuranceSchema = createInsertSchema(insurancesTable).omit({
    id: true,
    createdAt: true,
});
