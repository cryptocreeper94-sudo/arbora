import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./db";
import { hallmarks, trustStamps, hallmarkCounter } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const APP_PREFIX = "VD";
const APP_NAME = "Verdara";
const APP_SLUG = "verdara";
const COUNTER_ID = "vd-master";

function generateDataHash(payload: Record<string, any>): string {
  const str = JSON.stringify(payload);
  return crypto.createHash("sha256").update(str).digest("hex");
}

function simulatedTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function simulatedBlockHeight(): string {
  return String(1000000 + Math.floor(Math.random() * 9000000));
}

function formatHallmarkId(sequence: number): string {
  return `${APP_PREFIX}-${String(sequence).padStart(8, "0")}`;
}

async function getNextSequence(): Promise<number> {
  const result = await db
    .insert(hallmarkCounter)
    .values({ id: COUNTER_ID, currentSequence: "1" })
    .onConflictDoUpdate({
      target: hallmarkCounter.id,
      set: {
        currentSequence: sql`(CAST(${hallmarkCounter.currentSequence} AS integer) + 1)::text`,
      },
    })
    .returning();

  return parseInt(result[0].currentSequence, 10);
}

export async function generateHallmark(data: {
  userId?: number | null;
  appId: string;
  appName?: string;
  productName: string;
  releaseType: string;
  metadata?: Record<string, any>;
}) {
  const sequence = await getNextSequence();
  const thId = formatHallmarkId(sequence);
  const timestamp = new Date().toISOString();

  const hashPayload = {
    thId,
    userId: data.userId || null,
    appId: data.appId,
    appName: data.appName || APP_NAME,
    productName: data.productName,
    releaseType: data.releaseType,
    timestamp,
  };

  const dataHash = generateDataHash(hashPayload);
  const txHash = simulatedTxHash();
  const blockHeight = simulatedBlockHeight();

  const appHost = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPL_SLUG
      ? `https://${process.env.REPL_SLUG}.replit.app`
      : "https://verdara.replit.app";

  const verificationUrl = `${appHost}/api/hallmark/${thId}/verify`;

  const [hallmark] = await db
    .insert(hallmarks)
    .values({
      thId,
      userId: data.userId || null,
      appId: data.appId,
      appName: data.appName || APP_NAME,
      productName: data.productName,
      releaseType: data.releaseType,
      metadata: data.metadata || null,
      dataHash,
      txHash,
      blockHeight,
      verificationUrl,
      hallmarkId: sequence,
    })
    .returning();

  console.log(`[Hallmark] Generated ${thId} (${data.releaseType}: ${data.productName})`);
  return hallmark;
}

export async function createTrustStamp(data: {
  userId?: number | null;
  category: string;
  data: Record<string, any>;
}) {
  const timestamp = new Date().toISOString();
  const stampPayload = {
    ...data.data,
    appContext: APP_SLUG,
    timestamp,
  };

  const dataHash = generateDataHash(stampPayload);
  const txHash = simulatedTxHash();
  const blockHeight = simulatedBlockHeight();

  const [stamp] = await db
    .insert(trustStamps)
    .values({
      userId: data.userId || null,
      category: data.category,
      data: stampPayload,
      dataHash,
      txHash,
      blockHeight,
    })
    .returning();

  return stamp;
}

export async function seedGenesisHallmark() {
  const genesisId = `${APP_PREFIX}-00000001`;

  const [existing] = await db
    .select()
    .from(hallmarks)
    .where(eq(hallmarks.thId, genesisId));

  if (existing) {
    console.log(`[Hallmark] Genesis hallmark ${genesisId} already exists.`);
    return existing;
  }

  await db
    .insert(hallmarkCounter)
    .values({ id: COUNTER_ID, currentSequence: "0" })
    .onConflictDoUpdate({
      target: hallmarkCounter.id,
      set: { currentSequence: "0" },
    });

  const genesis = await generateHallmark({
    userId: null,
    appId: `${APP_SLUG}-genesis`,
    appName: APP_NAME,
    productName: "Genesis Block",
    releaseType: "genesis",
    metadata: {
      ecosystem: "Trust Layer",
      version: "1.0.0",
      domain: "verdara.tlid.io",
      operator: "DarkWave Studios LLC",
      chain: "Trust Layer Blockchain",
      consensus: "Proof of Trust",
      launchDate: "2026-08-23T00:00:00.000Z",
      nativeAsset: "SIG",
      utilityToken: "Shells",
      parentApp: "Trust Layer Hub",
      parentGenesis: "TH-00000001",
    },
  });

  console.log(`[Hallmark] Genesis hallmark ${genesisId} created successfully.`);
  return genesis;
}

export function registerHallmarkRoutes(app: Express) {
  app.get("/api/hallmark/genesis", async (_req: Request, res: Response) => {
    try {
      const genesisId = `${APP_PREFIX}-00000001`;
      const [genesis] = await db
        .select()
        .from(hallmarks)
        .where(eq(hallmarks.thId, genesisId));

      if (!genesis) {
        return res.status(404).json({ message: "Genesis hallmark not found" });
      }

      res.json({
        verified: true,
        hallmark: genesis,
      });
    } catch (error) {
      console.error("Error fetching genesis hallmark:", error);
      res.status(500).json({ message: "Failed to fetch genesis hallmark" });
    }
  });

  app.get("/api/hallmark/:id/verify", async (req: Request, res: Response) => {
    try {
      const hallmarkId = req.params.id as string;

      if (!hallmarkId.startsWith(`${APP_PREFIX}-`)) {
        return res.status(404).json({ verified: false, error: "Hallmark not found" });
      }

      const [hallmark] = await db
        .select()
        .from(hallmarks)
        .where(eq(hallmarks.thId, hallmarkId as string));

      if (!hallmark) {
        return res.status(404).json({ verified: false, error: "Hallmark not found" });
      }

      res.json({
        verified: true,
        hallmark: {
          thId: hallmark.thId,
          appName: hallmark.appName,
          productName: hallmark.productName,
          releaseType: hallmark.releaseType,
          dataHash: hallmark.dataHash,
          txHash: hallmark.txHash,
          blockHeight: hallmark.blockHeight,
          createdAt: hallmark.createdAt,
          metadata: hallmark.metadata,
        },
      });
    } catch (error) {
      console.error("Error verifying hallmark:", error);
      res.status(500).json({ message: "Failed to verify hallmark" });
    }
  });
}
