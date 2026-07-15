import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  oneworkProfileTable,
  workCompaniesTable,
  workDocumentCategoriesTable,
  workDocumentFoldersTable,
  workDocumentsTable,
  workPfEntriesTable,
  workPfWithdrawalsTable,
} from "@workspace/db";
import {
  DeleteWorkCompanyParams,
  DeleteWorkDocumentCategoryParams,
  DeleteWorkDocumentParams,
  DeleteWorkPfEntryParams,
  DeleteWorkPfWithdrawalParams,
  OneworkProfileInput,
  OneworkSummary,
  UpdateWorkCompanyParams,
  UpdateWorkDocumentCategoryParams,
  UpdateWorkDocumentParams,
  UpdateWorkPfEntryParams,
  UpdateWorkPfWithdrawalParams,
  WorkCompany,
  WorkCompanyInput,
  WorkCompanyUpdate,
  WorkDocument,
  WorkDocumentCategory,
  WorkDocumentCategoryInput,
  WorkDocumentCategoryUpdate,
  WorkDocumentFolder,
  WorkDocumentFolderInput,
  WorkDocumentFolderUpdate,
  WorkDocumentInput,
  WorkDocumentUpdate,
  WorkPfEntry,
  WorkPfEntryInput,
  WorkPfEntryUpdate,
  WorkPfWithdrawal,
  WorkPfWithdrawalInput,
  WorkPfWithdrawalUpdate,
} from "@workspace/api-zod";
import { z } from "zod/v4";
import { toDateStr } from "../lib/dates";

const router: IRouter = Router();

function monthDiffInclusive(startDate: string, endDate: string | null): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(0, months);
}

function tenureLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mo`;
  if (rest === 0) return `${years} yr`;
  return `${years} yr ${rest} mo`;
}

function dateOrNull(value: unknown): string | null {
  if (!value) return null;
  return toDateStr(value instanceof Date ? value : new Date(value as string));
}

async function documentCountsByCompany() {
  const docs = await db.select().from(workDocumentsTable);
  const counts = new Map<number, number>();
  for (const doc of docs) {
    if (doc.companyId) counts.set(doc.companyId, (counts.get(doc.companyId) ?? 0) + 1);
  }
  return counts;
}

async function documentCountsByFolder() {
  const docs = await db.select().from(workDocumentsTable);
  const counts = new Map<number, number>();
  for (const doc of docs) {
    if (doc.folderId) counts.set(doc.folderId, (counts.get(doc.folderId) ?? 0) + 1);
  }
  return counts;
}

async function toCompanyRows() {
  const [companies, counts] = await Promise.all([
    db.select().from(workCompaniesTable).orderBy(workCompaniesTable.startDate),
    documentCountsByCompany(),
  ]);

  return companies.map((company) => {
    const tenureMonths = monthDiffInclusive(company.startDate, company.endDate);
    return WorkCompany.parse({
      ...company,
      salaryMonthly: Number(company.salaryMonthly),
      employeePfMonthly: Number(company.employeePfMonthly),
      employerPfMonthly: Number(company.employerPfMonthly),
      tenureMonths,
      tenureLabel: tenureLabel(tenureMonths),
      estimatedPfAmount: tenureMonths * (Number(company.employeePfMonthly) + Number(company.employerPfMonthly)),
      documentsCount: counts.get(company.id) ?? 0,
    });
  });
}

async function toDocumentRows() {
  const [docs, companies, folders, categories] = await Promise.all([
    db.select().from(workDocumentsTable).orderBy(workDocumentsTable.createdAt),
    db.select().from(workCompaniesTable),
    db.select().from(workDocumentFoldersTable),
    db.select().from(workDocumentCategoriesTable),
  ]);
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return docs.map((doc) => {
    const company = doc.companyId ? companyById.get(doc.companyId) : null;
    const folder = doc.folderId ? folderById.get(doc.folderId) : null;
    const category = doc.categoryId ? categoryById.get(doc.categoryId) : null;
    return WorkDocument.parse({
      ...doc,
      companyName: company?.companyName ?? null,
      folderName: folder?.name ?? null,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      categoryIcon: category?.icon ?? null,
    });
  });
}

async function toFolderRows() {
  const [folders, companies, counts] = await Promise.all([
    db.select().from(workDocumentFoldersTable).orderBy(workDocumentFoldersTable.createdAt),
    db.select().from(workCompaniesTable),
    documentCountsByFolder(),
  ]);
  const companyById = new Map(companies.map((company) => [company.id, company.companyName]));

  return folders.map((folder) => WorkDocumentFolder.parse({
    ...folder,
    companyName: companyById.get(folder.companyId) ?? null,
    documentsCount: counts.get(folder.id) ?? 0,
  }));
}

async function toPfEntryRows() {
  const [entries, companies] = await Promise.all([
    db.select().from(workPfEntriesTable).orderBy(workPfEntriesTable.month),
    db.select().from(workCompaniesTable),
  ]);
  const companyById = new Map(companies.map((company) => [company.id, company.companyName]));
  return entries.map((entry) => WorkPfEntry.parse({
    ...entry,
    employeeAmount: Number(entry.employeeAmount),
    employerAmount: Number(entry.employerAmount),
    interestAmount: Number(entry.interestAmount),
    companyName: entry.companyId ? companyById.get(entry.companyId) ?? null : null,
  }));
}

async function toWithdrawalRows() {
  const [withdrawals, companies] = await Promise.all([
    db.select().from(workPfWithdrawalsTable).orderBy(workPfWithdrawalsTable.withdrawalDate),
    db.select().from(workCompaniesTable),
  ]);
  const companyById = new Map(companies.map((company) => [company.id, company.companyName]));
  return withdrawals.map((withdrawal) => WorkPfWithdrawal.parse({
    ...withdrawal,
    amount: Number(withdrawal.amount),
    companyName: withdrawal.companyId ? companyById.get(withdrawal.companyId) ?? null : null,
  }));
}

async function ensureDefaultDocumentCategories() {
  const existing = await db.select().from(workDocumentCategoriesTable);
  if (existing.length > 0) return existing;

  return db.insert(workDocumentCategoriesTable).values([
    { name: "Payslip", color: "#0ea5e9", icon: "ReceiptText" },
    { name: "Joining Letter", color: "#22c55e", icon: "FileSignature" },
    { name: "Hike Letter", color: "#f59e0b", icon: "TrendingUp" },
    { name: "Relieving Letter", color: "#ef4444", icon: "FileCheck2" },
    { name: "Form 16", color: "#8b5cf6", icon: "ScrollText" },
    { name: "PF Statement", color: "#14b8a6", icon: "Landmark" },
    { name: "Other", color: "#64748b", icon: "FileText" },
  ]).returning();
}

export async function getOneworkPfBalance(): Promise<number> {
  const [companies, entries, withdrawals] = await Promise.all([
    db.select().from(workCompaniesTable),
    db.select().from(workPfEntriesTable),
    db.select().from(workPfWithdrawalsTable),
  ]);
  const entriesTotal = entries.reduce((sum, entry) => sum + Number(entry.employeeAmount) + Number(entry.employerAmount) + Number(entry.interestAmount), 0);
  const entryCompanyIds = new Set(entries.map((entry) => entry.companyId).filter(Boolean));
  const estimatedTotal = companies
    .filter((company) => !entryCompanyIds.has(company.id))
    .reduce((sum, company) => {
      const months = monthDiffInclusive(company.startDate, company.endDate);
      return sum + months * (Number(company.employeePfMonthly) + Number(company.employerPfMonthly));
    }, 0);
  const withdrawalsTotal = withdrawals.reduce((sum, withdrawal) => sum + Number(withdrawal.amount), 0);
  return Math.max(0, entriesTotal + estimatedTotal - withdrawalsTotal);
}

async function summaryPayload() {
  const [profileRows, companies, folders, docs, categories, entries, withdrawals] = await Promise.all([
    db.select().from(oneworkProfileTable),
    toCompanyRows(),
    toFolderRows(),
    toDocumentRows(),
    ensureDefaultDocumentCategories(),
    toPfEntryRows(),
    toWithdrawalRows(),
  ]);

  const pfContributionsFromEntries = entries.reduce((sum, entry) => sum + entry.employeeAmount + entry.employerAmount + entry.interestAmount, 0);
  const entryCompanyIds = new Set(entries.map((entry) => entry.companyId).filter(Boolean));
  const estimatedContribution = companies
    .filter((company) => !entryCompanyIds.has(company.id))
    .reduce((sum, company) => sum + company.estimatedPfAmount, 0);
  const pfContributions = pfContributionsFromEntries + estimatedContribution;
  const pfWithdrawalsTotal = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
  const activeCompany = companies.find((company) => !company.endDate) ?? companies.at(-1);

  return OneworkSummary.parse({
    profile: profileRows[0] ?? null,
    companies,
    folders,
    documents: docs,
    documentCategories: categories,
    pfEntries: entries,
    pfWithdrawals: withdrawals,
    totalCompanies: companies.length,
    activeCompanyName: activeCompany?.companyName ?? null,
    totalExperienceMonths: companies.reduce((sum, company) => sum + company.tenureMonths, 0),
    totalSalaryMonthly: activeCompany?.salaryMonthly ?? 0,
    pfContributions,
    pfWithdrawalsTotal,
    pfBalance: Math.max(0, pfContributions - pfWithdrawalsTotal),
    epfoSyncStatus: "Manual records active. EPFO sync requires an authenticated UAN session and OTP flow.",
  });
}

function companyValues<T extends Record<string, unknown>>(data: T): any {
  return {
    ...data,
    startDate: data.startDate ? dateOrNull(data.startDate) : undefined,
    endDate: data.endDate === null ? null : data.endDate ? dateOrNull(data.endDate) : undefined,
  };
}

const WorkDocumentFolderParams = z.object({ id: z.coerce.number() });
const WorkHistoryFetchInput = z.object({
  userId: z.string().min(1),
  password: z.string().min(1),
});

router.get("/onework/summary", async (_req, res): Promise<void> => {
  res.json(await summaryPayload());
});

router.put("/onework/profile", async (req, res): Promise<void> => {
  const parsed = OneworkProfileInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(oneworkProfileTable);
  const [profile] = existing
    ? await db.update(oneworkProfileTable).set(parsed.data).where(eq(oneworkProfileTable.id, existing.id)).returning()
    : await db.insert(oneworkProfileTable).values(parsed.data).returning();
  res.json(profile);
});

router.post("/onework/companies", async (req, res): Promise<void> => {
  const parsed = WorkCompanyInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(workCompaniesTable).values(companyValues(parsed.data)).returning();
  const companies = await toCompanyRows();
  res.status(201).json(companies.find((company) => company.id === created.id));
});

router.patch("/onework/companies/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkCompanyParams.safeParse(req.params);
  const parsed = WorkCompanyUpdate.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(workCompaniesTable).set(companyValues(parsed.data)).where(eq(workCompaniesTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  const companies = await toCompanyRows();
  res.json(companies.find((company) => company.id === updated.id));
});

router.delete("/onework/companies/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(workCompaniesTable).where(eq(workCompaniesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/onework/folders", async (req, res): Promise<void> => {
  const parsed = WorkDocumentFolderInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(workDocumentFoldersTable).values(parsed.data).returning();
  const folders = await toFolderRows();
  res.status(201).json(folders.find((folder) => folder.id === created.id));
});

router.patch("/onework/folders/:id", async (req, res): Promise<void> => {
  const params = WorkDocumentFolderParams.safeParse(req.params);
  const parsed = WorkDocumentFolderUpdate.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(workDocumentFoldersTable).set(parsed.data).where(eq(workDocumentFoldersTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  const folders = await toFolderRows();
  res.json(folders.find((folder) => folder.id === updated.id));
});

router.delete("/onework/folders/:id", async (req, res): Promise<void> => {
  const params = WorkDocumentFolderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(workDocumentFoldersTable).where(eq(workDocumentFoldersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/onework/document-categories", async (req, res): Promise<void> => {
  const parsed = WorkDocumentCategoryInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(workDocumentCategoriesTable).values(parsed.data).returning();
  res.status(201).json(WorkDocumentCategory.parse(created));
});

router.patch("/onework/document-categories/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkDocumentCategoryParams.safeParse(req.params);
  const parsed = WorkDocumentCategoryUpdate.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(workDocumentCategoriesTable).set(parsed.data).where(eq(workDocumentCategoriesTable.id, params.data.id)).returning();
  res.json(WorkDocumentCategory.parse(updated));
});

router.delete("/onework/document-categories/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkDocumentCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(workDocumentCategoriesTable).where(eq(workDocumentCategoriesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/onework/documents", async (req, res): Promise<void> => {
  const parsed = WorkDocumentInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(workDocumentsTable).values({
    ...parsed.data,
    documentDate: dateOrNull(parsed.data.documentDate),
  }).returning();
  const docs = await toDocumentRows();
  res.status(201).json(docs.find((doc) => doc.id === created.id));
});

router.patch("/onework/documents/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkDocumentParams.safeParse(req.params);
  const parsed = WorkDocumentUpdate.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const update = { ...parsed.data, documentDate: parsed.data.documentDate === undefined ? undefined : dateOrNull(parsed.data.documentDate) };
  const [updated] = await db.update(workDocumentsTable).set(update).where(eq(workDocumentsTable.id, params.data.id)).returning();
  const docs = await toDocumentRows();
  res.json(docs.find((doc) => doc.id === updated.id));
});

router.delete("/onework/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(workDocumentsTable).where(eq(workDocumentsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/onework/pf-entries", async (req, res): Promise<void> => {
  const parsed = WorkPfEntryInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(workPfEntriesTable).values(parsed.data).returning();
  const entries = await toPfEntryRows();
  res.status(201).json(entries.find((entry) => entry.id === created.id));
});

router.patch("/onework/pf-entries/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkPfEntryParams.safeParse(req.params);
  const parsed = WorkPfEntryUpdate.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(workPfEntriesTable).set(parsed.data).where(eq(workPfEntriesTable.id, params.data.id)).returning();
  const entries = await toPfEntryRows();
  res.json(entries.find((entry) => entry.id === updated.id));
});

router.delete("/onework/pf-entries/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkPfEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(workPfEntriesTable).where(eq(workPfEntriesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/onework/pf-withdrawals", async (req, res): Promise<void> => {
  const parsed = WorkPfWithdrawalInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(workPfWithdrawalsTable).values({
    ...parsed.data,
    withdrawalDate: toDateStr(parsed.data.withdrawalDate),
  }).returning();
  const withdrawals = await toWithdrawalRows();
  res.status(201).json(withdrawals.find((withdrawal) => withdrawal.id === created.id));
});

router.patch("/onework/pf-withdrawals/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkPfWithdrawalParams.safeParse(req.params);
  const parsed = WorkPfWithdrawalUpdate.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const update = {
    ...parsed.data,
    withdrawalDate: parsed.data.withdrawalDate ? toDateStr(parsed.data.withdrawalDate) : undefined,
  };
  const [updated] = await db.update(workPfWithdrawalsTable).set(update).where(eq(workPfWithdrawalsTable.id, params.data.id)).returning();
  const withdrawals = await toWithdrawalRows();
  res.json(withdrawals.find((withdrawal) => withdrawal.id === updated.id));
});

router.delete("/onework/pf-withdrawals/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkPfWithdrawalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(workPfWithdrawalsTable).where(eq(workPfWithdrawalsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/onework/epfo/sync", async (_req, res): Promise<void> => {
  res.status(501).json({
    error: "EPFO sync requires an authenticated UAN session, captcha/OTP handling, and user consent. OneWork stores UAN and PF records and is ready for a secure connector.",
  });
});

router.post("/onework/history/fetch", async (req, res): Promise<void> => {
  const parsed = WorkHistoryFetchInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.status(501).json({
    status: "connector_required",
    importedCompanies: 0,
    message: "OneWork received credentials for this session only, but no official authenticated employment-history connector is configured. Passwords are not stored. Add a provider connector before importing company history automatically.",
  });
});

export default router;
