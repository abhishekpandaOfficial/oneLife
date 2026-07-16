import type { QueryClient } from "@tanstack/react-query";
import {
  getGetDashboardSummaryQueryKey,
  getGetReportSummaryQueryKey,
  getListBudgetsQueryKey,
  getListCategoriesQueryKey,
  getListTransactionsQueryKey,
} from "@workspace/api-client-react";

export function invalidateFinanceCategoryData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetReportSummaryQueryKey() }),
  ]);
}
