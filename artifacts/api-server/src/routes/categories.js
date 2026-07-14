import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { ListCategoriesQueryParams, ListCategoriesResponse, CreateCategoryBody, CreateCategoryResponse, DeleteCategoryParams, } from "@workspace/api-zod";
const router = Router();
router.get("/categories", async (req, res) => {
    const query = ListCategoriesQueryParams.safeParse(req.query);
    if (!query.success) {
        res.status(400).json({ error: query.error.message });
        return;
    }
    const categories = query.data.type
        ? await db.select().from(categoriesTable).where(eq(categoriesTable.type, query.data.type))
        : await db.select().from(categoriesTable);
    res.json(ListCategoriesResponse.parse(categories));
});
router.post("/categories", async (req, res) => {
    const parsed = CreateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [category] = await db.insert(categoriesTable).values(parsed.data).returning();
    res.status(201).json(CreateCategoryResponse.parse(category));
});
router.delete("/categories/:id", async (req, res) => {
    const params = DeleteCategoryParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const [category] = await db
        .delete(categoriesTable)
        .where(eq(categoriesTable.id, params.data.id))
        .returning();
    if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
    }
    res.sendStatus(204);
});
export default router;
