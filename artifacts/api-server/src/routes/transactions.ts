import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";
import { db, categoriesTable, transactionsTable } from "@workspace/db";
import {
  ListTransactionsResponse,
  CreateTransactionBody,
  CreateTransactionResponse,
  GetTransactionParams,
  GetTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  DeleteTransactionParams,
} from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";

const router: IRouter = Router();

function transactionSelect() {
  return db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      description: transactionsTable.description,
      date: transactionsTable.date,
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      isRecurring: transactionsTable.isRecurring,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id));
}

router.get("/transactions", async (req, res): Promise<void> => {
  const { type, categoryId, from, to, search } = req.query;
  const fromDate = typeof from === "string" && from.trim() !== "" ? toDateStr(new Date(from)) : undefined;
  const toDate = typeof to === "string" && to.trim() !== "" ? toDateStr(new Date(to)) : undefined;

  const conditions: SQL[] = [];
  if (type === "income" || type === "expense") {
    conditions.push(eq(transactionsTable.type, type));
  }
  if (typeof categoryId === "string" && categoryId.trim() !== "") {
    const id = Number(categoryId);
    if (!Number.isNaN(id)) conditions.push(eq(transactionsTable.categoryId, id));
  }
  if (typeof from === "string" && from.trim() !== "") {
    conditions.push(gte(transactionsTable.date, fromDate!));
  }
  if (typeof to === "string" && to.trim() !== "") {
    conditions.push(lte(transactionsTable.date, toDate!));
  }
  if (typeof search === "string" && search.trim() !== "") {
    conditions.push(ilike(transactionsTable.description, `%${search.trim()}%`));
  }

  const query = transactionSelect().orderBy(desc(transactionsTable.date), desc(transactionsTable.id));
  const transactions = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  res.json(ListTransactionsResponse.parse(transactions));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(transactionsTable)
    .values({
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description,
      date: toDateStr(parsed.data.date),
      categoryId: parsed.data.categoryId ?? null,
      isRecurring: parsed.data.isRecurring,
    })
    .returning({ id: transactionsTable.id });

  const [transaction] = await transactionSelect().where(eq(transactionsTable.id, created.id));
  res.status(201).json(CreateTransactionResponse.parse(transaction));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await transactionSelect().where(eq(transactionsTable.id, params.data.id));
  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse(transaction));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date !== undefined) update.date = toDateStr(parsed.data.date);

  const [updated] = await db
    .update(transactionsTable)
    .set(update)
    .where(eq(transactionsTable.id, params.data.id))
    .returning({ id: transactionsTable.id });

  if (!updated) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const [transaction] = await transactionSelect().where(eq(transactionsTable.id, updated.id));
  res.json(UpdateTransactionResponse.parse(transaction));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
