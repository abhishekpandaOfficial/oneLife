import { Router } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { monthKey, monthRange, lastMonthKeys } from "../lib/dates";
import { incomeExpenseTotals, expenseByCategory, monthlyTrend, totalLoanOutstanding, totalInvestmentValue, totalInsuranceCoverage, emisDueCount, emergencyFundAmount, totalSavings, upcomingPayments, totalCreditCardOutstanding, monthlyBudgetSummary, totalPfBalance, } from "../lib/finance";
const router = Router();
router.get("/dashboard/summary", async (_req, res) => {
    const now = new Date();
    const key = monthKey(now);
    const { start, end } = monthRange(key);
    const [{ income, expense }, categoryBreakdown, trend, loanOutstanding, investmentValue, insuranceCoverage, dueCount, emergencyFund, savings, payments, creditCardOutstanding, budgetSummary, pfBalance,] = await Promise.all([
        incomeExpenseTotals(start, end),
        expenseByCategory(start, end),
        monthlyTrend(lastMonthKeys(now, 6)),
        totalLoanOutstanding(),
        totalInvestmentValue(),
        totalInsuranceCoverage(),
        emisDueCount(),
        emergencyFundAmount(),
        totalSavings(),
        upcomingPayments(),
        totalCreditCardOutstanding(),
        monthlyBudgetSummary(key),
        totalPfBalance(),
    ]);
    const netWorth = investmentValue + savings + pfBalance - loanOutstanding - creditCardOutstanding;
    const netWorthChange = income - expense;
    const openingNetWorth = netWorth - netWorthChange;
    const netWorthChangePercent = openingNetWorth !== 0 ? (netWorthChange / Math.abs(openingNetWorth)) * 100 : 0;
    res.json(GetDashboardSummaryResponse.parse({
        monthlyIncome: income,
        monthlyExpenses: expense,
        remainingBalance: income - expense,
        totalSavings: savings,
        netWorth,
        totalLoanOutstanding: loanOutstanding,
        totalCreditCardOutstanding: creditCardOutstanding,
        totalInvestmentValue: investmentValue,
        totalInsuranceCoverage: insuranceCoverage,
        pfBalance,
        netWorthChange,
        netWorthChangePercent,
        emisDueCount: dueCount,
        emergencyFundAmount: emergencyFund,
        budgetSummary,
        expenseByCategory: categoryBreakdown,
        incomeVsExpenseTrend: trend,
        upcomingPayments: payments,
    }));
});
export default router;
