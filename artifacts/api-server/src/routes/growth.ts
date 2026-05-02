import { Router } from "express";
import { db } from "@workspace/db";
import { storesTable } from "@workspace/db/schema/stores";
import { productsTable } from "@workspace/db/schema/products";
import { requireAuth } from "../middlewares/requireAuth.js";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";

const router = Router();

function getStoreUrl(slug: string): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost:80";
  return `https://${domain}/store/${slug}`;
}

router.get("/growth/qr-code", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId)).limit(1);

  if (!store) {
    res.status(404).json({ error: "Store not found. Please create a store first." });
    return;
  }

  const url = getStoreUrl(store.slug);
  const svg = await QRCode.toString(url, { type: "svg", width: 300, margin: 2 });

  res.json({ svg, url });
});

router.get("/growth/share-link", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId)).limit(1);

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const storeUrl = getStoreUrl(store.slug);
  const encodedUrl = encodeURIComponent(storeUrl);
  const storeText = encodeURIComponent(`Check out ${store.name}! Shop online and order via WhatsApp 🛒`);

  res.json({
    url: storeUrl,
    whatsappUrl: `https://wa.me/?text=${storeText}%20${encodedUrl}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${storeText}&url=${encodedUrl}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  });
});

router.post("/growth/broadcast", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { type, message, productIds } = req.body as {
    type: "promotion" | "new_product" | "announcement";
    message: string;
    productIds?: number[];
  };

  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId)).limit(1);

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const storeUrl = getStoreUrl(store.slug);
  let fullMessage = message;

  if (productIds && productIds.length > 0) {
    const products = await db.select({ name: productsTable.name, price: productsTable.price }).from(productsTable).where(eq(productsTable.storeId, store.id));
    const featured = products.filter((p) => productIds.includes(store.id));

    if (featured.length > 0) {
      fullMessage += "\n\n🛍️ *Featured Products:*\n";
      featured.slice(0, 5).forEach((p) => {
        fullMessage += `• ${p.name} — ${store.currency} ${Number(p.price).toFixed(2)}\n`;
      });
    }
  }

  const typeEmoji: Record<string, string> = {
    promotion: "🎉",
    new_product: "🆕",
    announcement: "📢",
  };

  const emoji = typeEmoji[type] ?? "📢";
  const broadcastMessage = `${emoji} *${store.name}*\n\n${fullMessage}\n\n👉 Shop now: ${storeUrl}`;
  const encodedMsg = encodeURIComponent(broadcastMessage);
  const whatsappUrl = `https://wa.me/${store.whatsappNumber}?text=${encodedMsg}`;

  res.json({
    whatsappUrl,
    message: broadcastMessage,
    characterCount: broadcastMessage.length,
  });
});

export default router;
