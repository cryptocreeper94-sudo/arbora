import type { Express, Request, Response } from "express";
import { requireAuth } from "./auth";
import { signToken, generateTrustLayerIdPublic } from "./trustlayer-sso";
import { storage } from "./storage";

const GARAGEBOT_API_BASE = "https://garagebot.io/api/ecosystem/v1";

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

async function proxyToGarageBot(path: string, jwt: string, method: string = "GET", body?: any): Promise<any> {
  const url = `${GARAGEBOT_API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, data };
  }
  return data;
}

export function registerGarageBotRoutes(app: Express) {
  app.get("/api/garagebot/equipment", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await proxyToGarageBot("/equipment", jwt);
      res.json(data);
    } catch (error: any) {
      console.error("GarageBot equipment list error:", error);
      res.status(error?.status || 500).json(error?.data || { success: false, message: "Failed to fetch equipment" });
    }
  });

  app.get("/api/garagebot/equipment/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await proxyToGarageBot(`/equipment/${req.params.id}`, jwt);
      res.json(data);
    } catch (error: any) {
      console.error("GarageBot equipment detail error:", error);
      res.status(error?.status || 500).json(error?.data || { success: false, message: "Failed to fetch equipment details" });
    }
  });

  app.get("/api/garagebot/maintenance-alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await proxyToGarageBot("/maintenance-alerts", jwt);
      res.json(data);
    } catch (error: any) {
      console.error("GarageBot alerts error:", error);
      res.status(error?.status || 500).json(error?.data || { success: false, message: "Failed to fetch maintenance alerts" });
    }
  });

  app.post("/api/garagebot/equipment", requireAuth, async (req: Request, res: Response) => {
    try {
      const { year, make, model } = req.body;
      if (!year || !make || !model) {
        return res.status(400).json({ success: false, message: "Year, make, and model are required" });
      }
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await proxyToGarageBot("/equipment", jwt, "POST", req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("GarageBot create equipment error:", error);
      res.status(error?.status || 500).json(error?.data || { success: false, message: "Failed to create equipment" });
    }
  });

  app.patch("/api/garagebot/equipment/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jwt } = await getOrCreateTrustLayerId(req.userId!);
      const data = await proxyToGarageBot(`/equipment/${req.params.id}`, jwt, "PATCH", req.body);
      res.json(data);
    } catch (error: any) {
      console.error("GarageBot update equipment error:", error);
      res.status(error?.status || 500).json(error?.data || { success: false, message: "Failed to update equipment" });
    }
  });
}
