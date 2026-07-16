import { pgTable, text, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const oneworkProfileTable = pgTable("onework_profile", {
  id: serial("id").primaryKey(),
  uanNumber: text("uan_number"),
  epfoMemberId: text("epfo_member_id"),
  googleDriveConnected: text("google_drive_connected"),
  googleDriveEmail: text("google_drive_email"),
  googleDriveFolderId: text("google_drive_folder_id"),
  lastEpfoSyncAt: timestamp("last_epfo_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workCompaniesTable = pgTable("work_companies", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  position: text("position").notNull(),
  location: text("location"),
  employmentType: text("employment_type", {
    enum: ["full_time", "part_time", "contract", "internship", "freelance"],
  }).notNull().default("full_time"),
  salaryMonthly: numeric("salary_monthly", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  pfAccountNumber: text("pf_account_number"),
  employeePfMonthly: numeric("employee_pf_monthly", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  employerPfMonthly: numeric("employer_pf_monthly", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  color: text("color").notNull().default("#2563eb"),
  icon: text("icon").notNull().default("Building2"),
  logoUrl: text("logo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workDocumentFoldersTable = pgTable("work_document_folders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => workCompaniesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#2563eb"),
  icon: text("icon").notNull().default("FileText"),
  googleDriveFolderId: text("google_drive_folder_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workDocumentCategoriesTable = pgTable("work_document_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#64748b"),
  icon: text("icon").notNull().default("FileText"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workDocumentsTable = pgTable("work_documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => workCompaniesTable.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").references(() => workDocumentFoldersTable.id, { onDelete: "set null" }),
  categoryId: integer("category_id").references(() => workDocumentCategoriesTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  documentType: text("document_type", {
    enum: ["offer_letter", "payslip", "joining_letter", "hike_letter", "relieving_letter", "form16", "pf_statement", "other"],
  }).notNull().default("other"),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  googleDriveFileId: text("google_drive_file_id"),
  documentDate: date("document_date", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workSalaryRecordsTable = pgTable("work_salary_records", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => workCompaniesTable.id, { onDelete: "cascade" }),
  documentId: integer("document_id").references(() => workDocumentsTable.id, { onDelete: "set null" }),
  month: text("month").notNull(),
  netSalary: numeric("net_salary", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  grossSalary: numeric("gross_salary", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  ctcAnnual: numeric("ctc_annual", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  taxDeduction: numeric("tax_deduction", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  otherDeductions: numeric("other_deductions", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  source: text("source").notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workPfEntriesTable = pgTable("work_pf_entries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => workCompaniesTable.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  employeeAmount: numeric("employee_amount", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  employerAmount: numeric("employer_amount", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  interestAmount: numeric("interest_amount", { precision: 14, scale: 2, mode: "number" }).notNull().default(0),
  source: text("source", { enum: ["manual", "estimated", "epfo"] }).notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workPfWithdrawalsTable = pgTable("work_pf_withdrawals", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => workCompaniesTable.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
  withdrawalDate: date("withdrawal_date", { mode: "string" }).notNull(),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOneworkProfileSchema = createInsertSchema(oneworkProfileTable).omit({ id: true, createdAt: true });
export const insertWorkCompanySchema = createInsertSchema(workCompaniesTable).omit({ id: true, createdAt: true });
export const insertWorkDocumentFolderSchema = createInsertSchema(workDocumentFoldersTable).omit({ id: true, createdAt: true });
export const insertWorkDocumentCategorySchema = createInsertSchema(workDocumentCategoriesTable).omit({ id: true, createdAt: true });
export const insertWorkDocumentSchema = createInsertSchema(workDocumentsTable).omit({ id: true, createdAt: true });
export const insertWorkSalaryRecordSchema = createInsertSchema(workSalaryRecordsTable).omit({ id: true, createdAt: true });
export const insertWorkPfEntrySchema = createInsertSchema(workPfEntriesTable).omit({ id: true, createdAt: true });
export const insertWorkPfWithdrawalSchema = createInsertSchema(workPfWithdrawalsTable).omit({ id: true, createdAt: true });

export type OneworkProfile = typeof oneworkProfileTable.$inferSelect;
export type WorkCompany = typeof workCompaniesTable.$inferSelect;
export type WorkDocumentFolder = typeof workDocumentFoldersTable.$inferSelect;
export type WorkDocumentCategory = typeof workDocumentCategoriesTable.$inferSelect;
export type WorkDocument = typeof workDocumentsTable.$inferSelect;
export type WorkSalaryRecord = typeof workSalaryRecordsTable.$inferSelect;
export type WorkPfEntry = typeof workPfEntriesTable.$inferSelect;
export type WorkPfWithdrawal = typeof workPfWithdrawalsTable.$inferSelect;

export type InsertOneworkProfile = z.infer<typeof insertOneworkProfileSchema>;
export type InsertWorkCompany = z.infer<typeof insertWorkCompanySchema>;
export type InsertWorkDocumentFolder = z.infer<typeof insertWorkDocumentFolderSchema>;
export type InsertWorkDocumentCategory = z.infer<typeof insertWorkDocumentCategorySchema>;
export type InsertWorkDocument = z.infer<typeof insertWorkDocumentSchema>;
export type InsertWorkSalaryRecord = z.infer<typeof insertWorkSalaryRecordSchema>;
export type InsertWorkPfEntry = z.infer<typeof insertWorkPfEntrySchema>;
export type InsertWorkPfWithdrawal = z.infer<typeof insertWorkPfWithdrawalSchema>;
