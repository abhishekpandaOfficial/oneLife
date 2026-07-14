import { eq, ne } from "drizzle-orm";
import { db, categoriesTable, transactionsTable, loansTable, emisTable, insurancesTable, investmentsTable, goalsTable, creditCardsTable, budgetsTable, } from "@workspace/db";
import { monthRange, monthKey, lastMonthKeys, yearRange, lastYears } from "./dates";
async function sumByType(type, start, end) {
    const rows = await db
        .select({ amount: transactionsTable.amount, date: transactionsTable.date })
        .from(transactionsTable)
        .where(eq(transactionsTable.type, type));
    return rows
        .filter((r) => r.date >= start && r.date <= end)
        .reduce((sum, r) => sum + Number(r.amount), 0);
}
export async function incomeExpenseTotals(start, end) {
    const [income, expense] = await Promise.all([
        sumByType("income", start, end),
        sumByType("expense", start, end),
    ]);
    return { income, expense };
}
export async function expenseByCategory(start, end) {
    const rows = await db
        .select({
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        amount: transactionsTable.amount,
        date: transactionsTable.date,
    })
        .from(transactionsTable)
        .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
        .where(eq(transactionsTable.type, "expense"));
    const inRange = rows.filter((r) => r.date >= start && r.date <= end);
    const byCategory = new Map();
    for (const row of inRange) {
        const key = row.categoryName ?? "Uncategorized";
        const existing = byCategory.get(key);
        if (existing) {
            existing.amount += Number(row.amount);
        }
        else {
            byCategory.set(key, {
                category: key,
                amount: Number(row.amount),
                color: row.categoryColor ?? "#94a3b8",
            });
        }
    }
    return Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
}
export async function monthlyTrend(months) {
    const points = [];
    for (const key of months) {
        const { start, end } = monthRange(key);
        const totals = await incomeExpenseTotals(start, end);
        points.push({ period: key, income: totals.income, expense: totals.expense });
    }
    return points;
}
export async function yearlyTrend(years) {
    const points = [];
    for (const year of years) {
        const { start, end } = yearRange(year);
        const totals = await incomeExpenseTotals(start, end);
        points.push({ period: String(year), income: totals.income, expense: totals.expense });
    }
    return points;
}
export async function totalLoanOutstanding() {
    const loans = await db.select().from(loansTable).where(eq(loansTable.status, "active"));
    return loans.reduce((sum, l) => sum + Number(l.outstandingAmount), 0);
}
export async function totalCreditCardOutstanding() {
    const cards = await db.select().from(creditCardsTable);
    return cards.reduce((sum, c) => sum + Number(c.outstandingAmount), 0);
}
export async function totalInvestmentValue() {
    const investments = await db.select().from(investmentsTable);
    return investments.reduce((sum, i) => sum + Number(i.currentValue), 0);
}
export async function totalInsuranceCoverage() {
    const insurances = await db.select().from(insurancesTable).where(eq(insurancesTable.status, "active"));
    return insurances.reduce((sum, i) => sum + Number(i.coverageAmount), 0);
}
export async function emisDueCount() {
    const rows = await db
        .select({ id: emisTable.id })
        .from(emisTable)
        .where(ne(emisTable.status, "paid"));
    return rows.length;
}
export async function emergencyFundAmount() {
    const rows = await db
        .select()
        .from(goalsTable)
        .where(eq(goalsTable.goalType, "emergency_fund"));
    return rows.reduce((sum, g) => sum + Number(g.currentAmount), 0);
}
export async function totalSavings() {
    const goals = await db.select().from(goalsTable);
    return goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
}
export async function monthlyBudgetSummary(month) {
    const { start, end } = monthRange(month);
    const [budgetRows, expenseRows] = await Promise.all([
        db.select({ plannedAmount: budgetsTable.plannedAmount }).from(budgetsTable).where(eq(budgetsTable.month, month)),
        db
            .select({ amount: transactionsTable.amount, date: transactionsTable.date })
            .from(transactionsTable)
            .where(eq(transactionsTable.type, "expense")),
    ]);
    const plannedAmount = budgetRows.reduce((sum, row) => sum + Number(row.plannedAmount), 0);
    const actualAmount = expenseRows
        .filter((row) => row.date >= start && row.date <= end)
        .reduce((sum, row) => sum + Number(row.amount), 0);
    const utilizationPercent = plannedAmount > 0 ? (actualAmount / plannedAmount) * 100 : 0;
    const status = plannedAmount === 0
        ? "none"
        : utilizationPercent > 100
            ? "over"
            : utilizationPercent >= 90
                ? "warning"
                : "under";
    return {
        month,
        plannedAmount,
        actualAmount,
        remainingAmount: plannedAmount - actualAmount,
        utilizationPercent,
        status,
    };
}
export async function upcomingPayments(limit = 8) {
    const emis = await db
        .select({
        id: emisTable.id,
        dueDate: emisTable.dueDate,
        amount: emisTable.amount,
        status: emisTable.status,
        loanId: emisTable.loanId,
    })
        .from(emisTable)
        .where(ne(emisTable.status, "paid"));
    const loans = await db.select().from(loansTable);
    const loanNameById = new Map(loans.map((l) => [l.id, l.name]));
    const insurances = await db
        .select()
        .from(insurancesTable)
        .where(eq(insurancesTable.status, "active"));
    const cards = await db
        .select()
        .from(creditCardsTable);
    const payments = [
        ...emis.map((e) => ({
            id: e.id,
            name: `${loanNameById.get(e.loanId) ?? "Loan"} EMI`,
            type: "emi",
            dueDate: e.dueDate,
            amount: Number(e.amount),
        })),
        ...insurances.map((i) => ({
            id: i.id,
            name: `${i.name} renewal`,
            type: "insurance",
            dueDate: i.renewalDate,
            amount: Number(i.premiumAmount),
        })),
        ...cards.filter(c => Number(c.outstandingAmount) > 0).map((c) => ({
            id: c.id,
            name: `${c.bankName} ${c.name} bill`,
            type: "credit_card",
            dueDate: c.dueDate,
            amount: Number(c.minimumDue ?? 0) || Number(c.outstandingAmount),
        })),
    ];
    return payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, limit);
}
export { monthRange, monthKey, lastMonthKeys, yearRange, lastYears };
