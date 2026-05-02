import { Router, type IRouter, type Request, type Response } from "express";
import { eq, count, sum, and, gte } from "drizzle-orm";
import { db, ordersTable, productsTable, storesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.json({
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      revenueThisMonth: 0,
      ordersThisMonth: 0,
    });
    return;
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalOrdersRow] = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(eq(ordersTable.storeId, store.id));

  const [totalRevenueRow] = await db
    .select({ value: sum(ordersTable.total) })
    .from(ordersTable)
    .where(eq(ordersTable.storeId, store.id));

  const [totalProductsRow] = await db
    .select({ value: count() })
    .from(productsTable)
    .where(eq(productsTable.storeId, store.id));

  const [pendingRow] = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, store.id), eq(ordersTable.status, "pending")));

  const [completedRow] = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, store.id), eq(ordersTable.status, "completed")));

  const [monthRevenueRow] = await db
    .select({ value: sum(ordersTable.total) })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, store.id), gte(ordersTable.createdAt, startOfMonth)));

  const [monthOrdersRow] = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, store.id), gte(ordersTable.createdAt, startOfMonth)));

  res.json({
    totalOrders: Number(totalOrdersRow?.value ?? 0),
    totalRevenue: Number(totalRevenueRow?.value ?? 0),
    totalProducts: Number(totalProductsRow?.value ?? 0),
    pendingOrders: Number(pendingRow?.value ?? 0),
    completedOrders: Number(completedRow?.value ?? 0),
    revenueThisMonth: Number(monthRevenueRow?.value ?? 0),
    ordersThisMonth: Number(monthOrdersRow?.value ?? 0),
  });
});

router.get("/dashboard/recent-orders", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.json([]);
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.storeId, store.id))
    .orderBy(ordersTable.createdAt)
    .limit(10);

  res.json(orders.map(o => ({ ...o, total: Number(o.total) })));
});

router.get("/dashboard/top-products", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.json([]);
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.storeId, store.id));

  const productMap = new Map<number, { productId: number; productName: string; totalOrders: number; totalRevenue: number }>();

  for (const order of orders) {
    const items = order.items as Array<{ productId: number; productName: string; price: number; quantity: number }>;
    for (const item of items) {
      const existing = productMap.get(item.productId) ?? { productId: item.productId, productName: item.productName, totalOrders: 0, totalRevenue: 0 };
      existing.totalOrders += item.quantity;
      existing.totalRevenue += item.price * item.quantity;
      productMap.set(item.productId, existing);
    }
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);

  res.json(topProducts);
});

export default router;
