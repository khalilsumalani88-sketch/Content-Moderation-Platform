import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, PLAN_LIMITS, PLANS, type Plan } from "@workspace/db/schema/subscriptions";
import { storesTable } from "@workspace/db/schema/stores";
import { productsTable } from "@workspace/db/schema/products";
import { ordersTable } from "@workspace/db/schema/orders";
import { requireAuth } from "../middlewares/requireAuth.js";
import { eq, and, count } from "drizzle-orm";

const router = Router();

const PLAN_PRICES: Record<Plan, number> = {
  free: 0,
  pro: 29,
  business: 99,
};

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ["1 store", "10 products", "50 orders/month", "Basic analytics", "WhatsApp checkout"],
  pro: ["3 stores", "100 products", "500 orders/month", "Advanced analytics", "AI features", "QR code generator", "Referral system"],
  business: ["10 stores", "Unlimited products", "Unlimited orders", "Full analytics", "All AI features", "Priority support", "WhatsApp broadcast"],
};

async function getOrCreateSubscription(userId: string) {
  const [existing] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(subscriptionsTable).values({ userId, plan: "free", status: "active" }).returning();
  return created;
}

router.get("/subscriptions/plans", async (_req, res) => {
  const plans = PLANS.map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    price: PLAN_PRICES[id],
    currency: "USD",
    productLimit: PLAN_LIMITS[id].products,
    orderLimit: PLAN_LIMITS[id].orders,
    storeLimit: PLAN_LIMITS[id].stores,
    features: PLAN_FEATURES[id],
  }));
  res.json(plans);
});

router.get("/subscriptions/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const sub = await getOrCreateSubscription(userId);
  res.json(sub);
});

router.post("/subscriptions/upgrade", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { plan } = req.body as { plan: string };

  if (!PLANS.includes(plan as Plan)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({ userId, plan, status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: { plan, status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    })
    .returning();

  res.json(sub);
});

router.get("/subscriptions/limits", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const sub = await getOrCreateSubscription(userId);
  const plan = (sub.plan as Plan) ?? "free";
  const limits = PLAN_LIMITS[plan];

  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId)).limit(1);

  let productCount = 0;
  let orderCount = 0;
  let storeCount = 0;

  if (store) {
    const [pc] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.storeId, store.id));
    const [oc] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.storeId, store.id));
    productCount = Number(pc?.count ?? 0);
    orderCount = Number(oc?.count ?? 0);
    storeCount = 1;
  }

  res.json({
    plan,
    products: { used: productCount, limit: limits.products },
    orders: { used: orderCount, limit: limits.orders },
    stores: { used: storeCount, limit: limits.stores },
  });
});

export default router;
