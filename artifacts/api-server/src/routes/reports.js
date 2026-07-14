import { Router } from "express";
import { GetReportSummaryQueryParams, GetReportSummaryResponse } from "@workspace/api-zod";
import { monthKey, monthRange, yearRange, lastMonthKeys, lastYears } from "../lib/dates";
import { incomeExpenseTotals, expenseByCategory, monthlyTrend, yearlyTrend, totalInvestmentValue, totalLoanOutstanding, totalSavings, } from "../lib/finance";
import { syncPaidEmiExpenseTransactions } from "../lib/emi-transactions";
const router = Router();
router.get("/reports/summary", async (req, res) => {
    const query = GetReportSummaryQueryParams.safeParse(req.query);
    if (!query.success) {
        res.status(400).json({ error: query.error.message });
        return;
    }
    const now = new Date();
    if (query.data.period === "monthly") {
        const key = monthKey(now);
        const { start, end } = monthRange(key);
        await syncPaidEmiExpenseTransactions(start, end);
        const [totals, categoryBreakdown, trend] = await Promise.all([
            incomeExpenseTotals(start, end),
            expenseByCategory(start, end),
            monthlyTrend(lastMonthKeys(now, 6)),
        ]);
        const [investmentValue, loanOutstanding, savings] = await Promise.all([
            totalInvestmentValue(),
            totalLoanOutstanding(),
            totalSavings(),
        ]);
        const netWorth = investmentValue + savings - loanOutstanding;
        const netWorthTrend = trend.map((point, idx) => ({
            period: point.period,
            netWorth: netWorth - (trend.length - 1 - idx) * (point.income - point.expense) * 0.15,
        }));
        res.json(GetReportSummaryResponse.parse({
            totalIncome: totals.income,
            totalExpense: totals.expense,
            netSavings: totals.income - totals.expense,
            categoryBreakdown,
            trend,
            netWorthTrend,
        }));
        return;
    }
    const year = now.getFullYear();
    const { start, end } = yearRange(year);
    await syncPaidEmiExpenseTransactions(start, end);
    const [totals, categoryBreakdown, trend] = await Promise.all([
        incomeExpenseTotals(start, end),
        expenseByCategory(start, end),
        yearlyTrend(lastYears(year, 5)),
    ]);
    const [investmentValue, loanOutstanding, savings] = await Promise.all([
        totalInvestmentValue(),
        totalLoanOutstanding(),
        totalSavings(),
    ]);
    const netWorth = investmentValue + savings - loanOutstanding;
    const netWorthTrend = trend.map((point, idx) => ({
        period: point.period,
        netWorth: netWorth - (trend.length - 1 - idx) * (point.income - point.expense) * 0.4,
    }));
    res.json(GetReportSummaryResponse.parse({
        totalIncome: totals.income,
        totalExpense: totals.expense,
        netSavings: totals.income - totals.expense,
        categoryBreakdown,
        trend,
        netWorthTrend,
    }));
});
export default router;
