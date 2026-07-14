import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, emisTable, loansTable } from "@workspace/db";
import { ListEmisResponse, UpdateEmiParams, UpdateEmiBody, UpdateEmiResponse } from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";
import { deleteEmiExpenseTransaction, upsertEmiExpenseTransaction } from "../lib/emi-transactions";
const router = Router();
function roundMoney(value) {
    return Number(value.toFixed(2));
}
function monthlyRate(annualRate) {
    return Number(annualRate) / 100 / 12;
}
function principalPaidByPayment(outstandingBeforePayment, paymentAmount, annualRate) {
    const interestForPeriod = outstandingBeforePayment * monthlyRate(annualRate);
    return roundMoney(Math.min(outstandingBeforePayment, Math.max(0, paymentAmount - interestForPeriod)));
}
function outstandingBeforeReversedPayment(outstandingAfterPayment, paymentAmount, annualRate) {
    const rate = monthlyRate(annualRate);
    if (rate === 0) {
        return outstandingAfterPayment + paymentAmount;
    }
    return roundMoney((outstandingAfterPayment + paymentAmount) / (1 + rate));
}
function emiSelect() {
    return db
        .select({
        id: emisTable.id,
        loanId: emisTable.loanId,
        loanName: loansTable.name,
        dueDate: emisTable.dueDate,
        paidDate: emisTable.paidDate,
        amount: emisTable.amount,
        status: emisTable.status,
        penaltyAmount: emisTable.penaltyAmount,
        overdueDays: emisTable.overdueDays,
    })
        .from(emisTable)
        .innerJoin(loansTable, eq(emisTable.loanId, loansTable.id));
}
router.get("/emis", async (req, res) => {
    const { loanId, status } = req.query;
    const conditions = [];
    if (typeof loanId === "string" && loanId.trim() !== "") {
        const id = Number(loanId);
        if (!Number.isNaN(id))
            conditions.push(eq(emisTable.loanId, id));
    }
    if (status === "paid" || status === "pending" || status === "overdue" || status === "partial") {
        conditions.push(eq(emisTable.status, status));
    }
    const query = emiSelect().orderBy(emisTable.dueDate);
    const emis = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    res.json(ListEmisResponse.parse(emis));
});
router.patch("/emis/:id", async (req, res) => {
    const params = UpdateEmiParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const parsed = UpdateEmiBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [existingEmi] = await db
        .select()
        .from(emisTable)
        .where(eq(emisTable.id, params.data.id));
    if (!existingEmi) {
        res.status(404).json({ error: "EMI not found" });
        return;
    }
    const [loan] = await db
        .select()
        .from(loansTable)
        .where(eq(loansTable.id, existingEmi.loanId));
    const update = {};
    if (parsed.data.status !== undefined) {
        let newStatus = parsed.data.status;
        let paidDate = parsed.data.paidDate ? toDateStr(parsed.data.paidDate) : null;
        let penaltyAmount = 0;
        let overdueDays = 0;
        if (newStatus === "paid") {
            paidDate = paidDate ?? toDateStr(new Date());
        }
        else {
            // Unmarked (pending/overdue)
            paidDate = null;
            const now = new Date();
            const due = new Date(existingEmi.dueDate);
            if (due < now) {
                const diffTime = Math.abs(now.getTime() - due.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                    overdueDays = diffDays;
                    const rate = loan ? Number(loan.penaltyRate) : 2.0;
                    penaltyAmount = Number((existingEmi.amount * (rate / 100) * (diffDays / 30)).toFixed(2));
                    newStatus = "overdue";
                }
            }
            else {
                newStatus = "pending";
            }
        }
        update.status = newStatus;
        update.paidDate = paidDate;
        update.penaltyAmount = penaltyAmount;
        update.overdueDays = overdueDays;
    }
    const [updated] = await db
        .update(emisTable)
        .set(update)
        .where(eq(emisTable.id, params.data.id))
        .returning({ id: emisTable.id });
    if (!updated) {
        res.status(404).json({ error: "EMI not found" });
        return;
    }
    const [emi] = await emiSelect().where(eq(emisTable.id, updated.id));
    const wasPaid = existingEmi.status === "paid";
    const isPaid = emi.status === "paid";
    // If newly marked as paid, update loan outstanding
    if (!wasPaid && isPaid && loan) {
        const principalComponent = principalPaidByPayment(Number(loan.outstandingAmount), Number(existingEmi.amount), Number(loan.interestRate));
        const nextOutstanding = Math.max(0, roundMoney(Number(loan.outstandingAmount) - principalComponent));
        await upsertEmiExpenseTransaction(existingEmi.id, loan.name, Number(existingEmi.amount), emi.paidDate ?? toDateStr(new Date()));
        await db
            .update(loansTable)
            .set({
            outstandingAmount: nextOutstanding,
            status: nextOutstanding === 0 ? "closed" : "active",
        })
            .where(eq(loansTable.id, loan.id));
    }
    // If unmarked from paid to unpaid, restore loan outstanding
    else if (wasPaid && !isPaid && loan) {
        const outstandingBeforePayment = outstandingBeforeReversedPayment(Number(loan.outstandingAmount), Number(existingEmi.amount), Number(loan.interestRate));
        const principalComponent = Math.max(0, roundMoney(outstandingBeforePayment - Number(loan.outstandingAmount)));
        const nextOutstanding = Math.min(Number(loan.principalAmount), roundMoney(Number(loan.outstandingAmount) + principalComponent));
        await deleteEmiExpenseTransaction(existingEmi.id);
        await db
            .update(loansTable)
            .set({
            outstandingAmount: nextOutstanding,
            status: "active",
        })
            .where(eq(loansTable.id, loan.id));
    }
    else if (wasPaid && isPaid && loan) {
        await upsertEmiExpenseTransaction(existingEmi.id, loan.name, Number(existingEmi.amount), emi.paidDate ?? toDateStr(new Date()));
    }
    res.json(UpdateEmiResponse.parse(emi));
});
export default router;
