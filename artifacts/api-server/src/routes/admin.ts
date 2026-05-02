import { Router } from "express";
import { db } from "@workspace/db";
import { storesTable } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { subscriptionsTable, PLANS, type Plan } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";
import { eq, count, sum, sql, ilike, desc, and, gte } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).userId as string;
  if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(userId)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get("/admin/stats", async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [storeCount] = await db.select({ count: count() }).from(storesTable);
  const [productCount] = await db.select({ count: count() }).from(productsTable);
  const [orderCount] = await db.select({ count: count() }).from(ordersTable);
  const [revenue] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable);
  const [newStores] = await db.select({ count: count() }).from(storesTable).where(gte(storesTable.createdAt, monthStart));
  const [newOrders] = await db.select({ count: count() }).from(ordersTable).where(gte(ordersTable.createdAt, monthStart));

  const planCounts = await db.select({ plan: subscriptionsTable.plan, count: count() }).from(subscriptionsTable).groupBy(subscriptionsTable.plan);

  const planMap: Record<string, number> = {};
  planCounts.forEach((r) => { planMap[r.plan] = Number(r.count); });

  res.json({
    totalStores: Number(storeCount?.count ?? 0),
    totalProducts: Number(productCount?.count ?? 0),
    totalOrders: Number(orderCount?.count ?? 0),
    totalRevenue: Number(revenue?.total ?? 0),
    freeUsers: planMap["free"] ?? 0,
    proUsers: planMap["pro"] ?? 0,
    businessUsers: planMap["business"] ?? 0,
    newStoresThisMonth: Number(newStores?.count ?? 0),
    newOrdersThisMonth: Number(newOrders?.count ?? 0),
  });
});

router.get("/admin/stores", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  const baseQuery = search
    ? db.select().from(storesTable).where(ilike(storesTable.name, `%${search}%`))
    : db.select().from(storesTable);

  const stores = await baseQuery.orderBy(desc(storesTable.createdAt)).limit(limit).offset(offset);
  const [totalRow] = await db.select({ count: count() }).from(storesTable);
  const total = Number(totalRow?.count ?? 0);

  const enriched = await Promise.all(
    stores.map(async (store) => {
      const [pc] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.storeId, store.id));
      const [oc] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.storeId, store.id));
      const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, store.userId)).limit(1);
      return {
        id: store.id,
        userId: store.userId,
        name: store.name,
        slug: store.slug,
        whatsappNumber: store.whatsappNumber,
        plan: sub?.plan ?? "free",
        productCount: Number(pc?.count ?? 0),
        orderCount: Number(oc?.count ?? 0),
        createdAt: store.createdAt,
      };
    })
  );

  res.json({ stores: enriched, total, page, limit });
});

router.patch("/admin/stores/:id/plan", async (req, res) => {
  const storeId = Number(req.params.id);
  const { plan } = req.body as { plan: string };

  if (!PLANS.includes(plan as Plan)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, storeId)).limit(1);
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({ userId: store.userId, plan, status: "active" })
    .onConflictDoUpdate({ target: subscriptionsTable.userId, set: { plan, status: "active" } })
    .returning();

  res.json(sub);
});

router.get("/admin/analytics", async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const revenueRows = await db
    .select({
      date: sql<string>`DATE(${ordersTable.createdAt})`,
      revenue: sum(ordersTable.total),
      orders: count(),
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${ordersTable.createdAt})`)
    .orderBy(sql`DATE(${ordersTable.createdAt})`);

  const topStoreRows = await db
    .select({
      storeId: ordersTable.storeId,
      revenue: sum(ordersTable.total),
      orders: count(),
    })
    .from(ordersTable)
    .groupBy(ordersTable.storeId)
    .orderBy(desc(sum(ordersTable.total)))
    .limit(10);

  const storeNames: Record<number, string> = {};
  for (const row of topStoreRows) {
    const [store] = await db.select({ name: storesTable.name }).from(storesTable).where(eq(storesTable.id, row.storeId)).limit(1);
    storeNames[row.storeId] = store?.name ?? "Unknown";
  }

  const planCounts = await db.select({ plan: subscriptionsTable.plan, count: count() }).from(subscriptionsTable).groupBy(subscriptionsTable.plan);
  const planMap: Record<string, number> = {};
  planCounts.forEach((r) => { planMap[r.plan] = Number(r.count); });

  res.json({
    revenueByDay: revenueRows.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders),
    })),
    topStores: topStoreRows.map((r) => ({
      storeId: r.storeId,
      storeName: storeNames[r.storeId] ?? "Unknown",
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders),
    })),
    planDistribution: {
      free: planMap["free"] ?? 0,
      pro: planMap["pro"] ?? 0,
      business: planMap["business"] ?? 0,
    },
  });
});

export default router;
