import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, insurancesTable } from "@workspace/db";
import { ListInsurancesResponse, CreateInsuranceBody, CreateInsuranceResponse, UpdateInsuranceParams, UpdateInsuranceBody, UpdateInsuranceResponse, DeleteInsuranceParams, } from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";
const router = Router();
router.get("/insurances", async (_req, res) => {
    const insurances = await db.select().from(insurancesTable).orderBy(insurancesTable.renewalDate);
    res.json(ListInsurancesResponse.parse(insurances));
});
router.post("/insurances", async (req, res) => {
    const parsed = CreateInsuranceBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [insurance] = await db
        .insert(insurancesTable)
        .values({
        name: parsed.data.name,
        insuranceType: parsed.data.insuranceType,
        provider: parsed.data.provider,
        premiumAmount: parsed.data.premiumAmount,
        coverageAmount: parsed.data.coverageAmount,
        renewalDate: toDateStr(parsed.data.renewalDate),
        policyNumber: parsed.data.policyNumber,
    })
        .returning();
    res.status(201).json(CreateInsuranceResponse.parse(insurance));
});
router.patch("/insurances/:id", async (req, res) => {
    const params = UpdateInsuranceParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const parsed = UpdateInsuranceBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const update = { ...parsed.data };
    if (parsed.data.renewalDate !== undefined)
        update.renewalDate = toDateStr(parsed.data.renewalDate);
    const [insurance] = await db
        .update(insurancesTable)
        .set(update)
        .where(eq(insurancesTable.id, params.data.id))
        .returning();
    if (!insurance) {
        res.status(404).json({ error: "Insurance not found" });
        return;
    }
    res.json(UpdateInsuranceResponse.parse(insurance));
});
router.delete("/insurances/:id", async (req, res) => {
    const params = DeleteInsuranceParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const [insurance] = await db
        .delete(insurancesTable)
        .where(eq(insurancesTable.id, params.data.id))
        .returning();
    if (!insurance) {
        res.status(404).json({ error: "Insurance not found" });
        return;
    }
    res.sendStatus(204);
});
export default router;
