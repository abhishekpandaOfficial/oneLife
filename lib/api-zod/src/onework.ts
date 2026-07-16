import { z } from "zod/v4";

export const WorkEmploymentTypeSchema = z.enum(["full_time", "part_time", "contract", "internship", "freelance"]);
export const WorkDocumentTypeSchema = z.enum(["offer_letter", "payslip", "joining_letter", "hike_letter", "relieving_letter", "form16", "pf_statement", "other"]);
export const WorkPfSourceSchema = z.enum(["manual", "estimated", "epfo"]);

export const OneworkProfile = z.object({
  id: z.number(),
  uanNumber: z.string().nullish(),
  epfoMemberId: z.string().nullish(),
  googleDriveConnected: z.string().nullish(),
  googleDriveEmail: z.string().nullish(),
  googleDriveFolderId: z.string().nullish(),
  lastEpfoSyncAt: z.coerce.date().nullish(),
  createdAt: z.coerce.date(),
});

export const OneworkProfileInput = z.object({
  uanNumber: z.string().nullish(),
  epfoMemberId: z.string().nullish(),
  googleDriveConnected: z.string().nullish(),
  googleDriveEmail: z.string().nullish(),
  googleDriveFolderId: z.string().nullish(),
  lastEpfoSyncAt: z.coerce.date().nullish(),
});

export const WorkCompany = z.object({
  id: z.number(),
  companyName: z.string(),
  position: z.string(),
  location: z.string().nullish(),
  employmentType: WorkEmploymentTypeSchema,
  salaryMonthly: z.number(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  pfAccountNumber: z.string().nullish(),
  employeePfMonthly: z.number(),
  employerPfMonthly: z.number(),
  color: z.string(),
  icon: z.string(),
  logoUrl: z.string().nullish(),
  notes: z.string().nullish(),
  tenureMonths: z.number(),
  tenureLabel: z.string(),
  estimatedPfAmount: z.number(),
  documentsCount: z.number(),
  createdAt: z.coerce.date(),
});

export const WorkCompanyInput = z.object({
  companyName: z.string().min(1),
  position: z.string().min(1),
  location: z.string().nullish(),
  employmentType: WorkEmploymentTypeSchema.default("full_time"),
  salaryMonthly: z.number().min(0).default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullish(),
  pfAccountNumber: z.string().nullish(),
  employeePfMonthly: z.number().min(0).default(0),
  employerPfMonthly: z.number().min(0).default(0),
  color: z.string().default("#2563eb"),
  icon: z.string().default("Building2"),
  logoUrl: z.string().nullish(),
  notes: z.string().nullish(),
});

export const WorkCompanyUpdate = WorkCompanyInput.partial();

export const WorkDocumentFolder = z.object({
  id: z.number(),
  companyId: z.number(),
  companyName: z.string().nullish(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  googleDriveFolderId: z.string().nullish(),
  notes: z.string().nullish(),
  documentsCount: z.number(),
  createdAt: z.coerce.date(),
});

export const WorkDocumentFolderInput = z.object({
  companyId: z.number(),
  name: z.string().min(1),
  color: z.string().default("#2563eb"),
  icon: z.string().default("FileText"),
  googleDriveFolderId: z.string().nullish(),
  notes: z.string().nullish(),
});

export const WorkDocumentFolderUpdate = WorkDocumentFolderInput.partial();

export const WorkDocumentCategory = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  createdAt: z.coerce.date(),
});

export const WorkDocumentCategoryInput = z.object({
  name: z.string().min(1),
  color: z.string().default("#64748b"),
  icon: z.string().default("FileText"),
});

export const WorkDocumentCategoryUpdate = WorkDocumentCategoryInput.partial();

export const WorkDocument = z.object({
  id: z.number(),
  companyId: z.number().nullable(),
  companyName: z.string().nullish(),
  folderId: z.number().nullable(),
  folderName: z.string().nullish(),
  categoryId: z.number().nullable(),
  categoryName: z.string().nullish(),
  categoryColor: z.string().nullish(),
  categoryIcon: z.string().nullish(),
  name: z.string(),
  documentType: WorkDocumentTypeSchema,
  fileName: z.string(),
  fileUrl: z.string().nullish(),
  googleDriveFileId: z.string().nullish(),
  documentDate: z.string().nullable(),
  notes: z.string().nullish(),
  createdAt: z.coerce.date(),
});

