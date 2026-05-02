import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, categoriesTable, storesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  DeleteCategoryParams,
  ListPublicCategoriesParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/categories", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.json([]);
    return;
  }
  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.storeId, store.id));
  res.json(categories);
});

router.post("/categories", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.status(404).json({ error: "Store not found. Create a store first." });
    return;
  }

  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({ ...parsed.data, storeId: store.id })
    .returning();

  res.status(201).json(category);
});

router.delete("/categories/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  await db
    .delete(categoriesTable)
    .where(and(eq(categoriesTable.id, params.data.id), eq(categoriesTable.storeId, store.id)));

  res.sendStatus(204);
});

router.get("/stores/:slug/categories", async (req: Request, res: Response): Promise<void> => {
  const params = ListPublicCategoriesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, params.data.slug));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.storeId, store.id));
  res.json(categories);
});

export default router;
