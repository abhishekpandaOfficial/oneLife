import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { monthKey, monthRange, lastMonthKeys } from "../lib/dates";
import {
  incomeExpenseTotals,
  expenseByCategory,
  monthlyTrend,
  totalLoanOutstanding,
  totalInvestmentValue,
  totalInsuranceCoverage,
  emisDueCount,
  emergencyFundAmount,
  totalSavings,
  upcomingPayments,
} from "../lib/finance";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const key = monthKey(now);
  const { start, end } = monthRange(key);

  const [
    { income, expense },
    categoryBreakdown,
    trend,
    loanOutstanding,
    investmentValue,
    insuranceCoverage,
    dueCount,
    emergencyFund,
    savings,
    payments,
  ] = await Promise.all([
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
  ]);

  const netWorth = investmentValue + savings - loanOutstanding;

  res.json(
    GetDashboardSummaryResponse.parse({
      monthlyIncome: income,
      monthlyExpenses: expense,
      remainingBalance: income - expense,
      totalSavings: savings,
      netWorth,
      totalLoanOutstanding: loanOutstanding,
      totalInvestmentValue: investmentValue,
      totalInsuranceCoverage: insuranceCoverage,
      emisDueCount: dueCount,
      emergencyFundAmount: emergencyFund,
      expenseByCategory: categoryBreakdown,
      incomeVsExpenseTrend: trend,
      upcomingPayments: payments,
    }),
  );
});

export default router;
