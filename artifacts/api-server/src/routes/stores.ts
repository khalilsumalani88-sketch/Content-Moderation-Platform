import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, storesTable } from "@workspace/db";
import {
  CreateStoreBody,
  UpdateMyStoreBody,
  GetStoreBySlugParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/stores/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  res.json(store);
});

router.put("/stores/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = UpdateMyStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(storesTable).where(eq(storesTable.userId, userId));
  if (!existing) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const [store] = await db
    .update(storesTable)
    .set(parsed.data)
    .where(eq(storesTable.userId, userId))
    .returning();

  res.json(store);
});

router.post("/stores", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db
    .insert(storesTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json(store);
});

router.post("/stores/generate", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { description } = req.body;
  if (!description) {
    res.status(400).json({ error: "description is required" });
    return;
  }

  const words = description.toLowerCase().split(/\s+/);
  const businessType = words.find((w: string) => ["bakery", "restaurant", "shop", "store", "fashion", "tech", "food", "clothing", "jewelry", "art", "craft"].includes(w)) || "shop";

  const nameBase = description.split(" ").slice(0, 3).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const slugBase = nameBase.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const categoryMap: Record<string, string[]> = {
    bakery: ["Breads", "Pastries", "Cakes", "Beverages"],
    restaurant: ["Starters", "Main Course", "Desserts", "Drinks"],
    fashion: ["Tops", "Bottoms", "Accessories", "Footwear"],
    clothing: ["Men", "Women", "Kids", "Accessories"],
    jewelry: ["Rings", "Necklaces", "Earrings", "Bracelets"],
    food: ["Fresh", "Packaged", "Beverages", "Snacks"],
    default: ["Category 1", "Category 2", "Category 3", "Featured"],
  };

  const categories = categoryMap[businessType] || categoryMap.default;

  const sampleProducts = [
    { name: `${nameBase} Special #1`, price: 29.99, category: categories[0], description: `Our best ${businessType} product — handcrafted with care.` },
    { name: `${nameBase} Classic`, price: 19.99, category: categories[1], description: `A classic ${businessType} staple loved by our customers.` },
    { name: `${nameBase} Premium`, price: 49.99, category: categories[0], description: `Premium quality ${businessType} product for discerning customers.` },
  ];

  res.json({
    name: nameBase,
    slug: slugBase,
    description: `Welcome to ${nameBase} — your destination for quality ${businessType} products.`,
    categories,
    sampleProducts,
  });
});

router.get("/stores/:slug", async (req: Request, res: Response): Promise<void> => {
  const params = GetStoreBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, params.data.slug));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const { userId: _userId, isActive: _isActive, ...publicStore } = store;
  res.json(publicStore);
});

export default router;
