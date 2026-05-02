import { Router } from "express";
import { db } from "@workspace/db";
import { referralsTable, referralCodesTable } from "@workspace/db/schema/referrals";
import { subscriptionsTable } from "@workspace/db/schema/subscriptions";
import { requireAuth } from "../middlewares/requireAuth.js";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const router = Router();

function generateCode(userId: string): string {
  const random = randomBytes(4).toString("hex").toUpperCase();
  const prefix = userId.slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  return `${prefix}${random}`;
}

async function getOrCreateReferralCode(userId: string) {
  const [existing] = await db.select().from(referralCodesTable).where(eq(referralCodesTable.userId, userId)).limit(1);
  if (existing) return existing;

  const code = generateCode(userId);
  const [created] = await db.insert(referralCodesTable).values({ userId, code }).returning();
  return created;
}

router.get("/referrals/my-code", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const refCode = await getOrCreateReferralCode(userId);
  const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost:80";
  const referralUrl = `https://${baseUrl}/?ref=${refCode.code}`;

  res.json({
    code: refCode.code,
    totalReferrals: refCode.totalReferrals,
    successfulReferrals: refCode.successfulReferrals,
    referralUrl,
  });
});

router.get("/referrals/stats", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const refCode = await getOrCreateReferralCode(userId);

  const allReferrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerUserId, userId));
  const pending = allReferrals.filter((r) => r.status === "pending").length;

  res.json({
    code: refCode.code,
    totalReferrals: refCode.totalReferrals,
    successfulReferrals: refCode.successfulReferrals,
    pendingReferrals: pending,
    rewardsPending: pending,
  });
});

router.post("/referrals/apply", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { code } = req.body as { code: string };

  if (!code) {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  const [refCodeRow] = await db.select().from(referralCodesTable).where(eq(referralCodesTable.code, code.toUpperCase().trim())).limit(1);
  if (!refCodeRow) {
    res.status(404).json({ error: "Invalid referral code" });
    return;
  }

  if (refCodeRow.userId === userId) {
    res.status(400).json({ error: "You cannot use your own referral code" });
    return;
  }

  const [existingReferral] = await db.select().from(referralsTable).where(eq(referralsTable.referredUserId, userId)).limit(1);
  if (existingReferral) {
    res.status(400).json({ error: "You have already used a referral code" });
    return;
  }

  await db.insert(referralsTable).values({
    referrerUserId: refCodeRow.userId,
    referredUserId: userId,
    code: refCodeRow.code,
    status: "converted",
    rewardGranted: "1_month_pro",
    convertedAt: new Date(),
  });

  await db
    .update(referralCodesTable)
    .set({
      totalReferrals: sql`${referralCodesTable.totalReferrals} + 1`,
      successfulReferrals: sql`${referralCodesTable.successfulReferrals} + 1`,
    })
    .where(eq(referralCodesTable.userId, refCodeRow.userId));

  res.json({ success: true, message: "Referral applied! You've earned 1 month of Pro.", reward: "1_month_pro" });
});

export default router;
