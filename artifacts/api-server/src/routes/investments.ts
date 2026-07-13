import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, investmentsTable } from "@workspace/db";
import {
  ListInvestmentsResponse,
  CreateInvestmentBody,
  CreateInvestmentResponse,
  UpdateInvestmentParams,
  UpdateInvestmentBody,
  UpdateInvestmentResponse,
  DeleteInvestmentParams,
} from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";

const router: IRouter = Router();

router.get("/investments", async (_req, res): Promise<void> => {
  const investments = await db.select().from(investmentsTable).orderBy(investmentsTable.purchaseDate);
  res.json(ListInvestmentsResponse.parse(investments));
});

router.post("/investments", async (req, res): Promise<void> => {
  const parsed = CreateInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [investment] = await db
    .insert(investmentsTable)
    .values({
      name: parsed.data.name,
      investmentType: parsed.data.investmentType,
      investedAmount: parsed.data.investedAmount,
      currentValue: parsed.data.currentValue,
      purchaseDate: toDateStr(parsed.data.purchaseDate),
      xirr: parsed.data.xirr ?? null,
    })
    .returning();

  res.status(201).json(CreateInvestmentResponse.parse(investment));
});

router.patch("/investments/:id", async (req, res): Promise<void> => {
  const params = UpdateInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.purchaseDate !== undefined) update.purchaseDate = toDateStr(parsed.data.purchaseDate);

  const [investment] = await db
    .update(investmentsTable)
    .set(update)
    .where(eq(investmentsTable.id, params.data.id))
    .returning();

  if (!investment) {
    res.status(404).json({ error: "Investment not found" });
    return;
  }

  res.json(UpdateInvestmentResponse.parse(investment));
});

router.delete("/investments/:id", async (req, res): Promise<void> => {
  const params = DeleteInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [investment] = await db
    .delete(investmentsTable)
    .where(eq(investmentsTable.id, params.data.id))
    .returning();

  if (!investment) {
    res.status(404).json({ error: "Investment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