export const WorkDocumentInput = z.object({
  companyId: z.number().nullish(),
  folderId: z.number().nullish(),
  categoryId: z.number().nullish(),
  name: z.string().min(1),
  documentType: WorkDocumentTypeSchema.default("other"),
  fileName: z.string().min(1),
  fileUrl: z.string().nullish(),
  googleDriveFileId: z.string().nullish(),
  documentDate: z.coerce.date().nullish(),
  notes: z.string().nullish(),
});

export const WorkDocumentUpdate = WorkDocumentInput.partial();

export const WorkSalaryRecord = z.object({
  id: z.number(),
  companyId: z.number(),
  companyName: z.string().nullish(),
  documentId: z.number().nullable(),
  month: z.string(),
  netSalary: z.number(),
  grossSalary: z.number(),
  ctcAnnual: z.number(),
  taxDeduction: z.number(),
  otherDeductions: z.number(),
  source: z.string(),
  notes: z.string().nullish(),
  createdAt: z.coerce.date(),
});

export const WorkSalaryRecordInput = z.object({
  companyId: z.number(),
  documentId: z.number().nullish(),
  month: z.string().min(7),
  netSalary: z.number().min(0).default(0),
  grossSalary: z.number().min(0).default(0),
  ctcAnnual: z.number().min(0).default(0),
  taxDeduction: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
  source: z.string().default("manual"),
  notes: z.string().nullish(),
});

export const WorkSalaryRecordUpdate = WorkSalaryRecordInput.partial();

export const WorkPfEntry = z.object({
  id: z.number(),
  companyId: z.number().nullable(),
  companyName: z.string().nullish(),
  month: z.string(),
  employeeAmount: z.number(),
  employerAmount: z.number(),
  interestAmount: z.number(),
  source: WorkPfSourceSchema,
  notes: z.string().nullish(),
  createdAt: z.coerce.date(),
});

export const WorkPfEntryInput = z.object({
  companyId: z.number().nullish(),
  month: z.string().min(7),
  employeeAmount: z.number().min(0).default(0),
  employerAmount: z.number().min(0).default(0),
  interestAmount: z.number().min(0).default(0),
  source: WorkPfSourceSchema.default("manual"),
  notes: z.string().nullish(),
});

export const WorkPfEntryUpdate = WorkPfEntryInput.partial();

export const WorkPfWithdrawal = z.object({
  id: z.number(),
  companyId: z.number().nullable(),
  companyName: z.string().nullish(),
  amount: z.number(),
  withdrawalDate: z.string(),
  reason: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.coerce.date(),
});

export const WorkPfWithdrawalInput = z.object({
  companyId: z.number().nullish(),
  amount: z.number().min(0),
  withdrawalDate: z.coerce.date(),
  reason: z.string().nullish(),
  notes: z.string().nullish(),
});

export const WorkPfWithdrawalUpdate = WorkPfWithdrawalInput.partial();

export const OneworkSummary = z.object({
  profile: OneworkProfile.nullable(),
  companies: z.array(WorkCompany),
  folders: z.array(WorkDocumentFolder),
  documents: z.array(WorkDocument),
  documentCategories: z.array(WorkDocumentCategory),
  salaryRecords: z.array(WorkSalaryRecord),
  pfEntries: z.array(WorkPfEntry),
  pfWithdrawals: z.array(WorkPfWithdrawal),
  totalCompanies: z.number(),
  activeCompanyName: z.string().nullish(),
  totalExperienceMonths: z.number(),
  totalSalaryMonthly: z.number(),
  pfContributions: z.number(),
  pfWithdrawalsTotal: z.number(),
  pfBalance: z.number(),
  epfoSyncStatus: z.string(),
});
