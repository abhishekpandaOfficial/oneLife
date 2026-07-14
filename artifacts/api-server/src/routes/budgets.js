import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, budgetsTable, categoriesTable, transactionsTable } from "@workspace/db";
import { ListBudgetsQueryParams, ListBudgetsResponse, CreateBudgetBody, CreateBudgetResponse, UpdateBudgetParams, UpdateBudgetBody, UpdateBudgetResponse, DeleteBudgetParams, } from "@workspace/api-zod";
import { monthRange } from "../lib/dates";
const router = Router();
async function actualAmountFor(categoryId, month) {
    const { start, end } = monthRange(month);
    const rows = await db
        .select({ amount: transactionsTable.amount, date: transactionsTable.date })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.categoryId, categoryId), eq(transactionsTable.type, "expense")));
    return rows
        .filter((r) => r.date >= start && r.date <= end)
        .reduce((sum, r) => sum + r.amount, 0);
}
async function toResponseRow(budget) {
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, budget.categoryId));
    const actualAmount = await actualAmountFor(budget.categoryId, budget.month);
    return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: category?.name ?? "Uncategorized",
        categoryColor: category?.color ?? "#94a3b8",
        month: budget.month,
        plannedAmount: budget.plannedAmount,
        actualAmount,
    };
}
router.get("/budgets", async (req, res) => {
    const query = ListBudgetsQueryParams.safeParse(req.query);
    if (!query.success) {
        res.status(400).json({ error: query.error.message });
        return;
    }
    const budgets = await db.select().from(budgetsTable).where(eq(budgetsTable.month, query.data.month));
    const rows = await Promise.all(budgets.map(toResponseRow));
    res.json(ListBudgetsResponse.parse(rows));
});
router.post("/budgets", async (req, res) => {
    const parsed = CreateBudgetBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [existing] = await db
        .select()
        .from(budgetsTable)
        .where(and(eq(budgetsTable.categoryId, parsed.data.categoryId), eq(budgetsTable.month, parsed.data.month)));
    const [budget] = existing
        ? await db
            .update(budgetsTable)
            .set({ plannedAmount: parsed.data.plannedAmount })
            .where(eq(budgetsTable.id, existing.id))
            .returning()
        : await db
            .insert(budgetsTable)
            .values({
            categoryId: parsed.data.categoryId,
            month: parsed.data.month,
            plannedAmount: parsed.data.plannedAmount,
        })
            .returning();
    res.status(201).json(CreateBudgetResponse.parse(await toResponseRow(budget)));
});
router.patch("/budgets/:id", async (req, res) => {
    const params = UpdateBudgetParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const parsed = UpdateBudgetBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const update = {};
    if (parsed.data.plannedAmount !== undefined)
        update.plannedAmount = parsed.data.plannedAmount;
    const [budget] = await db
        .update(budgetsTable)
        .set(update)
        .where(eq(budgetsTable.id, params.data.id))
        .returning();
    if (!budget) {
        res.status(404).json({ error: "Budget not found" });
        return;
    }
    res.json(UpdateBudgetResponse.parse(await toResponseRow(budget)));
});
router.delete("/budgets/:id", async (req, res) => {
    const params = DeleteBudgetParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const [budget] = await db.delete(budgetsTable).where(eq(budgetsTable.id, params.data.id)).returning();
    if (!budget) {
        res.status(404).json({ error: "Budget not found" });
        return;
    }
    res.sendStatus(204);
});
export default router;
