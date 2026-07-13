import { Router, type IRouter } from "express";
import { and, eq, ne } from "drizzle-orm";
import { db, loansTable, emisTable } from "@workspace/db";
import {
  ListLoansResponse,
  CreateLoanBody,
  CreateLoanResponse,
  GetLoanParams,
  GetLoanResponse,
  UpdateLoanParams,
  UpdateLoanBody,
  UpdateLoanResponse,
  DeleteLoanParams,
} from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";

const router: IRouter = Router();

async function monthsRemainingFor(loanId: number): Promise<number> {
  const pending = await db
    .select({ id: emisTable.id })
    .from(emisTable)
    .where(and(eq(emisTable.loanId, loanId), ne(emisTable.status, "paid")));
  return pending.length;
}

async function withComputed(loan: typeof loansTable.$inferSelect) {
  const monthsRemaining = await monthsRemainingFor(loan.id);
  return { ...loan, monthsRemaining };
}

router.get("/loans", async (_req, res): Promise<void> => {
  const loans = await db.select().from(loansTable).orderBy(loansTable.createdAt);
  const withMonths = await Promise.all(loans.map(withComputed));
  res.json(ListLoansResponse.parse(withMonths));
});

function generateEmisForLoan(loanId: number, emiAmount: number, tenureMonths: number, startDateStr: string) {
  const [yr, mo, dy] = startDateStr.split("-").map(Number);
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const emis = [];
  for (let i = 0; i < tenureMonths; i++) {
    const dueDate = new Date(yr, (mo - 1) + i, dy);
    const y = dueDate.getFullYear();
    const m = String(dueDate.getMonth() + 1).padStart(2, "0");
    const d = String(dueDate.getDate()).padStart(2, "0");
    const dueDateStr = `${y}-${m}-${d}`;
    
    const dueDateMonthStart = new Date(y, dueDate.getMonth(), 1);
    const isPast = dueDateMonthStart < currentMonthStart;
    
    const status = isPast ? "paid" : "pending";
    const paidDate = isPast ? dueDateStr : null;
    
    emis.push({
      loanId,
      dueDate: dueDateStr,
      paidDate,
      amount: emiAmount,
      status: status as "paid" | "pending",
      penaltyAmount: 0,
      overdueDays: 0
    });
  }
  return emis;
}

router.post("/loans", async (req, res): Promise<void> => {
  const parsed = CreateLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const outstanding = parsed.data.outstandingAmount ?? parsed.data.principalAmount;

  const [loan] = await db
    .insert(loansTable)
    .values({
      name: parsed.data.name,
      loanType: parsed.data.loanType,
      principalAmount: parsed.data.principalAmount,
      outstandingAmount: outstanding,
      interestRate: parsed.data.interestRate,
      emiAmount: parsed.data.emiAmount,
      tenureMonths: parsed.data.tenureMonths,
      startDate: toDateStr(parsed.data.startDate),
      bankName: parsed.data.bankName ?? null,
      bankLogoUrl: parsed.data.bankLogoUrl ?? null,
      disbursementDocUrl: parsed.data.disbursementDocUrl ?? null,
      repaymentScheduleDocUrl: parsed.data.repaymentScheduleDocUrl ?? null,
      penaltyRate: parsed.data.penaltyRate ?? 2.0,
    })
    .returning();

  // Generate EMIs automatically
  const emis = generateEmisForLoan(loan.id, loan.emiAmount, loan.tenureMonths, loan.startDate);
  await db.insert(emisTable).values(emis);

  res.status(201).json(CreateLoanResponse.parse(await withComputed(loan)));
});

router.get("/loans/:id", async (req, res): Promise<void> => {
  const params = GetLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, params.data.id));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  const emis = await db
    .select()
    .from(emisTable)
    .where(eq(emisTable.loanId, loan.id))
    .orderBy(emisTable.dueDate);

  const paidEmis = emis.filter((e) => e.status === "paid");
  const principalPaid = Math.max(0, loan.principalAmount - loan.outstandingAmount);
  const totalPaidAmount = paidEmis.reduce((sum, e) => sum + e.amount, 0);
  const interestPaid = Math.max(0, totalPaidAmount - principalPaid);

  const monthsRemaining = emis.filter((e) => e.status !== "paid").length;

  res.json(
    GetLoanResponse.parse({
      ...loan,
      monthsRemaining,
      principalPaid,
      interestPaid,
      emis: emis.map((e) => ({ ...e, loanName: loan.name })),
    }),
  );
});

router.patch("/loans/:id", async (req, res): Promise<void> => {
  const params = UpdateLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.loanType !== undefined) update.loanType = parsed.data.loanType;
  if (parsed.data.principalAmount !== undefined) update.principalAmount = parsed.data.principalAmount;
  if (parsed.data.outstandingAmount !== undefined) update.outstandingAmount = parsed.data.outstandingAmount;
  if (parsed.data.interestRate !== undefined) update.interestRate = parsed.data.interestRate;
  if (parsed.data.emiAmount !== undefined) update.emiAmount = parsed.data.emiAmount;
  if (parsed.data.tenureMonths !== undefined) update.tenureMonths = parsed.data.tenureMonths;
  if (parsed.data.startDate !== undefined) update.startDate = toDateStr(parsed.data.startDate);
  if (parsed.data.bankName !== undefined) update.bankName = parsed.data.bankName;
  if (parsed.data.bankLogoUrl !== undefined) update.bankLogoUrl = parsed.data.bankLogoUrl;
  if (parsed.data.disbursementDocUrl !== undefined) update.disbursementDocUrl = parsed.data.disbursementDocUrl;
  if (parsed.data.repaymentScheduleDocUrl !== undefined) update.repaymentScheduleDocUrl = parsed.data.repaymentScheduleDocUrl;
  if (parsed.data.penaltyRate !== undefined) update.penaltyRate = parsed.data.penaltyRate;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;

  const [loan] = await db
    .update(loansTable)
    .set(update)
    .where(eq(loansTable.id, params.data.id))
    .returning();

  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  res.json(UpdateLoanResponse.parse(await withComputed(loan)));
});

router.delete("/loans/:id", async (req, res): Promise<void> => {
  const params = DeleteLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [loan] = await db.delete(loansTable).where(eq(loansTable.id, params.data.id)).returning();
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
