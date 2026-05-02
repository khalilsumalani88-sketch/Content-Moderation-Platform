import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, ilike, type SQL } from "drizzle-orm";
import { db, productsTable, storesTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListPublicProductsParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/products", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.status(404).json({ error: "Store not found. Create a store first." });
    return;
  }

  const conditions: SQL[] = [eq(productsTable.storeId, store.id)];
  if (req.query.category) {
    conditions.push(eq(productsTable.category, req.query.category as string));
  }
  if (req.query.search) {
    conditions.push(ilike(productsTable.name, `%${req.query.search}%`));
  }

  const products = await db.select().from(productsTable).where(and(...conditions));
  res.json(products.map(p => ({ ...p, price: Number(p.price) })));
});

router.post("/products", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.status(404).json({ error: "Store not found. Create a store first." });
    return;
  }

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, storeId: store.id, price: String(parsed.data.price) })
    .returning();

  res.status(201).json({ ...product, price: Number(product.price) });
});

router.get("/products/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
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

  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.storeId, store.id)));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, price: Number(product.price) });
});

router.put("/products/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) {
    updateData.price = String(parsed.data.price);
  }

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.storeId, store.id)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, price: Number(product.price) });
});

router.delete("/products/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
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
    .delete(productsTable)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.storeId, store.id)));

  res.sendStatus(204);
});

router.get("/stores/:slug/products", async (req: Request, res: Response): Promise<void> => {
  const params = ListPublicProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, params.data.slug));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const conditions: SQL[] = [eq(productsTable.storeId, store.id), eq(productsTable.isAvailable, true)];
  if (req.query.category) {
    conditions.push(eq(productsTable.category, req.query.category as string));
  }
  if (req.query.search) {
    conditions.push(ilike(productsTable.name, `%${req.query.search}%`));
  }

  const products = await db.select().from(productsTable).where(and(...conditions));
  res.json(products.map(p => ({ ...p, price: Number(p.price) })));
});

export default router;
