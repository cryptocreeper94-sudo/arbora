import type { Express } from "express";
import crypto from "crypto";
import { requireAuth } from "./auth";
import { db } from "./db";
import { users, affiliateReferrals, affiliateCommissions, trustStamps } from "@shared/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

const COMMISSION_TIERS = [
  { name: "Diamond", minConverted: 50, rate: 0.20 },
  { name: "Platinum", minConverted: 30, rate: 0.175 },
  { name: "Gold", minConverted: 15, rate: 0.15 },
  { name: "Silver", minConverted: 5, rate: 0.125 },
  { name: "Base", minConverted: 0, rate: 0.10 },
];

function calculateTier(convertedCount: number) {
  for (const tier of COMMISSION_TIERS) {
    if (convertedCount >= tier.minConverted) {
      return tier;
    }
  }
  return COMMISSION_TIERS[COMMISSION_TIERS.length - 1];
}

function createStampHash(data: Record<string, any>): string {
  const payload = JSON.stringify({ ...data, timestamp: new Date().toISOString() });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function simulatedTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function simulatedBlockHeight(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

async function createTrustStampInternal(userId: number | null, category: string, data: Record<string, any>) {
  const dataHash = createStampHash({ userId, category, ...data });
  await db.insert(trustStamps).values({
    userId,
    category,
    data,
    dataHash,
    txHash: simulatedTxHash(),
    blockHeight: simulatedBlockHeight(),
  });
}

export function registerAffiliateRoutes(app: Express) {
  app.get("/api/affiliate/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;

      const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
      if (!user) return res.status(404).json({ message: "User not found" });

      const referrals = await db.select().from(affiliateReferrals)
        .where(eq(affiliateReferrals.referrerId, userId))
        .orderBy(desc(affiliateReferrals.createdAt));

      const totalReferrals = referrals.length;
      const convertedReferrals = referrals.filter(r => r.status === "converted").length;

      const commissions = await db.select().from(affiliateCommissions)
        .where(eq(affiliateCommissions.referrerId, userId))
        .orderBy(desc(affiliateCommissions.createdAt));

      const pendingEarnings = commissions
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);

      const paidEarnings = commissions
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);

      const tier = calculateTier(convertedReferrals);

      const nextTier = COMMISSION_TIERS.find(t => t.minConverted > convertedReferrals);

      res.json({
        tier: tier.name,
        tierRate: tier.rate,
        nextTier: nextTier ? { name: nextTier.name, minConverted: nextTier.minConverted, rate: nextTier.rate } : null,
        totalReferrals,
        convertedReferrals,
        pendingEarnings: pendingEarnings.toFixed(2),
        paidEarnings: paidEarnings.toFixed(2),
        referrals: referrals.slice(0, 50),
        commissions: commissions.slice(0, 50),
        allTiers: COMMISSION_TIERS.map(t => ({ name: t.name, minConverted: t.minConverted, rate: t.rate })).reverse(),
      });
    } catch (error) {
      console.error("Affiliate dashboard error:", error);
      res.status(500).json({ message: "Failed to load affiliate dashboard" });
    }
  });

  app.get("/api/affiliate/link", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
      if (!user) return res.status(404).json({ message: "User not found" });

      let uniqueHash = user.uniqueHash;
      if (!uniqueHash) {
        uniqueHash = crypto.randomBytes(6).toString("hex");
        await db.update(users).set({ uniqueHash }).where(eq(users.id, userId));
      }

      const baseUrl = process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.repl.co`
        : "https://verdara.tlid.io";

      const referralLink = `${baseUrl}/ref/${uniqueHash}`;

      const crossPlatformLinks = [
        { app: "Trust Layer Hub", domain: "trusthub.tlid.io", link: `https://trusthub.tlid.io/ref/${uniqueHash}` },
        { app: "TrustVault", domain: "trustvault.tlid.io", link: `https://trustvault.tlid.io/ref/${uniqueHash}` },
        { app: "Signal Chat", domain: "signalchat.tlid.io", link: `https://signalchat.tlid.io/ref/${uniqueHash}` },
        { app: "GarageBot", domain: "garagebot.tlid.io", link: `https://garagebot.tlid.io/ref/${uniqueHash}` },
        { app: "Arbora", domain: "arbora.tlid.io", link: `https://arbora.tlid.io/ref/${uniqueHash}` },
      ];

      res.json({
        referralLink,
        uniqueHash,
        crossPlatformLinks,
      });
    } catch (error) {
      console.error("Affiliate link error:", error);
      res.status(500).json({ message: "Failed to generate affiliate link" });
    }
  });

  app.post("/api/affiliate/track", async (req, res) => {
    try {
      const { referralHash, platform } = req.body;
      if (!referralHash || typeof referralHash !== "string") {
        return res.status(400).json({ message: "referralHash is required" });
      }

      const [referrer] = await db.select().from(users).where(eq(users.uniqueHash, referralHash));
      if (!referrer) {
        return res.status(404).json({ message: "Invalid referral link" });
      }

      const [referral] = await db.insert(affiliateReferrals).values({
        referrerId: referrer.id,
        referralHash,
        platform: platform || "verdara",
        status: "pending",
      }).returning();

      res.json({ tracked: true, referralId: referral.id });
    } catch (error) {
      console.error("Affiliate track error:", error);
      res.status(500).json({ message: "Failed to track referral" });
    }
  });

  app.post("/api/affiliate/request-payout", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;

      const pendingCommissions = await db.select().from(affiliateCommissions)
        .where(and(
          eq(affiliateCommissions.referrerId, userId),
          eq(affiliateCommissions.status, "pending")
        ));

      const totalPending = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);

      if (totalPending < 10) {
        return res.status(400).json({
          message: `Minimum payout is 10 SIG. Current pending balance: ${totalPending.toFixed(2)} SIG`,
          pendingBalance: totalPending.toFixed(2),
        });
      }

      for (const commission of pendingCommissions) {
        await db.update(affiliateCommissions)
          .set({ status: "processing" })
          .where(eq(affiliateCommissions.id, commission.id));
      }

      await createTrustStampInternal(userId, "affiliate-payout-request", {
        amount: totalPending.toFixed(2),
        currency: "SIG",
        commissionsCount: pendingCommissions.length,
        appContext: "verdara",
        timestamp: new Date().toISOString(),
      });

      res.json({
        message: "Payout request submitted",
        amount: totalPending.toFixed(2),
        currency: "SIG",
        commissionsCount: pendingCommissions.length,
      });
    } catch (error) {
      console.error("Affiliate payout error:", error);
      res.status(500).json({ message: "Failed to process payout request" });
    }
  });
}
