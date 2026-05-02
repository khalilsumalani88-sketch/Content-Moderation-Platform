import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: text("referrer_user_id").notNull(),
  referredUserId: text("referred_user_id").notNull().unique(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("pending"),
  rewardGranted: text("reward_granted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
});

export const referralCodesTable = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  code: text("code").notNull().unique(),
  totalReferrals: integer("total_referrals").notNull().default(0),
  successfulReferrals: integer("successful_referrals").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referralsTable).omit({ id: true, createdAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;
export type ReferralCode = typeof referralCodesTable.$inferSelect;
