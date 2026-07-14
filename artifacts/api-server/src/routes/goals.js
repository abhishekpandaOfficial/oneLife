import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, goalsTable } from "@workspace/db";
import { ListGoalsResponse, CreateGoalBody, CreateGoalResponse, UpdateGoalParams, UpdateGoalBody, UpdateGoalResponse, DeleteGoalParams, } from "@workspace/api-zod";
import { toDateStr } from "../lib/dates";
const router = Router();
router.get("/goals", async (_req, res) => {
    const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
    res.json(ListGoalsResponse.parse(goals));
});
router.post("/goals", async (req, res) => {
    const parsed = CreateGoalBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [goal] = await db
        .insert(goalsTable)
        .values({
        name: parsed.data.name,
        goalType: parsed.data.goalType,
        targetAmount: parsed.data.targetAmount,
        currentAmount: parsed.data.currentAmount,
        targetDate: parsed.data.targetDate ? toDateStr(parsed.data.targetDate) : null,
    })
        .returning();
    res.status(201).json(CreateGoalResponse.parse(goal));
});
router.patch("/goals/:id", async (req, res) => {
    const params = UpdateGoalParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const parsed = UpdateGoalBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const update = { ...parsed.data };
    if (parsed.data.targetDate !== undefined) {
        update.targetDate = parsed.data.targetDate ? toDateStr(parsed.data.targetDate) : null;
    }
    const [goal] = await db
        .update(goalsTable)
        .set(update)
        .where(eq(goalsTable.id, params.data.id))
        .returning();
    if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
    }
    res.json(UpdateGoalResponse.parse(goal));
});
router.delete("/goals/:id", async (req, res) => {
    const params = DeleteGoalParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const [goal] = await db.delete(goalsTable).where(eq(goalsTable.id, params.data.id)).returning();
    if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
    }
    res.sendStatus(204);
});
export default router;
