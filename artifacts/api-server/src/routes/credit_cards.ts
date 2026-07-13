import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creditCardsTable } from "@workspace/db";
import {
  ListCreditCardsResponse,
  CreateCreditCardBody,
  CreateCreditCardResponse,
  UpdateCreditCardParams,
  UpdateCreditCardBody,
  UpdateCreditCardResponse,
  DeleteCreditCardParams,
} from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";

const router: IRouter = Router();

router.get("/credit-cards", async (_req, res): Promise<void> => {
  const cards = await db.select().from(creditCardsTable).orderBy(creditCardsTable.createdAt);
  res.json(ListCreditCardsResponse.parse(cards));
});

router.post("/credit-cards", async (req, res): Promise<void> => {
  const parsed = CreateCreditCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [card] = await db
    .insert(creditCardsTable)
    .values({
      name: parsed.data.name,
      bankName: parsed.data.bankName,
      bankLogoUrl: parsed.data.bankLogoUrl ?? null,
      creditLimit: parsed.data.creditLimit,
      outstandingAmount: parsed.data.outstandingAmount ?? 0,
      dueDate: toDateStr(parsed.data.dueDate),
      minimumDue: parsed.data.minimumDue ?? 0,
    })
    .returning();

  res.status(201).json(CreateCreditCardResponse.parse(card));
});

router.patch("/credit-cards/:id", async (req, res): Promise<void> => {
  const params = UpdateCreditCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCreditCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.bankName !== undefined) update.bankName = parsed.data.bankName;
  if (parsed.data.bankLogoUrl !== undefined) update.bankLogoUrl = parsed.data.bankLogoUrl;
  if (parsed.data.creditLimit !== undefined) update.creditLimit = parsed.data.creditLimit;
  if (parsed.data.outstandingAmount !== undefined) update.outstandingAmount = parsed.data.outstandingAmount;
  if (parsed.data.dueDate !== undefined) update.dueDate = toDateStr(parsed.data.dueDate);
  if (parsed.data.minimumDue !== undefined) update.minimumDue = parsed.data.minimumDue;

  const [card] = await db
    .update(creditCardsTable)
    .set(update)
    .where(eq(creditCardsTable.id, params.data.id))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Credit card not found" });
    return;
  }

  res.json(UpdateCreditCardResponse.parse(card));
});

router.delete("/credit-cards/:id", async (req, res): Promise<void> => {
  const params = DeleteCreditCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [card] = await db
    .delete(creditCardsTable)
    .where(eq(creditCardsTable.id, params.data.id))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Credit card not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
