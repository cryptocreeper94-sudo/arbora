import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, requireAuth } from "./auth";
import { registerChatAuthRoutes } from "./trustlayer-sso";
import { setupChatWebSocket } from "./chat-ws";
import { seedChatData } from "./seedChat";
import { runAllSeeds } from "./seed";
import { insertTripPlanSchema, insertMarketplaceListingSchema, insertActivityLogSchema, insertArboristClientSchema, insertArboristJobSchema, insertArboristInvoiceSchema, insertCampgroundBookingSchema, insertCatalogLocationSchema, insertLocationSubmissionSchema, insertReviewSchema, insertBlogPostSchema, insertErrorLogSchema } from "@shared/schema";
import { registerGarageBotRoutes } from "./garagebot";
import { registerEcosystemRoutes, registerWithTrustLayerHub, stampToChain } from "./ecosystem";
import { registerAffiliateRoutes } from "./affiliate";
import { registerHallmarkRoutes, seedGenesisHallmark } from "./hallmark";
import Stripe from "stripe";
import { openai } from "./replit_integrations/image/client";
import type { Request, Response, NextFunction } from "express";

const TIER_LEVELS: Record<string, number> = {
  "Free Explorer": 0,
  "Outdoor Explorer": 1,
  "Craftsman Pro": 2,
  "Arborist Starter": 3,
  "Arborist Business": 4,
  "Arborist Enterprise": 5,
};

function getUserTierLevel(tier: string | null | undefined): number {
  return TIER_LEVELS[tier || "Free Explorer"] ?? 0;
}

