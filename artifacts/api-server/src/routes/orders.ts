import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, type SQL } from "drizzle-orm";
import { db, ordersTable, storesTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  ListOrdersQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/orders", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.json([]);
    return;
  }

  const queryParams = ListOrdersQueryParams.safeParse(req.query);
  const conditions: SQL[] = [eq(ordersTable.storeId, store.id)];
  if (queryParams.success && queryParams.data.status) {
    conditions.push(eq(ordersTable.status, queryParams.data.status));
  }

  const orders = await db.select().from(ordersTable).where(and(...conditions));
  res.json(orders.map(o => ({ ...o, total: Number(o.total) })));
});

router.post("/orders", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values({ ...parsed.data, total: String(parsed.data.total) })
    .returning();

  res.status(201).json({ ...order, total: Number(order.total) });
});

router.get("/orders/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
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

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.storeId, store.id)));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({ ...order, total: Number(order.total) });
});

router.patch("/orders/:id/status", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
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

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.storeId, store.id)))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({ ...order, total: Number(order.total) });
});

export default router;
