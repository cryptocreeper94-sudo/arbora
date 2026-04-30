import type { Express, Request, Response } from "express";
import { requireAuth } from "./auth";
import { signToken, generateTrustLayerIdPublic } from "./trustlayer-sso";
import { storage } from "./storage";
import crypto from "crypto";
import { openai } from "./replit_integrations/image/client";

const DWSC_BASE = "https://dwsc.io";
const TRUST_LAYER_HUB = "https://orbitstaffing.io";

async function getOrCreateTrustLayerId(userId: number): Promise<{ trustLayerId: string; jwt: string }> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");

  let trustLayerId = user.trustLayerId;
  if (!trustLayerId) {
    trustLayerId = generateTrustLayerIdPublic();
    await storage.updateUserTrustLayerId(userId, trustLayerId);
  }

  const jwt = signToken(String(userId), trustLayerId);
  return { trustLayerId, jwt };
}

async function dwscFetch(path: string, options: { jwt?: string; apiKey?: string; method?: string; body?: any } = {}): Promise<any> {
  const url = `${DWSC_BASE}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.jwt) headers["Authorization"] = `Bearer ${options.jwt}`;
  if (options.apiKey) headers["x-api-key"] = options.apiKey;

  const fetchOpts: RequestInit = { method: options.method || "GET", headers };
  if (options.body && (options.method === "POST" || options.method === "PATCH")) {
    fetchOpts.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOpts);
  const data = await res.json().catch(() => ({ error: "Invalid response" }));

  if (!res.ok) throw { status: res.status, data };
  return data;
}

function hmacHeaders(body: any = ""): Record<string, string> {
  const apiKey = process.env.TRUSTLAYER_API_KEY;
  const apiSecret = process.env.TRUSTLAYER_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("Trust Layer API keys not configured");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const signature = crypto.createHmac("sha256", apiSecret).update(apiKey + timestamp + bodyStr).digest("hex");

  return {
    "x-blockchain-key": apiKey,
    "x-blockchain-signature": signature,
    "x-blockchain-timestamp": timestamp,
    "Content-Type": "application/json",
  };
}

export async function stampToChain(userId: number, category: string, data: string, metadata: Record<string, any> = {}): Promise<void> {
  try {
    let trustLayerId = "system-verdara";
    if (userId > 0) {
      const result = await getOrCreateTrustLayerId(userId);
      trustLayerId = result.trustLayerId;
    }
    const apiKey = process.env.DWSTAMP_API_KEY;
    await dwscFetch("/api/stamp/dual", {
      apiKey,
      method: "POST",
      body: {
        data,
        category,
        metadata: { ...metadata, trustLayerId },
        appId: "verdara",
        appName: "Verdara",
        chains: ["darkwave"],
      },
    });
    console.log(`[DW-STAMP] ${category}: ${data}`);
  } catch (err: any) {
    console.warn(`[DW-STAMP] Failed to stamp ${category}:`, err?.data?.message || err?.message || "unknown error");
  }
}

const VERDARA_PRICING = {
  verdara: {
    appName: "Verdara",
    appNumber: 28,
    tiers: [
      { key: "free_explorer", name: "Free Explorer", price: 0, interval: null, level: 0, features: ["Browse outdoor catalog", "Basic trail info", "Community access", "3 AI identifications/month"] },
      { key: "outdoor_explorer", name: "Outdoor Explorer", price: 19.99, interval: "year", level: 1, stripePriceId: "price_1T2ymgRq977vVehdFj13YFrM", features: ["Unlimited AI identification", "Trip planner", "Gear price compare", "Wild edibles guide", "TrustVault storage", "All catalog features"] },
      { key: "craftsman_pro", name: "Craftsman Pro", price: 29.99, interval: "year", level: 2, stripePriceId: "price_1T2ymjRq977vVehdYvCEHsT1", features: ["Wood marketplace selling", "Advanced trip planning", "DW-STAMP certifications", "Priority support", "All Explorer features"] },
    ],
  },
  arbora: {
    appName: "Arbora",
    appNumber: 29,
    tiers: [
      { key: "arborist_starter", name: "Arborist Starter", price: 49, interval: "month", level: 3, stripePriceId: "price_1T2ymoRq977vVehd6sTm7m47", features: ["Up to 25 clients", "Job scheduling", "Invoicing", "GarageBot equipment tracking", "All Craftsman features"] },
      { key: "arborist_business", name: "Arborist Business", price: 99, interval: "month", level: 4, stripePriceId: "price_1T2ymrRq977vVehdTfQivxy4", features: ["Unlimited clients", "Team management", "Advanced reporting", "TrustShield badge", "Priority GarageBot alerts", "All Starter features"] },
      { key: "arborist_enterprise", name: "Arborist Enterprise", price: 199, interval: "month", level: 5, stripePriceId: "price_1T2ymvRq977vVehd74qr6jbS", features: ["White-label branding", "API access", "Dedicated support", "Custom integrations", "Multi-location management", "All Business features"] },
    ],
  },
};

export async function registerWithTrustLayerHub(): Promise<void> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.warn("[Trust Layer Hub] JWT_SECRET not set, skipping ecosystem registration");
      return;
    }

    const appHost = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.replit.app`
        : "https://verdara.replit.app";

    const payload = {
      appName: "Verdara",
      appSlug: "verdara",
      appId: "dw_app_verdara",
      appNumber: 28,
      description: "AI-Powered Outdoor Recreation Super-App",
      baseUrl: appHost,
      capabilities: ["identify", "removal-plan", "assess", "species", "sync-user", "sso", "marketplace", "catalog", "trip-planner"],
      sso: {
        enabled: true,
        endpoints: {
          login: `${appHost}/api/auth/sso`,
          redirect: `${appHost}/api/auth/sso/redirect`,
          ecosystemLogin: `${appHost}/api/auth/ecosystem-login`,
          status: `${appHost}/api/ecosystem/status`,
        },
      },
      pricing: VERDARA_PRICING,
      version: "1.0.0",
    };

    const hubApiKey = process.env.TRUST_LAYER_HUB_API_KEY;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hubApiKey) {
      headers["x-api-key"] = hubApiKey;
    }

    const res = await fetch(`${TRUST_LAYER_HUB}/api/admin/ecosystem/register-app`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log(`[Trust Layer Hub] Verdara registered with ecosystem (id: ${data.id || "existing"})`);
    } else {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 409 || res.status === 500) {
        console.log("[Trust Layer Hub] Verdara already registered in ecosystem (re-registration skipped)");
      } else {
        console.warn(`[Trust Layer Hub] Registration returned ${res.status}:`, errData?.error || errData?.message || "unknown");
      }
    }
  } catch (error: any) {
    console.warn(`[Trust Layer Hub] Registration failed (non-fatal): ${error?.message || "unknown error"}`);
  }
}

function hubHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.TRUST_LAYER_HUB_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
}

async function crossAppSsoLogin(identifier: string, credential: string): Promise<any> {
  const res = await fetch(`${TRUST_LAYER_HUB}/api/auth/ecosystem-login`, {
    method: "POST",
    headers: hubHeaders(),
    body: JSON.stringify({ identifier, credential, appSlug: "verdara" }),
  });
  const data = await res.json().catch(() => ({ error: "Invalid response" }));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function crossAppRegister(userData: { username: string; email: string; password: string; displayName?: string }): Promise<any> {
  const res = await fetch(`${TRUST_LAYER_HUB}/api/chat/auth/register`, {
    method: "POST",
    headers: hubHeaders(),
    body: JSON.stringify({ ...userData, appSlug: "verdara" }),
  });
  const data = await res.json().catch(() => ({ error: "Invalid response" }));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export function registerEcosystemRoutes(app: Express) {

  // ─── Trust Layer Hub SSO (Cross-App Authentication) ─────────
  app.post("/api/ecosystem/hub/sso-login", async (req: Request, res: Response) => {
    try {
      const { identifier, credential } = req.body;
      if (!identifier || !credential) {
        return res.status(400).json({ message: "Identifier and credential are required" });
      }
      const hubResponse = await crossAppSsoLogin(identifier, credential);
      res.json({ success: true, hub: hubResponse });
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Trust Layer Hub SSO unavailable" });
    }
  });

  app.post("/api/ecosystem/hub/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      const hubResponse = await crossAppRegister({ username, email, password, displayName });
      res.json({ success: true, hub: hubResponse });
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Trust Layer Hub registration unavailable" });
    }
  });

  app.get("/api/ecosystem/hub/status", async (_req: Request, res: Response) => {
    res.json({
      trustLayerHub: TRUST_LAYER_HUB,
      endpoints: {
        registerApp: `${TRUST_LAYER_HUB}/api/admin/ecosystem/register-app`,
        ssoLogin: `${TRUST_LAYER_HUB}/api/auth/ecosystem-login`,
        register: `${TRUST_LAYER_HUB}/api/chat/auth/register`,
      },
      connectedApps: ["THE VOID", "Happy Eats", "TL Driver Connect", "TrustHome", "Trust Vault"],
      verdara: {
        appId: "dw_app_verdara",
        appNumber: 28,
        ssoEnabled: true,
      },
    });
  });

  app.get("/api/ecosystem/hub/pricing", async (_req: Request, res: Response) => {
    res.json(VERDARA_PRICING);
  });

  app.post("/api/ecosystem/hub/push-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const pushRes = await fetch(`${TRUST_LAYER_HUB}/api/admin/ecosystem/register-app`, {
        method: "POST",
        headers: hubHeaders(),
        body: JSON.stringify({
          appName: "Verdara",
          appSlug: "verdara",
          pricing: VERDARA_PRICING,
        }),
      });
      const data = await pushRes.json().catch(() => ({}));
      if (pushRes.ok) {
        res.json({ success: true, message: "Pricing pushed to Trust Layer Hub", data });
      } else {
        res.json({ success: true, message: "Pricing included in registration payload (hub may already have it)", data });
      }
    } catch (error: any) {
      res.status(502).json({ message: "Failed to push pricing to Trust Layer Hub" });
    }
  });

  // ─── TrustShield (Vendor Verification) ───────────────────────
  app.get("/api/ecosystem/trustshield/score/:projectId", async (req: Request, res: Response) => {
    try {
      const data = await dwscFetch(`/api/guardian/security-scores/${req.params.projectId}`);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustShield unavailable" });
    }
  });

  app.get("/api/ecosystem/trustshield/tiers", async (_req: Request, res: Response) => {
    try {
      const data = await dwscFetch("/api/guardian/tiers");
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustShield unavailable" });
    }
  });

  app.get("/api/ecosystem/trustshield/certifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch("/api/guardian/certifications", { jwt });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustShield unavailable" });
    }
  });

  app.post("/api/ecosystem/trustshield/certifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch("/api/guardian/certifications", { jwt, method: "POST", body: req.body });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustShield unavailable" });
    }
  });

  // ─── Signal (SIG) Payments ───────────────────────────────────
  app.get("/api/ecosystem/sig/tiers", async (_req: Request, res: Response) => {
    try {
      const data = await dwscFetch("/api/presale/tiers");
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "SIG service unavailable" });
    }
  });

  app.get("/api/ecosystem/sig/stats", async (_req: Request, res: Response) => {
    try {
      const data = await dwscFetch("/api/presale/stats");
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "SIG service unavailable" });
    }
  });

  app.post("/api/ecosystem/sig/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const user = await storage.getUser(req.userId!);
      const data = await dwscFetch("/api/presale/checkout", {
        jwt,
        method: "POST",
        body: { email: user?.email, amountUsd: req.body.amountUsd },
      });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "SIG checkout unavailable" });
    }
  });

  app.get("/api/ecosystem/sig/purchases", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch("/api/presale/my-purchases", { jwt });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "SIG service unavailable" });
    }
  });

  // ─── Trust Vault (Signal Wallet / On-Chain Balance) ──────────
  app.get("/api/ecosystem/vault/balance", requireAuth, async (req: Request, res: Response) => {
    try {
      const { trustLayerId } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch(`/api/signal/balance/${trustLayerId}`);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Trust Vault unavailable" });
    }
  });

  app.post("/api/ecosystem/vault/transfer", requireAuth, async (req: Request, res: Response) => {
    try {
      const bodyStr = JSON.stringify(req.body);
      const headers = hmacHeaders(bodyStr);
      const fetchRes = await fetch(`${DWSC_BASE}/api/signal/transfer`, {
        method: "POST",
        headers,
        body: bodyStr,
      });
      const data = await fetchRes.json().catch(() => ({ error: "Invalid response" }));
      if (!fetchRes.ok) return res.status(fetchRes.status).json(data);
      res.json(data);
    } catch (error: any) {
      res.status(502).json({ message: error?.message || "Trust Vault unavailable" });
    }
  });

  app.post("/api/ecosystem/vault/gate", requireAuth, async (req: Request, res: Response) => {
    try {
      const bodyStr = JSON.stringify(req.body);
      const headers = hmacHeaders(bodyStr);
      const fetchRes = await fetch(`${DWSC_BASE}/api/signal/gate`, {
        method: "POST",
        headers,
        body: bodyStr,
      });
      const data = await fetchRes.json().catch(() => ({ error: "Invalid response" }));
      if (!fetchRes.ok) return res.status(fetchRes.status).json(data);
      res.json(data);
    } catch (error: any) {
      res.status(502).json({ message: error?.message || "Trust Vault unavailable" });
    }
  });

  // ─── DW-STAMP (Blockchain Certifications) ────────────────────
  app.post("/api/ecosystem/stamp", requireAuth, async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.DWSTAMP_API_KEY;
      const data = await dwscFetch("/api/stamp/dual", {
        apiKey,
        method: "POST",
        body: {
          ...req.body,
          appId: "verdara",
          appName: "Verdara",
        },
      });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "DW-STAMP unavailable" });
    }
  });

  app.get("/api/ecosystem/stamp/:stampId", async (req: Request, res: Response) => {
    try {
      const data = await dwscFetch(`/api/stamp/${req.params.stampId}`);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "DW-STAMP unavailable" });
    }
  });

  app.get("/api/ecosystem/stamps/verdara", async (_req: Request, res: Response) => {
    try {
      const data = await dwscFetch("/api/stamps/app/verdara");
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "DW-STAMP unavailable" });
    }
  });

  // ─── TLID Identity (.tlid Domains) ───────────────────────────
  app.get("/api/ecosystem/tlid/search/:name", async (req: Request, res: Response) => {
    try {
      const data = await dwscFetch(`/api/domains/search/${req.params.name}`);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TLID service unavailable" });
    }
  });

  app.get("/api/ecosystem/tlid/stats", async (_req: Request, res: Response) => {
    try {
      const data = await dwscFetch("/api/domains/stats");
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TLID service unavailable" });
    }
  });

  // ─── Credits System ──────────────────────────────────────────
  app.get("/api/ecosystem/credits/balance", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch("/api/credits/balance", { jwt });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Credits service unavailable" });
    }
  });

  app.get("/api/ecosystem/credits/packages", async (_req: Request, res: Response) => {
    try {
      const data = await dwscFetch("/api/credits/packages");
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Credits service unavailable" });
    }
  });

  app.get("/api/ecosystem/credits/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch("/api/credits/transactions", { jwt });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Credits service unavailable" });
    }
  });

  app.post("/api/ecosystem/credits/purchase", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await dwscFetch("/api/credits/purchase", { jwt, method: "POST", body: req.body });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Credits service unavailable" });
    }
  });

  // ─── TrustVault (Media Vault & Creative Platform) ────────────
  const TRUSTVAULT_BASE = "https://trustvault.replit.app";

  async function tvFetch(path: string, jwt: string, options: { method?: string; body?: any } = {}): Promise<any> {
    const url = `${TRUSTVAULT_BASE}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
    };
    const fetchOpts: RequestInit = { method: options.method || "GET", headers };
    if (options.body && (options.method === "POST" || options.method === "PUT")) {
      fetchOpts.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, fetchOpts);
    const data = await res.json().catch(() => ({ error: "Invalid response" }));
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  app.get("/api/trustvault/capabilities", async (_req: Request, res: Response) => {
    try {
      const fetchRes = await fetch(`${TRUSTVAULT_BASE}/api/studio/capabilities`);
      const data = await fetchRes.json();
      res.json(data);
    } catch (error: any) {
      res.status(502).json({ message: "TrustVault unavailable" });
    }
  });

  app.get("/api/trustvault/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch("/api/studio/status", jwt);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.get("/api/trustvault/media", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const { category, page, limit } = req.query;
      const qs = new URLSearchParams();
      if (category) qs.set("category", category as string);
      if (page) qs.set("page", page as string);
      if (limit) qs.set("limit", limit as string);
      const data = await tvFetch(`/api/studio/media/list?${qs.toString()}`, jwt);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.get("/api/trustvault/media/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch(`/api/studio/media/${req.params.id}`, jwt);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.post("/api/trustvault/media/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch("/api/studio/media/upload", jwt, { method: "POST", body: req.body });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.post("/api/trustvault/media/confirm", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch("/api/studio/media/confirm", jwt, { method: "POST", body: req.body });

      stampToChain(req.userId!, "trustvault_media_upload", `Uploaded media: ${req.body.title || req.body.filename}`, {
        mediaId: data.id, title: req.body.title, contentType: req.body.contentType,
        tags: req.body.tags, filename: req.body.filename,
      });

      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.post("/api/trustvault/projects/create", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch("/api/studio/projects/create", jwt, { method: "POST", body: req.body });

      stampToChain(req.userId!, "trustvault_project_created", `Project: ${req.body.title} (${req.body.type})`, {
        projectId: data.projectId, title: req.body.title, type: req.body.type,
      });

      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.get("/api/trustvault/projects/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch(`/api/studio/projects/${req.params.id}/status`, jwt);
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.post("/api/trustvault/projects/:id/export", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch(`/api/studio/projects/${req.params.id}/export`, jwt, { method: "POST", body: req.body });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.post("/api/trustvault/editor/embed-token", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await tvFetch("/api/studio/editor/embed-token", jwt, { method: "POST", body: req.body });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "TrustVault unavailable" });
    }
  });

  app.post("/api/trustvault/webhook", async (req: Request, res: Response) => {
    try {
      const { event, projectId, status, downloadUrl, outputMediaId, error: errMsg } = req.body;
      console.log(`[TrustVault Webhook] ${event} — project ${projectId} — status: ${status}`);
      if (event === "render.complete") {
        console.log(`[TrustVault] Render complete: mediaId=${outputMediaId}, url=${downloadUrl}`);
      }
      if (event === "render.failed") {
        console.error(`[TrustVault] Render failed: ${errMsg}`);
      }
      res.json({ received: true });
    } catch {
      res.status(200).json({ received: true });
    }
  });

  // ─── Ecosystem Widget Data ───────────────────────────────────
  app.get("/api/ecosystem/widget-data", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const data = await dwscFetch("/api/ecosystem/widget-data", {
        jwt: authHeader?.replace("Bearer ", ""),
      });
      res.json(data);
    } catch (error: any) {
      res.status(error?.status || 502).json(error?.data || { message: "Ecosystem service unavailable" });
    }
  });

  // ─── TrustHome Ecosystem Integration ──────────────────────────
  registerTrustHomeRoutes(app);
}

// ─── HMAC-SHA256 Ecosystem Request Verification ─────────────────
export function verifyEcosystemRequest(authHeader: string): { valid: boolean; appName?: string } {
  const match = authHeader.match(/^DW (.+):(\d+):([a-f0-9]+)$/);
  if (!match) return { valid: false };

  const [, incomingKey, timestamp, incomingSignature] = match;

  const age = Date.now() - parseInt(timestamp);
  if (age > 300000) return { valid: false };

  const knownApps: Record<string, { secret: string; name: string }> = {};
  if (process.env.TRUSTHOME_API_KEY && process.env.TRUSTHOME_API_SECRET) {
    knownApps[process.env.TRUSTHOME_API_KEY] = {
      secret: process.env.TRUSTHOME_API_SECRET,
      name: "TrustHome",
    };
  }

  const app = knownApps[incomingKey];
  if (!app) return { valid: false };

  const expectedSignature = crypto
    .createHmac("sha256", app.secret)
    .update(`${timestamp}:${incomingKey}`)
    .digest("hex");

  if (incomingSignature !== expectedSignature) return { valid: false };
  return { valid: true, appName: app.name };
}

function requireEcosystemAuth(req: Request, res: Response, next: Function) {
  const auth = verifyEcosystemRequest(req.header("Authorization") || "");
  if (!auth.valid) {
    return res.status(401).json({ error: "Invalid ecosystem credentials" });
  }
  (req as any).ecosystemApp = auth.appName;
  next();
}

// ─── Outbound TrustHome Client ──────────────────────────────────
function getTrustHomeHeaders(): Record<string, string> {
  const apiKey = process.env.VERDARA_API_KEY || "";
  const apiSecret = process.env.VERDARA_API_SECRET || "";
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(`${timestamp}:${apiKey}`)
    .digest("hex");
  return {
    "Content-Type": "application/json",
    "Authorization": `DW ${apiKey}:${timestamp}:${signature}`,
    "X-App-Name": "Verdara",
  };
}

export async function callTrustHome(method: string, endpoint: string, body?: any) {
  const baseUrl = process.env.TRUSTHOME_BASE_URL || "https://trusthome.replit.app";
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: getTrustHomeHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── TrustHome Inbound API Endpoints ────────────────────────────
function registerTrustHomeRoutes(app: Express) {

  app.get("/api/ecosystem/status", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      app: "Verdara",
      appId: "dw_app_verdara",
      appNumber: 28,
      ecosystem: "DarkWave Trust Layer",
      trustLayerHub: TRUST_LAYER_HUB,
      version: "1.0.0",
      capabilities: ["identify", "removal-plan", "assess", "species", "sync-user", "sso", "marketplace", "catalog", "trip-planner"],
      sso: {
        enabled: true,
        endpoints: {
          redirect: "/api/auth/sso/redirect",
          api: "/api/auth/sso",
          ecosystemLogin: "/api/auth/ecosystem-login",
          hubSsoLogin: "/api/ecosystem/hub/sso-login",
          hubRegister: "/api/ecosystem/hub/register",
          hubStatus: "/api/ecosystem/hub/status",
        },
        description: "Pass JWT token as ?token= param to redirect endpoint, or POST { token } to API endpoint. Cross-app SSO available via Trust Layer Hub.",
      },
      connectedApps: ["THE VOID", "Happy Eats", "TL Driver Connect", "TrustHome", "Trust Vault"],
    });
  });

  app.post("/api/ecosystem/identify", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const { imageData, location } = req.body;
      if (!imageData) return res.status(400).json({ error: "imageData is required" });

      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional arborist and botanist. Identify the tree or plant species in this image. Return JSON with: speciesName, commonName, scientificName, confidence (0-1), family, habitat, conservationStatus, healthNotes, estimatedAge, height, canopySpread, riskLevel (low/medium/high), and funFacts (array of strings).",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageData}` } },
              { type: "text", text: `Identify this tree/plant species.${location ? ` Location: ${location.lat}, ${location.lng}` : ""}` },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const identification = JSON.parse(result.choices[0].message.content || "{}");

      stampToChain(0, "ecosystem_identification", `TrustHome species ID: ${identification.commonName || "Unknown"}`, {
        source: "TrustHome",
        speciesName: identification.commonName,
        confidence: identification.confidence,
        location,
      });

      res.json({
        success: true,
        identification,
        source: "Verdara AI (GPT-4o)",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[Ecosystem] Identify error:", error.message);
      res.status(500).json({ error: "Identification failed", message: error.message });
    }
  });

  app.post("/api/ecosystem/removal-plan", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const { propertyAddress, treeIds } = req.body;
      if (!propertyAddress) return res.status(400).json({ error: "propertyAddress is required" });

      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a certified arborist creating a tree removal plan. Return JSON with: planId, propertyAddress, trees (array with id, species, diameter, height, condition, removalMethod, estimatedCost, timeEstimate, permitRequired), totalEstimatedCost, safetyConsiderations (array), equipmentNeeded (array), crewSize, estimatedDuration, bestSeason, environmentalImpact, replantingRecommendations (array).",
          },
          {
            role: "user",
            content: `Create a removal plan for property at ${propertyAddress}. Tree IDs: ${(treeIds || []).join(", ") || "assess all visible trees"}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const plan = JSON.parse(result.choices[0].message.content || "{}");
      plan.planId = `rp_${crypto.randomBytes(8).toString("hex")}`;
      plan.generatedAt = new Date().toISOString();
      plan.source = "Verdara Arborist AI";

      stampToChain(0, "ecosystem_removal_plan", `Removal plan for ${propertyAddress}`, {
        source: "TrustHome",
        planId: plan.planId,
        propertyAddress,
        treeCount: (treeIds || []).length,
      });

      res.json({ success: true, plan });
    } catch (error: any) {
      console.error("[Ecosystem] Removal plan error:", error.message);
      res.status(500).json({ error: "Removal plan generation failed", message: error.message });
    }
  });

  app.post("/api/ecosystem/assess", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const { propertyAddress, agentId } = req.body;
      if (!propertyAddress) return res.status(400).json({ error: "propertyAddress is required" });

      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a certified arborist conducting a property tree/plant assessment. Return JSON with: assessmentId, propertyAddress, overallHealthScore (1-10), trees (array with species, commonName, health, dbh, height, canopySpread, riskLevel, recommendations), landscapeNotes, soilCondition, drainageNotes, pestOrDiseaseRisks (array), maintenanceSchedule (array of monthly tasks), estimatedAnnualCost, propertyValueImpact (string describing how trees affect property value).",
          },
          {
            role: "user",
            content: `Conduct a full property tree and plant assessment for: ${propertyAddress}${agentId ? ` (requested by agent ${agentId})` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      const assessment = JSON.parse(result.choices[0].message.content || "{}");
      assessment.assessmentId = `assess_${crypto.randomBytes(8).toString("hex")}`;
      assessment.generatedAt = new Date().toISOString();
      assessment.source = "Verdara Arborist AI";

      stampToChain(0, "ecosystem_assessment", `Property assessment: ${propertyAddress}`, {
        source: "TrustHome",
        assessmentId: assessment.assessmentId,
        propertyAddress,
        healthScore: assessment.overallHealthScore,
      });

      res.json({ success: true, assessment });
    } catch (error: any) {
      console.error("[Ecosystem] Assessment error:", error.message);
      res.status(500).json({ error: "Assessment failed", message: error.message });
    }
  });

  app.get("/api/ecosystem/species/:id", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const speciesId = req.params.id;

      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a botanist encyclopedia. Return detailed species information as JSON with: id, commonName, scientificName, family, description, nativeRange, usdaZones (array), growthRate, matureHeight, matureSpread, lifespan, soilPreference, sunRequirement, waterNeeds, diseases (array), pests (array), propertyConsiderations (root damage risk, leaf litter, allergens), maintenanceDifficulty (low/medium/high), wildlifeValue, edibleParts (array or null), toxicity, funFacts (array).",
          },
          {
            role: "user",
            content: `Provide detailed species information for: ${speciesId}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const species = JSON.parse(result.choices[0].message.content || "{}");
      species.id = speciesId;
      species.source = "Verdara Species Database";

      res.json({ success: true, species });
    } catch (error: any) {
      console.error("[Ecosystem] Species lookup error:", error.message);
      res.status(500).json({ error: "Species lookup failed", message: error.message });
    }
  });

  app.post("/api/ecosystem/sync-user", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const { userId, email, displayName, trustLayerId } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });

      console.log(`[Ecosystem] User sync from ${(req as any).ecosystemApp}: ${email} (TL: ${trustLayerId || "none"})`);

      res.json({
        success: true,
        synced: true,
        app: "Verdara",
        userId: trustLayerId || userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[Ecosystem] User sync error:", error.message);
      res.status(500).json({ error: "User sync failed", message: error.message });
    }
  });
}