function requireTier(minTierName: string) {
  const minLevel = TIER_LEVELS[minTierName] ?? 0;
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ message: "Authentication required" });
    const user = await storage.getUser(req.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const userLevel = getUserTierLevel(user.tier);
    if (userLevel < minLevel) {
      return res.status(403).json({
        message: "Upgrade required",
        requiredTier: minTierName,
        currentTier: user.tier || "Free Explorer",
        upgradeUrl: "/pricing",
      });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAuthRoutes(app);
  registerChatAuthRoutes(app);
  registerGarageBotRoutes(app);
  registerEcosystemRoutes(app);
  registerHallmarkRoutes(app);
  registerAffiliateRoutes(app);
  setupChatWebSocket(httpServer);
  seedChatData().catch(console.error);
  runAllSeeds().catch(console.error);
  registerWithTrustLayerHub().catch(console.error);
  seedGenesisHallmark().catch(console.error);

  app.post("/api/diagnostics/log", async (req, res) => {
    try {
      const { level, message, stack, source, url, userAgent, deviceInfo, metadata, sessionId } = req.body;
      if (!message || !level) return res.status(400).json({ message: "Missing required fields" });
      const log = await storage.createErrorLog({
        level: level || "error",
        message: message?.substring(0, 2000),
        stack: stack?.substring(0, 5000) || null,
        source: source || "frontend",
        url: url || null,
        userAgent: userAgent || null,
        userId: req.userId || null,
        deviceInfo: deviceInfo || null,
        metadata: metadata || null,
        sessionId: sessionId || null,
      });
      res.status(201).json({ id: log.id });
    } catch (error) {
      console.error("Error logging diagnostic:", error);
      res.status(500).json({ message: "Failed to log error" });
    }
  });

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId || req.userId !== 1) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get("/api/diagnostics/logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { level, source, limit, offset } = req.query;
      const logs = await storage.getErrorLogs({
        level: level as string | undefined,
        source: source as string | undefined,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
      });
      const total = await storage.getErrorLogCount({
        level: level as string | undefined,
        source: source as string | undefined,
      });
      res.json({ logs, total });
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.delete("/api/diagnostics/logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { before } = req.query;
      const deleted = await storage.clearErrorLogs(before ? new Date(before as string) : undefined);
      res.json({ deleted });
    } catch (error) {
      console.error("Error clearing diagnostics:", error);
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });

  app.get("/api/trails", async (req, res) => {
    try {
      const { difficulty, activityType } = req.query;
      if (difficulty || activityType) {
        const trails = await storage.filterTrails(
          difficulty as string | undefined,
          activityType as string | undefined
        );
        return res.json(trails);
      }
      const trails = await storage.getTrails();
      res.json(trails);
    } catch (error) {
      console.error("Error fetching trails:", error);
      res.status(500).json({ message: "Failed to fetch trails" });
    }
  });

  app.get("/api/trails/featured", async (_req, res) => {
    try {
      const trails = await storage.getFeaturedTrails();
      res.json(trails);
    } catch (error) {
      console.error("Error fetching featured trails:", error);
      res.status(500).json({ message: "Failed to fetch featured trails" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const [trails, campgrounds, listings, activities] = await Promise.all([
        storage.getTrails(),
        storage.getCampgrounds(),
        storage.getMarketplaceListings(),
        storage.getActivityLocations(),
      ]);
      res.json({
        trails: trails.length,
        campgrounds: campgrounds.length,
        listings: listings.length,
        activityLocations: activities.length,
        totalFeatures: 138,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/trails/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json([]);
      const trails = await storage.searchTrails(query);
      res.json(trails);
    } catch (error) {
      console.error("Error searching trails:", error);
      res.status(500).json({ message: "Failed to search trails" });
    }
  });

  app.get("/api/trails/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid trail ID" });
      const trail = await storage.getTrail(id);
      if (!trail) return res.status(404).json({ message: "Trail not found" });
      res.json(trail);
    } catch (error) {
      console.error("Error fetching trail:", error);
      res.status(500).json({ message: "Failed to fetch trail" });
    }
  });

  app.get("/api/marketplace", async (req, res) => {
    try {
      const { q } = req.query;
      if (q && typeof q === "string") {
        const listings = await storage.searchMarketplaceListings(q);
        return res.json(listings);
      }
      const listings = await storage.getMarketplaceListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching marketplace:", error);
      res.status(500).json({ message: "Failed to fetch marketplace listings" });
    }
  });

  app.get("/api/marketplace/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid listing ID" });
      const listing = await storage.getMarketplaceListing(id);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/marketplace", requireAuth, requireTier("Craftsman Pro"), async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { species, grade, dimensions, pricePerBf, location, description, image } = req.body;
      if (!species || !grade || !dimensions || !pricePerBf || typeof pricePerBf !== "number" || pricePerBf <= 0) {
        return res.status(400).json({ message: "Species, grade, dimensions, and a positive price are required" });
      }

      const listingData = {
        species,
        grade,
        dimensions,
        pricePerBf,
        location: location || null,
        description: description || null,
        image: image || null,
        sellerId: req.userId!,
        sellerName: `${user.firstName} ${user.lastName}`,
        trustLevel: 1,
        trustScore: 500,
      };

      const listing = await storage.createMarketplaceListing(listingData);

      await storage.createActivityLog({
        userId: req.userId!,
        type: "marketplace",
        title: `Listed ${listing.species} for sale`,
        date: new Date().toLocaleDateString(),
      });

      stampToChain(req.userId!, "marketplace_listing", `Listed ${listing.species} (${listing.grade}) at $${listing.pricePerBf}/bf`, {
        listingId: listing.id, species: listing.species, grade: listing.grade, price: listing.pricePerBf,
      });

      res.status(201).json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.delete("/api/marketplace/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid listing ID" });
      const deleted = await storage.deleteMarketplaceListing(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Listing not found or unauthorized" });
      res.json({ message: "Listing deleted" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.get("/api/user/listings", requireAuth, async (req, res) => {
    try {
      const listings = await storage.getUserMarketplaceListings(req.userId!);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch your listings" });
    }
  });

  app.get("/api/campgrounds", async (_req, res) => {
    try {
      const campgrounds = await storage.getCampgrounds();
      res.json(campgrounds);
    } catch (error) {
      console.error("Error fetching campgrounds:", error);
      res.status(500).json({ message: "Failed to fetch campgrounds" });
    }
  });

  app.get("/api/user/identifications", requireAuth, async (req, res) => {
    try {
      const identifications = await storage.getIdentifications(req.userId!);
      res.json(identifications);
    } catch (error) {
      console.error("Error fetching identifications:", error);
      res.status(500).json({ message: "Failed to fetch identifications" });
    }
  });

  app.get("/api/user/trips", requireAuth, async (req, res) => {
    try {
      const trips = await storage.getTripPlans(req.userId!);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.post("/api/user/trips", requireAuth, async (req, res) => {
    try {
      const planData = {
        ...req.body,
        userId: req.userId!,
      };
      const plan = await storage.createTripPlan(planData);

      await storage.createActivityLog({
        userId: req.userId!,
        type: "trail",
        title: `Created trip plan: ${plan.title}`,
        date: new Date().toLocaleDateString(),
      });

      stampToChain(req.userId!, "trip_plan_created", `Trip plan: ${plan.title}`, {
        tripId: plan.id, title: plan.title, destination: plan.destination,
      });

      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip plan" });
    }
  });

  app.patch("/api/user/trips/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid trip ID" });
      const existing = await storage.getTripPlan(id);
      if (!existing || existing.userId !== req.userId!) {
        return res.status(404).json({ message: "Trip not found or unauthorized" });
      }
      const updated = await storage.updateTripPlan(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip plan" });
    }
  });

  app.delete("/api/user/trips/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid trip ID" });
      const deleted = await storage.deleteTripPlan(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Trip not found or unauthorized" });
      res.json({ message: "Trip deleted" });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip plan" });
    }
  });

  app.get("/api/user/activity", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivityLog(req.userId!);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post("/api/user/activity", requireAuth, async (req, res) => {
    try {
      const entry = await storage.createActivityLog({
        ...req.body,
        userId: req.userId!,
        date: req.body.date || new Date().toLocaleDateString(),
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.userId!);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Activity Locations routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { type, q } = req.query;
      if (q && typeof q === "string") {
        const locations = await storage.searchActivityLocations(q, type as string | undefined);
        return res.json(locations);
      }
      const locations = await storage.getActivityLocations(type as string | undefined);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching activity locations:", error);
      res.status(500).json({ message: "Failed to fetch activity locations" });
    }
  });

  app.get("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid location ID" });
      const location = await storage.getActivityLocation(id);
      if (!location) return res.status(404).json({ message: "Location not found" });
      res.json(location);
    } catch (error) {
      console.error("Error fetching activity location:", error);
      res.status(500).json({ message: "Failed to fetch activity location" });
    }
  });

  // Arborist Client routes
  app.get("/api/arborist/clients", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const clients = await storage.getArboristClients(req.userId!);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching arborist clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/arborist/clients", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const parsed = insertArboristClientSchema.safeParse({ ...req.body, userId: req.userId! });
      if (!parsed.success) return res.status(400).json({ message: "Invalid client data", errors: parsed.error.flatten().fieldErrors });
      const client = await storage.createArboristClient(parsed.data);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating arborist client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/arborist/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid client ID" });
      const existing = await storage.getArboristClient(id);
      if (!existing || existing.userId !== req.userId!) return res.status(404).json({ message: "Client not found" });
      const { name, email, phone, address, notes } = req.body;
      const updated = await storage.updateArboristClient(id, { name, email, phone, address, notes });
      res.json(updated);
    } catch (error) {
      console.error("Error updating arborist client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/arborist/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid client ID" });
      const deleted = await storage.deleteArboristClient(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Client not found or unauthorized" });
      res.json({ message: "Client deleted" });
    } catch (error) {
      console.error("Error deleting arborist client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Arborist Job routes
  app.get("/api/arborist/jobs", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const jobs = await storage.getArboristJobs(req.userId!);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching arborist jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/arborist/jobs", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const parsed = insertArboristJobSchema.safeParse({ ...req.body, userId: req.userId!, status: "scheduled" });
      if (!parsed.success) return res.status(400).json({ message: "Invalid job data", errors: parsed.error.flatten().fieldErrors });
      const job = await storage.createArboristJob(parsed.data);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating arborist job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch("/api/arborist/jobs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });
      const existing = await storage.getArboristJob(id);
      if (!existing || existing.userId !== req.userId!) return res.status(404).json({ message: "Job not found" });
      const { title, clientId, description, status, scheduledDate, completedDate, crew, estimatedCost, actualCost, notes } = req.body;
      const updated = await storage.updateArboristJob(id, { title, clientId, description, status, scheduledDate, completedDate, crew, estimatedCost, actualCost, notes });
      res.json(updated);
    } catch (error) {
      console.error("Error updating arborist job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/arborist/jobs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid job ID" });
      const deleted = await storage.deleteArboristJob(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Job not found or unauthorized" });
      res.json({ message: "Job deleted" });
    } catch (error) {
      console.error("Error deleting arborist job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Arborist Invoice routes
  app.get("/api/arborist/invoices", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const invoices = await storage.getArboristInvoices(req.userId!);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching arborist invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/arborist/invoices", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const { clientId, jobId, items, dueDate, notes, tax } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one invoice item is required" });
      }
      for (const item of items) {
        if (!item.description || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
          return res.status(400).json({ message: "Each item must have description, quantity (number), and unitPrice (number)" });
        }
      }
      const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = typeof tax === "number" ? tax : 0;
      const total = subtotal + taxAmount;
      const invoiceCount = (await storage.getArboristInvoices(req.userId!)).length;
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;

      const parsed = insertArboristInvoiceSchema.safeParse({
        userId: req.userId!,
        clientId: clientId || null,
        jobId: jobId || null,
        invoiceNumber,
        status: "draft",
        items,
        subtotal,
        tax: taxAmount,
        total,
        dueDate: dueDate || null,
        paidDate: null,
        notes: notes || null,
      });
      if (!parsed.success) return res.status(400).json({ message: "Invalid invoice data", errors: parsed.error.flatten().fieldErrors });
      const invoice = await storage.createArboristInvoice(parsed.data);

      stampToChain(req.userId!, "arborist_invoice_created", `Invoice ${invoiceNumber} — $${total.toFixed(2)}`, {
        invoiceId: invoice.id, invoiceNumber, total, itemCount: items.length,
      });

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating arborist invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/arborist/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid invoice ID" });
      const existing = await storage.getArboristInvoice(id);
      if (!existing || existing.userId !== req.userId!) return res.status(404).json({ message: "Invoice not found" });
      const { status, dueDate, paidDate, notes } = req.body;
      const updated = await storage.updateArboristInvoice(id, { status, dueDate, paidDate, notes });
      res.json(updated);
    } catch (error) {
      console.error("Error updating arborist invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/arborist/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid invoice ID" });
      const deleted = await storage.deleteArboristInvoice(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Invoice not found or unauthorized" });
      res.json({ message: "Invoice deleted" });
    } catch (error) {
      console.error("Error deleting arborist invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Arborist Deals (CRM Pipeline)
  app.get("/api/arborist/deals", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const deals = await storage.getArboristDeals(req.userId!);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching arborist deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.post("/api/arborist/deals", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const deal = await storage.createArboristDeal({ ...req.body, userId: req.userId! });
      res.json(deal);
    } catch (error) {
      console.error("Error creating arborist deal:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.patch("/api/arborist/deals/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid deal ID" });
      const updated = await storage.updateArboristDeal(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating arborist deal:", error);
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete("/api/arborist/deals/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid deal ID" });
      const deleted = await storage.deleteArboristDeal(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Deal not found" });
      res.json({ message: "Deal deleted" });
    } catch (error) {
      console.error("Error deleting arborist deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Arborist Estimates
  app.get("/api/arborist/estimates", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const estimates = await storage.getArboristEstimates(req.userId!);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching arborist estimates:", error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.post("/api/arborist/estimates", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const { items, taxRate, ...rest } = req.body;
      const lineItems = items || [];
      const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      const tax = subtotal * (taxRate || 0) / 100;
      const total = subtotal + tax;
      const estimateNumber = `EST-${Date.now().toString(36).toUpperCase()}`;
      const estimate = await storage.createArboristEstimate({
        ...rest, userId: req.userId!, items: lineItems, subtotal, tax, total, estimateNumber,
      });
      res.json(estimate);
    } catch (error) {
      console.error("Error creating arborist estimate:", error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  app.patch("/api/arborist/estimates/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid estimate ID" });
      const updated = await storage.updateArboristEstimate(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating arborist estimate:", error);
      res.status(500).json({ message: "Failed to update estimate" });
    }
  });

  app.delete("/api/arborist/estimates/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid estimate ID" });
      const deleted = await storage.deleteArboristEstimate(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Estimate not found" });
      res.json({ message: "Estimate deleted" });
    } catch (error) {
      console.error("Error deleting arborist estimate:", error);
      res.status(500).json({ message: "Failed to delete estimate" });
    }
  });

  // Arborist Crew Members
  app.get("/api/arborist/crew", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const members = await storage.getArboristCrewMembers(req.userId!);
      res.json(members);
    } catch (error) {
      console.error("Error fetching crew members:", error);
      res.status(500).json({ message: "Failed to fetch crew" });
    }
  });

  app.post("/api/arborist/crew", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const member = await storage.createArboristCrewMember({ ...req.body, userId: req.userId! });
      res.json(member);
    } catch (error) {
      console.error("Error creating crew member:", error);
      res.status(500).json({ message: "Failed to create crew member" });
    }
  });

  app.patch("/api/arborist/crew/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid crew member ID" });
      const updated = await storage.updateArboristCrewMember(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating crew member:", error);
      res.status(500).json({ message: "Failed to update crew member" });
    }
  });

  app.delete("/api/arborist/crew/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid crew member ID" });
      const deleted = await storage.deleteArboristCrewMember(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Crew member not found" });
      res.json({ message: "Crew member deleted" });
    } catch (error) {
      console.error("Error deleting crew member:", error);
      res.status(500).json({ message: "Failed to delete crew member" });
    }
  });

  // Arborist Time Entries
  app.get("/api/arborist/time-entries", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
      const entries = await storage.getArboristTimeEntries(req.userId!, jobId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/arborist/time-entries", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const entry = await storage.createArboristTimeEntry({ ...req.body, userId: req.userId! });
      res.json(entry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.patch("/api/arborist/time-entries/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid time entry ID" });
      const updated = await storage.updateArboristTimeEntry(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating time entry:", error);
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  app.delete("/api/arborist/time-entries/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid time entry ID" });
      const deleted = await storage.deleteArboristTimeEntry(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Time entry not found" });
      res.json({ message: "Time entry deleted" });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Arborist Inventory
  app.get("/api/arborist/inventory", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const items = await storage.getArboristInventoryItems(req.userId!);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/arborist/inventory/low-stock", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const items = await storage.getArboristLowStockItems(req.userId!);
      res.json(items);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/arborist/inventory", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const item = await storage.createArboristInventoryItem({ ...req.body, userId: req.userId! });
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/arborist/inventory/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inventory item ID" });
      const updated = await storage.updateArboristInventoryItem(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/arborist/inventory/:id", requireAuth, requireTier("Arborist Starter"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inventory item ID" });
      const deleted = await storage.deleteArboristInventoryItem(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Inventory item not found" });
      res.json({ message: "Inventory item deleted" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Campground Booking routes
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getCampgroundBookings(req.userId!);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const parsed = insertCampgroundBookingSchema.safeParse({ ...req.body, userId: req.userId! });
      if (!parsed.success) return res.status(400).json({ message: "Invalid booking data", errors: parsed.error.flatten().fieldErrors });
      const booking = await storage.createCampgroundBooking(parsed.data);

      stampToChain(req.userId!, "campground_booking", `Booked campground: ${booking.campgroundName || "reservation"} (${booking.checkIn} to ${booking.checkOut})`, {
        bookingId: booking.id, campgroundName: booking.campgroundName, checkIn: booking.checkIn, checkOut: booking.checkOut,
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid booking ID" });
      const bookings = await storage.getCampgroundBookings(req.userId!);
      const existing = bookings.find(b => b.id === id);
      if (!existing) return res.status(404).json({ message: "Booking not found" });
      const updated = await storage.updateCampgroundBooking(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid booking ID" });
      const deleted = await storage.deleteCampgroundBooking(id, req.userId!);
      if (!deleted) return res.status(404).json({ message: "Booking not found or unauthorized" });
      res.json({ message: "Booking deleted" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Catalog Locations routes
  app.get("/api/catalog", async (req, res) => {
    try {
      const { type, state, activity, species, featured, limit, offset, q } = req.query;
      if (q && typeof q === "string") {
        const locations = await storage.searchCatalogLocations(q, type as string | undefined, state as string | undefined);
        return res.json(locations);
      }
      const locations = await storage.getCatalogLocations({
        type: type as string | undefined,
        state: state as string | undefined,
        activity: activity as string | undefined,
        species: species as string | undefined,
        featured: featured === "true",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(locations);
    } catch (error) {
      console.error("Error fetching catalog locations:", error);
      res.status(500).json({ message: "Failed to fetch catalog locations" });
    }
  });

  app.get("/api/catalog/count", async (req, res) => {
    try {
      const { type } = req.query;
      const count = await storage.getCatalogLocationCount(type as string | undefined);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching catalog count:", error);
      res.status(500).json({ message: "Failed to fetch count" });
    }
  });

  app.get("/api/catalog/nearby", async (req, res) => {
    try {
      const { lat, lng, radius, type, limit } = req.query;
      if (!lat || !lng) return res.status(400).json({ message: "lat and lng are required" });
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      const radiusNum = Math.min(Math.max(radius ? parseFloat(radius as string) : 50, 1), 500);
      const limitNum = Math.min(Math.max(limit ? parseInt(limit as string) : 50, 1), 100);
      if (isNaN(latNum) || isNaN(lngNum)) return res.status(400).json({ message: "Invalid coordinates" });
      if (isNaN(radiusNum) || isNaN(limitNum)) return res.status(400).json({ message: "Invalid radius or limit" });
      const locations = await storage.searchCatalogByProximity(latNum, lngNum, radiusNum, type as string | undefined, limitNum);
      res.json(locations);
    } catch (error) {
      console.error("Error searching nearby locations:", error);
      res.status(500).json({ message: "Failed to search nearby locations" });
    }
  });

  app.get("/api/catalog/slug/:slug", async (req, res) => {
    try {
      const location = await storage.getCatalogLocationBySlug(req.params.slug);
      if (!location) return res.status(404).json({ message: "Location not found" });
      res.json(location);
    } catch (error) {
      console.error("Error fetching catalog location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.get("/api/catalog/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid location ID" });
      const location = await storage.getCatalogLocation(id);
      if (!location) return res.status(404).json({ message: "Location not found" });
      res.json(location);
    } catch (error) {
      console.error("Error fetching catalog location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.post("/api/catalog", requireAuth, async (req, res) => {
    try {
      const parsed = insertCatalogLocationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid location data", errors: parsed.error.flatten().fieldErrors });
      const location = await storage.createCatalogLocation(parsed.data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating catalog location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.patch("/api/catalog/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid location ID" });
      const updated = await storage.updateCatalogLocation(id, req.body);
      if (!updated) return res.status(404).json({ message: "Location not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating catalog location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/catalog/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid location ID" });
      const deleted = await storage.deleteCatalogLocation(id);
      if (!deleted) return res.status(404).json({ message: "Location not found" });
      res.json({ message: "Location deleted" });
    } catch (error) {
      console.error("Error deleting catalog location:", error);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Location Submissions routes
  app.get("/api/submissions", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const submissions = await storage.getLocationSubmissions(status as string | undefined);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", requireAuth, async (req, res) => {
    try {
      const parsed = insertLocationSubmissionSchema.safeParse({ ...req.body, userId: req.userId! });
      if (!parsed.success) return res.status(400).json({ message: "Invalid submission data", errors: parsed.error.flatten().fieldErrors });
      const submission = await storage.createLocationSubmission(parsed.data);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.patch("/api/submissions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid submission ID" });
      const updated = await storage.updateLocationSubmission(id, req.body);
      if (!updated) return res.status(404).json({ message: "Submission not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  const VERDARA_TIERS: Record<string, { name: string; stripePriceId: string; level: number }> = {
    "outdoor_explorer": { name: "Outdoor Explorer", stripePriceId: "price_1T2ymgRq977vVehdFj13YFrM", level: 1 },
    "craftsman_pro": { name: "Craftsman Pro", stripePriceId: "price_1T2ymjRq977vVehdYvCEHsT1", level: 2 },
    "arborist_starter": { name: "Arborist Starter", stripePriceId: "price_1T2ymoRq977vVehd6sTm7m47", level: 3 },
    "arborist_business": { name: "Arborist Business", stripePriceId: "price_1T2ymrRq977vVehdTfQivxy4", level: 4 },
    "arborist_enterprise": { name: "Arborist Enterprise", stripePriceId: "price_1T2ymvRq977vVehd74qr6jbS", level: 5 },
  };

  app.get("/api/subscriptions/tiers", (_req, res) => {
    const tiers = [
      {
        key: "free_explorer", name: "Free Explorer", price: 0, interval: null, level: 0,
        features: ["Browse outdoor catalog", "Basic trail info", "Community access", "3 AI identifications/month"],
      },
      {
        key: "outdoor_explorer", name: "Outdoor Explorer", price: 19.99, interval: "year", level: 1,
        features: ["Unlimited AI identification", "Trip planner", "Gear price compare", "Wild edibles guide", "TrustVault storage", "All catalog features"],
      },
      {
        key: "craftsman_pro", name: "Craftsman Pro", price: 29.99, interval: "year", level: 2,
        features: ["Wood marketplace selling", "Advanced trip planning", "DW-STAMP certifications", "Priority support", "All Explorer features"],
      },
      {
        key: "arborist_starter", name: "Arborist Starter", price: 49, interval: "month", level: 3,
        features: ["Up to 25 clients", "Job scheduling", "Invoicing", "GarageBot equipment tracking", "All Craftsman features"],
      },
      {
        key: "arborist_business", name: "Arborist Business", price: 99, interval: "month", level: 4,
        features: ["Unlimited clients", "Team management", "Advanced reporting", "TrustShield badge", "Priority GarageBot alerts", "All Starter features"],
      },
      {
        key: "arborist_enterprise", name: "Arborist Enterprise", price: 199, interval: "month", level: 5,
        features: ["White-label branding", "API access", "Dedicated support", "Custom integrations", "Multi-location management", "All Business features"],
        popular: false,
      },
    ];
    res.json(tiers);
  });

  app.post("/api/subscriptions/create-checkout", requireAuth, async (req, res) => {
    try {
      if (!stripe) return res.status(503).json({ message: "Payment processing is not configured" });
      const { tier } = req.body;
      const config = VERDARA_TIERS[tier];
      if (!config) return res.status(400).json({ message: "Invalid subscription tier" });

      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : (host.includes("localhost") ? "http" : "https");
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: config.stripePriceId, quantity: 1 }],
        metadata: { userId: req.userId!.toString(), tier: config.name },
        success_url: `${baseUrl}/pricing?subscription=success`,
        cancel_url: `${baseUrl}/pricing?subscription=cancelled`,
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ message: "Failed to create subscription checkout" });
    }
  });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY not set - Stripe checkout disabled");
  }

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  // Stripe webhook endpoint - no auth middleware since Stripe sends directly
  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          sig,
          webhookSecret
        );
      } else {
        // TODO: Configure STRIPE_WEBHOOK_SECRET for production signature verification
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;
          if (userId && tier) {
            await storage.updateUserTier(parseInt(userId), tier);
            console.log(`Updated user ${userId} tier to ${tier}`);
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerIdDel = subscription.customer as string;
          if (customerIdDel) {
            const sessions = await stripe.checkout.sessions.list({
              customer: customerIdDel,
              limit: 1,
            });
            const lastSession = sessions.data[0];
            const userId = lastSession?.metadata?.userId;
            if (userId) {
              await storage.updateUserTier(parseInt(userId), "Free Explorer");
              console.log(`Reset user ${userId} tier to Free Explorer (subscription deleted)`);
            }
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerIdUpd = subscription.customer as string;
          if (customerIdUpd) {
            const sessions = await stripe.checkout.sessions.list({
              customer: customerIdUpd,
              limit: 1,
            });
            const lastSession = sessions.data[0];
            const userId = lastSession?.metadata?.userId;
            const tier = lastSession?.metadata?.tier;
            if (userId && tier) {
              await storage.updateUserTier(parseInt(userId), tier);
              console.log(`Updated user ${userId} tier to ${tier} (subscription updated)`);
            }
          }
          break;
        }
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook event:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/checkout/create-session", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }

      const { listingId, quantity } = req.body;
      if (!listingId || !quantity || quantity < 1) {
        return res.status(400).json({ message: "Listing ID and quantity are required" });
      }

      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const unitAmountCents = Math.round(listing.pricePerBf * 100);
      if (unitAmountCents < 50) {
        return res.status(400).json({ message: "Price too low for payment processing (minimum $0.50)" });
      }
      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : (host.includes("localhost") ? "http" : "https");
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${listing.species} - ${listing.grade} Grade`,
                description: `${listing.dimensions} | Seller: ${listing.sellerName}${listing.location ? ` | ${listing.location}` : ""}`,
              },
              unit_amount: unitAmountCents,
            },
            quantity,
          },
        ],
        metadata: {
          listingId: listing.id.toString(),
          buyerId: req.userId!.toString(),
          sellerId: (listing.sellerId ?? "").toString(),
        },
        success_url: `${baseUrl}/marketplace?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/marketplace?checkout=cancelled`,
      });

      stampToChain(req.userId!, "marketplace_purchase", `Checkout for ${listing.species} (${listing.grade}) x${quantity}`, {
        listingId: listing.id, species: listing.species, grade: listing.grade,
        quantity, unitAmount: unitAmountCents, sessionId: session.id,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.get("/api/checkout/session/:sessionId", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }

      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId as string);
      res.json({
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
        listingId: session.metadata?.listingId,
      });
    } catch (error) {
      console.error("Error retrieving checkout session:", error);
      res.status(500).json({ message: "Failed to retrieve checkout session" });
    }
  });

  app.get("/api/reviews/:targetType/:targetId", async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const reviews = await storage.getReviews(targetType, parseInt(targetId));
      const stats = await storage.getAverageRating(targetType, parseInt(targetId));
      res.json({ reviews, stats });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      const data = insertReviewSchema.parse({
        ...req.body,
        userId: user.id,
        userName: user.name || user.email.split("@")[0],
      });
      const review = await storage.createReview(data);

      stampToChain(req.userId!, "review_submitted", `Review for ${data.targetType} #${data.targetId} — ${data.rating}/5`, {
        reviewId: review.id, targetType: data.targetType, targetId: data.targetId, rating: data.rating,
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post("/api/search/interpret", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string" || query.trim().length < 3) {
        return res.status(400).json({ error: "Please enter at least a few words" });
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You convert natural language shopping queries into concise product search terms that work well on retail websites. Return ONLY the search terms, nothing else. Keep it short (1-5 words). Examples:
- "something to keep my coffee hot on the trail" → "insulated travel mug"
- "best knife for cleaning fish" → "fillet knife"
- "warm jacket for winter camping" → "insulated camping jacket"
- "I need new boots for hiking in the rain" → "waterproof hiking boots"
- "ammo for my AR-15" → "5.56 NATO ammo"
- "a good tent for 4 people" → "4 person tent"
If the input is already a product name or clear search term, return it as-is.`
          },
          { role: "user", content: query.trim() }
        ],
        max_tokens: 30,
        temperature: 0.3,
      });
      const searchTerm = response.choices[0]?.message?.content?.trim() || query.trim();
      res.json({ original: query.trim(), searchTerm });
    } catch (error) {
      console.error("Search interpret error:", error);
      res.json({ original: req.body.query?.trim(), searchTerm: req.body.query?.trim() });
    }
  });

  app.post("/api/identify", requireAuth, async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nature identification expert. Identify the species in the image. Return a JSON object with these fields: commonName, scientificName, confidence (0-100), category (tree, flower, plant, fungus, animal, bird, insect, other), description (2-3 sentences about the species), habitat, conservationStatus, funFact. If you cannot identify the species, set commonName to 'Unknown' and confidence to 0.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please identify the species in this image." },
              { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");

      if (result.commonName && result.commonName !== "Unknown") {
        stampToChain(req.userId!, "species_identification", `Identified: ${result.commonName} (${result.scientificName}) — ${result.confidence}% confidence`, {
          commonName: result.commonName, scientificName: result.scientificName,
          confidence: result.confidence, category: result.category,
          conservationStatus: result.conservationStatus,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error identifying species:", error);
      res.status(500).json({ message: "Failed to identify species" });
    }
  });

  app.post("/api/identify/audio", requireAuth, async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ message: "Audio data is required" });
      }
      if (typeof audioBase64 !== "string" || audioBase64.length > 25 * 1024 * 1024) {
        return res.status(400).json({ message: "Audio file is too large. Please record a shorter clip (under 60 seconds)." });
      }

      const base64Data = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
      const audioBuffer = Buffer.from(base64Data, "base64");
      const ext = (mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm";
      const { toFile } = await import("openai");
      const audioFile = await toFile(audioBuffer, `recording.${ext}`, { type: mimeType || "audio/webm" });

      let transcription = "";
      try {
        const whisperRes = await openai.audio.transcriptions.create({
          model: "whisper-1",
          file: audioFile,
          prompt: "This is a recording of animal sounds, bird calls, insect noises, or wildlife vocalizations captured outdoors in nature.",
        });
        transcription = whisperRes.text;
      } catch (whisperErr) {
        console.error("Whisper transcription failed:", whisperErr);
        transcription = "";
      }

      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert wildlife bioacoustics specialist who identifies animals by their sounds. A user has recorded an audio clip outdoors. The audio transcription (if available) may contain onomatopoeia, background noise descriptions, or garbled text from animal vocalizations — use it as clues.

Analyze the transcription and recording context to determine what animal, bird, insect, frog, or other creature is most likely making the sound.

Return a JSON object with these fields:
- commonName: The common name of the species (e.g., "Northern Cardinal", "American Bullfrog", "Gray Tree Frog")
- scientificName: The Latin binomial name
- confidence: A number 0-100 representing how confident you are
- category: One of: bird, mammal, amphibian, reptile, insect, fish, other
- description: 2-3 sentences about the species and the sound it makes
- habitat: Where this species is typically found
- conservationStatus: IUCN status or general conservation info
- funFact: An interesting fact about this species
- soundDescription: A brief description of what the sound typically sounds like (e.g., "A clear, whistled 'cheer-cheer-cheer' followed by a rapid trill")

If the audio doesn't appear to contain identifiable animal sounds, set commonName to "Unknown" and confidence to 0, and provide helpful feedback in the description about what kinds of sounds work best.`,
          },
          {
            role: "user",
            content: `I recorded this sound outdoors and want to identify the animal making it.${transcription ? `\n\nAudio transcription: "${transcription}"` : "\n\nThe audio transcription was empty or unclear — the sound may be non-vocal (e.g., insect buzzing, rustling, drumming)."}\n\nPlease identify the species based on this sound recording.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(analysisResponse.choices[0]?.message?.content || "{}");

      if (result.commonName && result.commonName !== "Unknown") {
        stampToChain(req.userId!, "audio_species_identification", `Audio ID: ${result.commonName} (${result.scientificName}) — ${result.confidence}% confidence`, {
          commonName: result.commonName,
          scientificName: result.scientificName,
          confidence: result.confidence,
          category: result.category,
          conservationStatus: result.conservationStatus,
          identificationMethod: "audio",
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error identifying species from audio:", error);
      res.status(500).json({ message: "Failed to identify species from audio" });
    }
  });

  app.get("/api/blog", async (req, res) => {
    try {
      const { status, category, tag, featured, limit, offset, q } = req.query;
      if (q) {
        const posts = await storage.searchBlogPosts(q as string);
        return res.json(posts);
      }
      const posts = await storage.getBlogPosts({
        status: (status as string) || "published",
        category: category as string,
        tag: tag as string,
        featured: featured === "true" ? true : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/count", async (req, res) => {
    try {
      const count = await storage.getBlogPostCount(req.query.status as string);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog post count" });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", requireAuth, requireTier("Craftsman Pro"), async (req, res) => {
    try {
      const { title, slug, content } = req.body;
      if (!title || !slug || !content) {
        return res.status(400).json({ message: "Title, slug, and content are required" });
      }
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      const data = {
        ...req.body,
        authorId: req.userId,
        authorName: `${user.firstName} ${user.lastName}`,
        publishedAt: req.body.status === "published" ? new Date() : null,
        readingTime: Math.ceil((req.body.content || "").split(/\s+/).length / 200),
      };
      const post = await storage.createBlogPost(data);
      stampToChain(req.userId!, "blog_post_published", `Blog: ${post.title}`, { postId: post.id, slug: post.slug });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.patch("/api/blog/:id", requireAuth, requireTier("Craftsman Pro"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getBlogPost(id);
      if (!existing) return res.status(404).json({ message: "Post not found" });
      const data = { ...req.body };
      if (req.body.content) {
        data.readingTime = Math.ceil(req.body.content.split(/\s+/).length / 200);
      }
      if (req.body.status === "published" && existing.status !== "published") {
        data.publishedAt = new Date();
      }
      const updated = await storage.updateBlogPost(id, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/blog/:id", requireAuth, requireTier("Craftsman Pro"), async (req, res) => {
    try {
      const deleted = await storage.deleteBlogPost(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Post not found" });
      res.json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  app.post("/api/blog/ai-generate", requireAuth, requireTier("Craftsman Pro"), async (req, res) => {
    try {
      const { topic, keywords, tone } = req.body;
      if (!topic) return res.status(400).json({ message: "Topic is required" });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert outdoor recreation, forestry, and nature content writer for Verdara — a premium outdoor recreation super-app. Write SEO-optimized, educational, engaging blog content. Use a ${tone || "informative and enthusiastic"} tone. Return a JSON object with these fields: title, slug (url-friendly), excerpt (150 chars max), content (full article in markdown, 800-1500 words, with H2/H3 headings, bullet points, practical tips), category (one of: Lumberjack Sports, Wilderness Skills, Trail Guides, Gear Reviews, Conservation, Wild Edibles, Forestry, Outdoor Education, Safety, Wildlife, Fishing, Camping, Climbing, Water Sports, Winter Sports), tags (array of 5-8 relevant tags), seoTitle (60 chars max), seoDescription (155 chars max), seoKeywords (array of 8-12 SEO keywords).`,
          },
          {
            role: "user",
            content: `Write a blog post about: ${topic}${keywords ? `. Key topics to cover: ${keywords}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("Error generating blog content:", error);
      res.status(500).json({ message: "Failed to generate blog content" });
    }
  });

  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      const systemPrompt = `You are Evergreen, Verdara's friendly AI outdoor recreation assistant. You're a cheerful, knowledgeable nature guide who helps people discover outdoor adventures, identify wildlife and plants, plan trips, find the best trails, campgrounds, fishing spots, and more.

Your personality:
- Warm, enthusiastic, and encouraging about getting outdoors
- Knowledgeable about hiking, camping, fishing, climbing, wildlife, wild edibles, state parks, national parks, and all outdoor activities
- You give practical, helpful advice with specific recommendations
- You occasionally use nature-related puns or expressions
- Keep responses concise but informative (2-3 paragraphs max unless asked for detail)
- You know about Verdara's features: AI species identification (photo & sound), catalog of 145+ outdoor locations, trip planner, price comparison for gear, marketplace, and arborist tools
- If asked about features, guide users to the relevant section of the app

Important: You are NOT a medical professional. For any health/safety emergencies, always advise calling 911 or contacting local authorities.`;

      const trimmedMessages = messages.slice(-20).map((m: any) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: String(m.content).slice(0, 2000),
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmedMessages,
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content || "I'm not sure how to help with that. Could you try asking in a different way?";
      res.json({ reply });
    } catch (error) {
      console.error("Assistant chat error:", error);
      res.status(500).json({ message: "Evergreen is taking a nap. Please try again in a moment!" });
    }
  });

  return httpServer;
}
