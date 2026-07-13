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
    })
    .returning();

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

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startDate !== undefined) update.startDate = toDateStr(parsed.data.startDate);

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
