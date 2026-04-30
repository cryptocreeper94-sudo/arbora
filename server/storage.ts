import {
  type User, type InsertUser,
  type Trail, type InsertTrail,
  type Identification, type InsertIdentification,
  type MarketplaceListing, type InsertMarketplaceListing,
  type TripPlan, type InsertTripPlan,
  type Campground, type InsertCampground,
  type ActivityLog, type InsertActivityLog,
  type ActivityLocation, type InsertActivityLocation,
  type ArboristClient, type InsertArboristClient,
  type ArboristJob, type InsertArboristJob,
  type ArboristInvoice, type InsertArboristInvoice,
  type ArboristDeal, type InsertArboristDeal,
  type ArboristEstimate, type InsertArboristEstimate,
  type ArboristCrewMember, type InsertArboristCrewMember,
  type ArboristTimeEntry, type InsertArboristTimeEntry,
  type ArboristInventoryItem, type InsertArboristInventory,
  type CampgroundBooking, type InsertCampgroundBooking,
  type CatalogLocation, type InsertCatalogLocation,
  type LocationSubmission, type InsertLocationSubmission,
  type Review, type InsertReview,
  type Session,
  type BlogPost, type InsertBlogPost,
  type ErrorLog, type InsertErrorLog,
  users, trails, identifications, marketplaceListings,
  tripPlans, campgrounds, activityLog, sessions,
  activityLocations, arboristClients, arboristJobs, arboristInvoices,
  arboristDeals, arboristEstimates, arboristCrewMembers, arboristTimeEntries, arboristInventory,
  campgroundBookings, catalogLocations, locationSubmissions, reviews, blogPosts, errorLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, lt, and, count, sql, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  getUserByTrustLayerId(trustLayerId: string): Promise<User | undefined>;
  updateUserTrustLayerId(id: number, trustLayerId: string): Promise<void>;

  createSession(userId: number, token: string, expiresAt: Date): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

  getTrails(): Promise<Trail[]>;
  getTrail(id: number): Promise<Trail | undefined>;
  getFeaturedTrails(): Promise<Trail[]>;
  createTrail(trail: InsertTrail): Promise<Trail>;
  searchTrails(query: string): Promise<Trail[]>;

  getIdentifications(userId?: number): Promise<Identification[]>;
  getIdentification(id: number): Promise<Identification | undefined>;
  createIdentification(identification: InsertIdentification): Promise<Identification>;

  getMarketplaceListings(): Promise<MarketplaceListing[]>;
  getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;

  getTripPlans(userId?: number): Promise<TripPlan[]>;
  getTripPlan(id: number): Promise<TripPlan | undefined>;
  createTripPlan(plan: InsertTripPlan): Promise<TripPlan>;
  updateTripPlan(id: number, data: Partial<InsertTripPlan>): Promise<TripPlan | undefined>;

  getCampgrounds(): Promise<Campground[]>;
  getCampground(id: number): Promise<Campground | undefined>;
  createCampground(campground: InsertCampground): Promise<Campground>;

  getActivityLog(userId: number): Promise<ActivityLog[]>;
  createActivityLog(entry: InsertActivityLog): Promise<ActivityLog>;

  deleteTripPlan(id: number, userId: number): Promise<boolean>;
  deleteMarketplaceListing(id: number, userId: number): Promise<boolean>;
  updateMarketplaceListing(id: number, data: Partial<InsertMarketplaceListing>): Promise<MarketplaceListing | undefined>;
  getUserMarketplaceListings(userId: number): Promise<MarketplaceListing[]>;
  getUserStats(userId: number): Promise<{ tripsCount: number; identificationsCount: number; activitiesCount: number; listingsCount: number }>;
  searchMarketplaceListings(query: string): Promise<MarketplaceListing[]>;
  filterTrails(difficulty?: string, activityType?: string): Promise<Trail[]>;

  getActivityLocations(type?: string): Promise<ActivityLocation[]>;
  getActivityLocation(id: number): Promise<ActivityLocation | undefined>;
  searchActivityLocations(query: string, type?: string): Promise<ActivityLocation[]>;
  createActivityLocation(location: InsertActivityLocation): Promise<ActivityLocation>;

  getArboristClients(userId: number): Promise<ArboristClient[]>;
  getArboristClient(id: number): Promise<ArboristClient | undefined>;
  createArboristClient(client: InsertArboristClient): Promise<ArboristClient>;
  updateArboristClient(id: number, data: Partial<InsertArboristClient>): Promise<ArboristClient | undefined>;
  deleteArboristClient(id: number, userId: number): Promise<boolean>;

  getArboristJobs(userId: number): Promise<ArboristJob[]>;
  getArboristJob(id: number): Promise<ArboristJob | undefined>;
  createArboristJob(job: InsertArboristJob): Promise<ArboristJob>;
  updateArboristJob(id: number, data: Partial<InsertArboristJob>): Promise<ArboristJob | undefined>;
  deleteArboristJob(id: number, userId: number): Promise<boolean>;

  getArboristInvoices(userId: number): Promise<ArboristInvoice[]>;
  getArboristInvoice(id: number): Promise<ArboristInvoice | undefined>;
  createArboristInvoice(invoice: InsertArboristInvoice): Promise<ArboristInvoice>;
  updateArboristInvoice(id: number, data: Partial<InsertArboristInvoice>): Promise<ArboristInvoice | undefined>;
  deleteArboristInvoice(id: number, userId: number): Promise<boolean>;

  getArboristDeals(userId: number): Promise<ArboristDeal[]>;
  createArboristDeal(deal: InsertArboristDeal): Promise<ArboristDeal>;
  updateArboristDeal(id: number, data: Partial<InsertArboristDeal>): Promise<ArboristDeal | undefined>;
  deleteArboristDeal(id: number, userId: number): Promise<boolean>;

  getArboristEstimates(userId: number): Promise<ArboristEstimate[]>;
  createArboristEstimate(estimate: InsertArboristEstimate): Promise<ArboristEstimate>;
  updateArboristEstimate(id: number, data: Partial<InsertArboristEstimate>): Promise<ArboristEstimate | undefined>;
  deleteArboristEstimate(id: number, userId: number): Promise<boolean>;

  getArboristCrewMembers(userId: number): Promise<ArboristCrewMember[]>;
  createArboristCrewMember(member: InsertArboristCrewMember): Promise<ArboristCrewMember>;
  updateArboristCrewMember(id: number, data: Partial<InsertArboristCrewMember>): Promise<ArboristCrewMember | undefined>;
  deleteArboristCrewMember(id: number, userId: number): Promise<boolean>;

  getArboristTimeEntries(userId: number, jobId?: number): Promise<ArboristTimeEntry[]>;
  createArboristTimeEntry(entry: InsertArboristTimeEntry): Promise<ArboristTimeEntry>;
  updateArboristTimeEntry(id: number, data: Partial<InsertArboristTimeEntry>): Promise<ArboristTimeEntry | undefined>;
  deleteArboristTimeEntry(id: number, userId: number): Promise<boolean>;

  getArboristInventoryItems(userId: number): Promise<ArboristInventoryItem[]>;
  createArboristInventoryItem(item: InsertArboristInventory): Promise<ArboristInventoryItem>;
  updateArboristInventoryItem(id: number, data: Partial<InsertArboristInventory>): Promise<ArboristInventoryItem | undefined>;
  deleteArboristInventoryItem(id: number, userId: number): Promise<boolean>;
  getArboristLowStockItems(userId: number): Promise<ArboristInventoryItem[]>;

  updateUserTier(userId: number, tier: string): Promise<User | undefined>;

  getCampgroundBookings(userId: number): Promise<CampgroundBooking[]>;
  createCampgroundBooking(data: InsertCampgroundBooking): Promise<CampgroundBooking>;
  updateCampgroundBooking(id: number, data: Partial<InsertCampgroundBooking>): Promise<CampgroundBooking | undefined>;
  deleteCampgroundBooking(id: number, userId: number): Promise<boolean>;

  getCatalogLocations(filters?: { type?: string; state?: string; activity?: string; species?: string; featured?: boolean; limit?: number; offset?: number }): Promise<CatalogLocation[]>;
  getCatalogLocation(id: number): Promise<CatalogLocation | undefined>;
  getCatalogLocationBySlug(slug: string): Promise<CatalogLocation | undefined>;
  searchCatalogLocations(query: string, type?: string, state?: string): Promise<CatalogLocation[]>;
  searchCatalogByProximity(lat: number, lng: number, radiusMiles: number, type?: string, limit?: number): Promise<(CatalogLocation & { distanceMiles: number })[]>;
  createCatalogLocation(location: InsertCatalogLocation): Promise<CatalogLocation>;
  updateCatalogLocation(id: number, data: Partial<InsertCatalogLocation>): Promise<CatalogLocation | undefined>;
  deleteCatalogLocation(id: number): Promise<boolean>;
  getCatalogLocationCount(type?: string): Promise<number>;
  getCatalogLocationsBySource(source: string): Promise<CatalogLocation[]>;

  getLocationSubmissions(status?: string): Promise<LocationSubmission[]>;
  createLocationSubmission(submission: InsertLocationSubmission): Promise<LocationSubmission>;
  updateLocationSubmission(id: number, data: Partial<InsertLocationSubmission>): Promise<LocationSubmission | undefined>;

  getReviews(targetType: string, targetId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAverageRating(targetType: string, targetId: number): Promise<{ average: number; count: number }>;

  getBlogPosts(filters?: { status?: string; category?: string; tag?: string; featured?: boolean; limit?: number; offset?: number }): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  searchBlogPosts(query: string): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  getBlogPostCount(status?: string): Promise<number>;

  createErrorLog(log: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(filters?: { level?: string; source?: string; limit?: number; offset?: number }): Promise<ErrorLog[]>;
  getErrorLogCount(filters?: { level?: string; source?: string }): Promise<number>;
  clearErrorLogs(before?: Date): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase(),
    }).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUserByTrustLayerId(trustLayerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.trustLayerId, trustLayerId));
    return user;
  }

  async updateUserTrustLayerId(id: number, trustLayerId: string): Promise<void> {
    await db.update(users).set({ trustLayerId }).where(eq(users.id, id));
  }

  async createSession(userId: number, token: string, expiresAt: Date): Promise<Session> {
    const [session] = await db.insert(sessions).values({ userId, token, expiresAt }).returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }

  async getTrails(): Promise<Trail[]> {
    return db.select().from(trails);
  }

  async getTrail(id: number): Promise<Trail | undefined> {
    const [trail] = await db.select().from(trails).where(eq(trails.id, id));
    return trail;
  }

  async getFeaturedTrails(): Promise<Trail[]> {
    return db.select().from(trails).where(eq(trails.isFeatured, true));
  }

  async createTrail(trail: InsertTrail): Promise<Trail> {
    const [created] = await db.insert(trails).values(trail).returning();
    return created;
  }

  async searchTrails(query: string): Promise<Trail[]> {
    return db.select().from(trails).where(
      or(
        ilike(trails.name, `%${query}%`),
        ilike(trails.location, `%${query}%`)
      )
    );
  }

  async getIdentifications(userId?: number): Promise<Identification[]> {
    if (userId) {
      return db.select().from(identifications)
        .where(eq(identifications.userId, userId))
        .orderBy(desc(identifications.createdAt));
    }
    return db.select().from(identifications).orderBy(desc(identifications.createdAt));
  }

  async getIdentification(id: number): Promise<Identification | undefined> {
    const [ident] = await db.select().from(identifications).where(eq(identifications.id, id));
    return ident;
  }

  async createIdentification(identification: InsertIdentification): Promise<Identification> {
    const [created] = await db.insert(identifications).values(identification).returning();
    return created;
  }

  async getMarketplaceListings(): Promise<MarketplaceListing[]> {
    return db.select().from(marketplaceListings).where(eq(marketplaceListings.isActive, true));
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    const [listing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id));
    return listing;
  }

  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const [created] = await db.insert(marketplaceListings).values(listing).returning();
    return created;
  }

  async getTripPlans(userId?: number): Promise<TripPlan[]> {
    if (userId) {
      return db.select().from(tripPlans)
        .where(eq(tripPlans.userId, userId))
        .orderBy(desc(tripPlans.createdAt));
    }
    return db.select().from(tripPlans).orderBy(desc(tripPlans.createdAt));
  }

  async getTripPlan(id: number): Promise<TripPlan | undefined> {
    const [plan] = await db.select().from(tripPlans).where(eq(tripPlans.id, id));
    return plan;
  }

  async createTripPlan(plan: InsertTripPlan): Promise<TripPlan> {
    const [created] = await db.insert(tripPlans).values(plan as any).returning();
    return created;
  }

  async updateTripPlan(id: number, data: Partial<InsertTripPlan>): Promise<TripPlan | undefined> {
    const [updated] = await db.update(tripPlans).set(data as any).where(eq(tripPlans.id, id)).returning();
    return updated;
  }

  async getCampgrounds(): Promise<Campground[]> {
    return db.select().from(campgrounds);
  }

  async getCampground(id: number): Promise<Campground | undefined> {
    const [cg] = await db.select().from(campgrounds).where(eq(campgrounds.id, id));
    return cg;
  }

  async createCampground(campground: InsertCampground): Promise<Campground> {
    const [created] = await db.insert(campgrounds).values(campground).returning();
    return created;
  }

  async getActivityLog(userId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt));
  }

  async createActivityLog(entry: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLog).values(entry).returning();
    return created;
  }

  async deleteTripPlan(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(tripPlans).where(and(eq(tripPlans.id, id), eq(tripPlans.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteMarketplaceListing(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(marketplaceListings).where(and(eq(marketplaceListings.id, id), eq(marketplaceListings.sellerId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateMarketplaceListing(id: number, data: Partial<InsertMarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const [updated] = await db.update(marketplaceListings).set(data as any).where(eq(marketplaceListings.id, id)).returning();
    return updated;
  }

  async getUserMarketplaceListings(userId: number): Promise<MarketplaceListing[]> {
    return db.select().from(marketplaceListings).where(eq(marketplaceListings.sellerId, userId)).orderBy(desc(marketplaceListings.createdAt));
  }

  async getUserStats(userId: number): Promise<{ tripsCount: number; identificationsCount: number; activitiesCount: number; listingsCount: number }> {
    const [trips] = await db.select({ count: count() }).from(tripPlans).where(eq(tripPlans.userId, userId));
    const [idents] = await db.select({ count: count() }).from(identifications).where(eq(identifications.userId, userId));
    const [activities] = await db.select({ count: count() }).from(activityLog).where(eq(activityLog.userId, userId));
    const [listings] = await db.select({ count: count() }).from(marketplaceListings).where(eq(marketplaceListings.sellerId, userId));
    return {
      tripsCount: trips?.count ?? 0,
      identificationsCount: idents?.count ?? 0,
      activitiesCount: activities?.count ?? 0,
      listingsCount: listings?.count ?? 0,
    };
  }

  async searchMarketplaceListings(query: string): Promise<MarketplaceListing[]> {
    return db.select().from(marketplaceListings).where(
      and(
        eq(marketplaceListings.isActive, true),
        or(
          ilike(marketplaceListings.species, `%${query}%`),
          ilike(marketplaceListings.sellerName, `%${query}%`),
          ilike(marketplaceListings.location, `%${query}%`)
        )
      )
    );
  }

  async filterTrails(difficulty?: string, activityType?: string): Promise<Trail[]> {
    const conditions = [];
    if (difficulty) conditions.push(eq(trails.difficulty, difficulty));
    if (activityType) conditions.push(eq(trails.activityType, activityType));
    if (conditions.length === 0) return this.getTrails();
    return db.select().from(trails).where(and(...conditions));
  }

  async getActivityLocations(type?: string): Promise<ActivityLocation[]> {
    if (type) {
      return db.select().from(activityLocations).where(eq(activityLocations.type, type));
    }
    return db.select().from(activityLocations);
  }

  async getActivityLocation(id: number): Promise<ActivityLocation | undefined> {
    const [loc] = await db.select().from(activityLocations).where(eq(activityLocations.id, id));
    return loc;
  }

  async searchActivityLocations(query: string, type?: string): Promise<ActivityLocation[]> {
    const searchConditions = or(
      ilike(activityLocations.name, `%${query}%`),
      ilike(activityLocations.location, `%${query}%`),
      ilike(activityLocations.state, `%${query}%`)
    );
    if (type) {
      return db.select().from(activityLocations).where(and(eq(activityLocations.type, type), searchConditions));
    }
    return db.select().from(activityLocations).where(searchConditions!);
  }

  async createActivityLocation(location: InsertActivityLocation): Promise<ActivityLocation> {
    const [created] = await db.insert(activityLocations).values(location as any).returning();
    return created;
  }

  async getArboristClients(userId: number): Promise<ArboristClient[]> {
    return db.select().from(arboristClients).where(eq(arboristClients.userId, userId)).orderBy(desc(arboristClients.createdAt));
  }

  async getArboristClient(id: number): Promise<ArboristClient | undefined> {
    const [client] = await db.select().from(arboristClients).where(eq(arboristClients.id, id));
    return client;
  }

  async createArboristClient(client: InsertArboristClient): Promise<ArboristClient> {
    const [created] = await db.insert(arboristClients).values(client).returning();
    return created;
  }

  async updateArboristClient(id: number, data: Partial<InsertArboristClient>): Promise<ArboristClient | undefined> {
    const [updated] = await db.update(arboristClients).set(data as any).where(eq(arboristClients.id, id)).returning();
    return updated;
  }

  async deleteArboristClient(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristClients).where(and(eq(arboristClients.id, id), eq(arboristClients.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristJobs(userId: number): Promise<ArboristJob[]> {
    return db.select().from(arboristJobs).where(eq(arboristJobs.userId, userId)).orderBy(desc(arboristJobs.createdAt));
  }

  async getArboristJob(id: number): Promise<ArboristJob | undefined> {
    const [job] = await db.select().from(arboristJobs).where(eq(arboristJobs.id, id));
    return job;
  }

  async createArboristJob(job: InsertArboristJob): Promise<ArboristJob> {
    const [created] = await db.insert(arboristJobs).values(job as any).returning();
    return created;
  }

  async updateArboristJob(id: number, data: Partial<InsertArboristJob>): Promise<ArboristJob | undefined> {
    const [updated] = await db.update(arboristJobs).set(data as any).where(eq(arboristJobs.id, id)).returning();
    return updated;
  }

  async deleteArboristJob(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristJobs).where(and(eq(arboristJobs.id, id), eq(arboristJobs.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristInvoices(userId: number): Promise<ArboristInvoice[]> {
    return db.select().from(arboristInvoices).where(eq(arboristInvoices.userId, userId)).orderBy(desc(arboristInvoices.createdAt));
  }

  async getArboristInvoice(id: number): Promise<ArboristInvoice | undefined> {
    const [invoice] = await db.select().from(arboristInvoices).where(eq(arboristInvoices.id, id));
    return invoice;
  }

  async createArboristInvoice(invoice: InsertArboristInvoice): Promise<ArboristInvoice> {
    const [created] = await db.insert(arboristInvoices).values(invoice as any).returning();
    return created;
  }

  async updateArboristInvoice(id: number, data: Partial<InsertArboristInvoice>): Promise<ArboristInvoice | undefined> {
    const [updated] = await db.update(arboristInvoices).set(data as any).where(eq(arboristInvoices.id, id)).returning();
    return updated;
  }

  async deleteArboristInvoice(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristInvoices).where(and(eq(arboristInvoices.id, id), eq(arboristInvoices.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristDeals(userId: number): Promise<ArboristDeal[]> {
    return db.select().from(arboristDeals).where(eq(arboristDeals.userId, userId)).orderBy(desc(arboristDeals.createdAt));
  }

  async createArboristDeal(deal: InsertArboristDeal): Promise<ArboristDeal> {
    const [created] = await db.insert(arboristDeals).values(deal as any).returning();
    return created;
  }

  async updateArboristDeal(id: number, data: Partial<InsertArboristDeal>): Promise<ArboristDeal | undefined> {
    const [updated] = await db.update(arboristDeals).set(data as any).where(eq(arboristDeals.id, id)).returning();
    return updated;
  }

  async deleteArboristDeal(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristDeals).where(and(eq(arboristDeals.id, id), eq(arboristDeals.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristEstimates(userId: number): Promise<ArboristEstimate[]> {
    return db.select().from(arboristEstimates).where(eq(arboristEstimates.userId, userId)).orderBy(desc(arboristEstimates.createdAt));
  }

  async createArboristEstimate(estimate: InsertArboristEstimate): Promise<ArboristEstimate> {
    const [created] = await db.insert(arboristEstimates).values(estimate as any).returning();
    return created;
  }

  async updateArboristEstimate(id: number, data: Partial<InsertArboristEstimate>): Promise<ArboristEstimate | undefined> {
    const [updated] = await db.update(arboristEstimates).set(data as any).where(eq(arboristEstimates.id, id)).returning();
    return updated;
  }

  async deleteArboristEstimate(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristEstimates).where(and(eq(arboristEstimates.id, id), eq(arboristEstimates.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristCrewMembers(userId: number): Promise<ArboristCrewMember[]> {
    return db.select().from(arboristCrewMembers).where(eq(arboristCrewMembers.userId, userId)).orderBy(asc(arboristCrewMembers.firstName));
  }

  async createArboristCrewMember(member: InsertArboristCrewMember): Promise<ArboristCrewMember> {
    const [created] = await db.insert(arboristCrewMembers).values(member as any).returning();
    return created;
  }

  async updateArboristCrewMember(id: number, data: Partial<InsertArboristCrewMember>): Promise<ArboristCrewMember | undefined> {
    const [updated] = await db.update(arboristCrewMembers).set(data as any).where(eq(arboristCrewMembers.id, id)).returning();
    return updated;
  }

  async deleteArboristCrewMember(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristCrewMembers).where(and(eq(arboristCrewMembers.id, id), eq(arboristCrewMembers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristTimeEntries(userId: number, jobId?: number): Promise<ArboristTimeEntry[]> {
    if (jobId) {
      return db.select().from(arboristTimeEntries).where(and(eq(arboristTimeEntries.userId, userId), eq(arboristTimeEntries.jobId, jobId))).orderBy(desc(arboristTimeEntries.date));
    }
    return db.select().from(arboristTimeEntries).where(eq(arboristTimeEntries.userId, userId)).orderBy(desc(arboristTimeEntries.date));
  }

  async createArboristTimeEntry(entry: InsertArboristTimeEntry): Promise<ArboristTimeEntry> {
    const [created] = await db.insert(arboristTimeEntries).values(entry as any).returning();
    return created;
  }

  async updateArboristTimeEntry(id: number, data: Partial<InsertArboristTimeEntry>): Promise<ArboristTimeEntry | undefined> {
    const [updated] = await db.update(arboristTimeEntries).set(data as any).where(eq(arboristTimeEntries.id, id)).returning();
    return updated;
  }

  async deleteArboristTimeEntry(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristTimeEntries).where(and(eq(arboristTimeEntries.id, id), eq(arboristTimeEntries.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristInventoryItems(userId: number): Promise<ArboristInventoryItem[]> {
    return db.select().from(arboristInventory).where(eq(arboristInventory.userId, userId)).orderBy(asc(arboristInventory.name));
  }

  async createArboristInventoryItem(item: InsertArboristInventory): Promise<ArboristInventoryItem> {
    const [created] = await db.insert(arboristInventory).values(item as any).returning();
    return created;
  }

  async updateArboristInventoryItem(id: number, data: Partial<InsertArboristInventory>): Promise<ArboristInventoryItem | undefined> {
    const [updated] = await db.update(arboristInventory).set(data as any).where(eq(arboristInventory.id, id)).returning();
    return updated;
  }

  async deleteArboristInventoryItem(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(arboristInventory).where(and(eq(arboristInventory.id, id), eq(arboristInventory.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getArboristLowStockItems(userId: number): Promise<ArboristInventoryItem[]> {
    return db.select().from(arboristInventory).where(
      and(eq(arboristInventory.userId, userId), sql`${arboristInventory.currentQuantity} <= ${arboristInventory.reorderPoint}`)
    );
  }

  async updateUserTier(userId: number, tier: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ tier }).where(eq(users.id, userId)).returning();
    return user;
  }

  async getCampgroundBookings(userId: number): Promise<CampgroundBooking[]> {
    return db.select().from(campgroundBookings).where(eq(campgroundBookings.userId, userId)).orderBy(desc(campgroundBookings.createdAt));
  }

  async createCampgroundBooking(data: InsertCampgroundBooking): Promise<CampgroundBooking> {
    const [created] = await db.insert(campgroundBookings).values(data as any).returning();
    return created;
  }

  async updateCampgroundBooking(id: number, data: Partial<InsertCampgroundBooking>): Promise<CampgroundBooking | undefined> {
    const [updated] = await db.update(campgroundBookings).set(data as any).where(eq(campgroundBookings.id, id)).returning();
    return updated;
  }

  async deleteCampgroundBooking(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(campgroundBookings).where(and(eq(campgroundBookings.id, id), eq(campgroundBookings.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getCatalogLocations(filters?: { type?: string; state?: string; activity?: string; species?: string; featured?: boolean; limit?: number; offset?: number }): Promise<CatalogLocation[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(catalogLocations.type, filters.type));
    if (filters?.state) conditions.push(eq(catalogLocations.state, filters.state));
    if (filters?.featured) conditions.push(eq(catalogLocations.isFeatured, true));
    if (filters?.activity) conditions.push(sql`${filters.activity} = ANY(${catalogLocations.activities})`);
    if (filters?.species) conditions.push(sql`${filters.species} = ANY(${catalogLocations.species})`);
    const query = db.select().from(catalogLocations);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0).orderBy(desc(catalogLocations.isFeatured), asc(catalogLocations.name));
    }
    return query.limit(filters?.limit ?? 100).offset(filters?.offset ?? 0).orderBy(desc(catalogLocations.isFeatured), asc(catalogLocations.name));
  }

  async getCatalogLocation(id: number): Promise<CatalogLocation | undefined> {
    const [loc] = await db.select().from(catalogLocations).where(eq(catalogLocations.id, id));
    return loc;
  }

  async getCatalogLocationBySlug(slug: string): Promise<CatalogLocation | undefined> {
    const [loc] = await db.select().from(catalogLocations).where(eq(catalogLocations.slug, slug));
    return loc;
  }

  async searchCatalogLocations(query: string, type?: string, state?: string): Promise<CatalogLocation[]> {
    const searchConditions = or(
      ilike(catalogLocations.name, `%${query}%`),
      ilike(catalogLocations.city, `%${query}%`),
      ilike(catalogLocations.state, `%${query}%`),
      ilike(catalogLocations.description, `%${query}%`)
    );
    const conditions = [searchConditions!];
    if (type) conditions.push(eq(catalogLocations.type, type));
    if (state) conditions.push(eq(catalogLocations.state, state));
    return db.select().from(catalogLocations).where(and(...conditions)).limit(50).orderBy(desc(catalogLocations.isFeatured), asc(catalogLocations.name));
  }

  async searchCatalogByProximity(lat: number, lng: number, radiusMiles: number, type?: string, limit: number = 50): Promise<(CatalogLocation & { distanceMiles: number })[]> {
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const distanceExpr = sql`(3959 * acos(
      cos(${latRad}) * cos(${catalogLocations.lat} * 3.14159265359 / 180) *
      cos((${catalogLocations.lng} * 3.14159265359 / 180) - ${lngRad}) +
      sin(${latRad}) * sin(${catalogLocations.lat} * 3.14159265359 / 180)
    ))`;

    const latDelta = radiusMiles / 69.0;
    const lngDelta = radiusMiles / (69.0 * Math.cos(latRad));

    const conditions = [
      sql`${catalogLocations.lat} IS NOT NULL`,
      sql`${catalogLocations.lng} IS NOT NULL`,
      sql`${catalogLocations.lat} BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
      sql`${catalogLocations.lng} BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`,
      sql`${distanceExpr} < ${radiusMiles}`,
    ];
    if (type) conditions.push(eq(catalogLocations.type, type));

    const results = await db.select({
      id: catalogLocations.id,
      name: catalogLocations.name,
      slug: catalogLocations.slug,
      type: catalogLocations.type,
      description: catalogLocations.description,
      editorialSummary: catalogLocations.editorialSummary,
      address: catalogLocations.address,
      city: catalogLocations.city,
      state: catalogLocations.state,
      zipCode: catalogLocations.zipCode,
      lat: catalogLocations.lat,
      lng: catalogLocations.lng,
      activities: catalogLocations.activities,
      species: catalogLocations.species,
      gameTypes: catalogLocations.gameTypes,
      amenities: catalogLocations.amenities,
      seasons: catalogLocations.seasons,
      tags: catalogLocations.tags,
      difficulty: catalogLocations.difficulty,
      regulations: catalogLocations.regulations,
      website: catalogLocations.website,
      phone: catalogLocations.phone,
      bookingUrl: catalogLocations.bookingUrl,
      permitUrl: catalogLocations.permitUrl,
      imageUrl: catalogLocations.imageUrl,
      photos: catalogLocations.photos,
      rating: catalogLocations.rating,
      reviews: catalogLocations.reviews,
      priceRange: catalogLocations.priceRange,
      providerType: catalogLocations.providerType,
      jurisdiction: catalogLocations.jurisdiction,
      source: catalogLocations.source,
      sourceId: catalogLocations.sourceId,
      isFeatured: catalogLocations.isFeatured,
      isVerified: catalogLocations.isVerified,
      metadata: catalogLocations.metadata,
      createdAt: catalogLocations.createdAt,
      updatedAt: catalogLocations.updatedAt,
      distanceMiles: sql<number>`${distanceExpr}`.as("distance_miles"),
    }).from(catalogLocations)
      .where(and(...conditions))
      .orderBy(sql`${distanceExpr}`)
      .limit(limit);

    return results as (CatalogLocation & { distanceMiles: number })[];
  }

  async createCatalogLocation(location: InsertCatalogLocation): Promise<CatalogLocation> {
    const [created] = await db.insert(catalogLocations).values(location as any).returning();
    return created;
  }

  async updateCatalogLocation(id: number, data: Partial<InsertCatalogLocation>): Promise<CatalogLocation | undefined> {
    const [updated] = await db.update(catalogLocations).set({ ...data as any, updatedAt: new Date() }).where(eq(catalogLocations.id, id)).returning();
    return updated;
  }

  async deleteCatalogLocation(id: number): Promise<boolean> {
    const result = await db.delete(catalogLocations).where(eq(catalogLocations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCatalogLocationCount(type?: string): Promise<number> {
    if (type) {
      const [result] = await db.select({ count: count() }).from(catalogLocations).where(eq(catalogLocations.type, type));
      return result?.count ?? 0;
    }
    const [result] = await db.select({ count: count() }).from(catalogLocations);
    return result?.count ?? 0;
  }

  async getCatalogLocationsBySource(source: string): Promise<CatalogLocation[]> {
    return db.select().from(catalogLocations).where(eq(catalogLocations.source, source));
  }

  async getLocationSubmissions(status?: string): Promise<LocationSubmission[]> {
    if (status) {
      return db.select().from(locationSubmissions).where(eq(locationSubmissions.status, status)).orderBy(desc(locationSubmissions.createdAt));
    }
    return db.select().from(locationSubmissions).orderBy(desc(locationSubmissions.createdAt));
  }

  async createLocationSubmission(submission: InsertLocationSubmission): Promise<LocationSubmission> {
    const [created] = await db.insert(locationSubmissions).values(submission as any).returning();
    return created;
  }

  async updateLocationSubmission(id: number, data: Partial<InsertLocationSubmission>): Promise<LocationSubmission | undefined> {
    const [updated] = await db.update(locationSubmissions).set(data as any).where(eq(locationSubmissions.id, id)).returning();
    return updated;
  }

  async getReviews(targetType: string, targetId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(and(eq(reviews.targetType, targetType), eq(reviews.targetId, targetId)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review as any).returning();
    return created;
  }

  async getAverageRating(targetType: string, targetId: number): Promise<{ average: number; count: number }> {
    const [result] = await db.select({
      average: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      count: count(),
    }).from(reviews)
      .where(and(eq(reviews.targetType, targetType), eq(reviews.targetId, targetId)));
    return { average: Number(result?.average ?? 0), count: result?.count ?? 0 };
  }

  async getBlogPosts(filters?: { status?: string; category?: string; tag?: string; featured?: boolean; limit?: number; offset?: number }): Promise<BlogPost[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(blogPosts.status, filters.status));
    if (filters?.category) conditions.push(eq(blogPosts.category, filters.category));
    if (filters?.featured) conditions.push(eq(blogPosts.featured, true));
    if (filters?.tag) conditions.push(sql`${filters.tag} = ANY(${blogPosts.tags})`);
    
    const query = db.select().from(blogPosts);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .limit(filters?.limit ?? 20)
        .offset(filters?.offset ?? 0)
        .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
    }
    return query
      .limit(filters?.limit ?? 20)
      .offset(filters?.offset ?? 0)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    return db.select().from(blogPosts).where(
      or(
        ilike(blogPosts.title, `%${query}%`),
        ilike(blogPosts.excerpt, `%${query}%`),
        ilike(blogPosts.category, `%${query}%`)
      )
    );
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPosts).values(post as any).returning();
    return created;
  }

  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return updated;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getBlogPostCount(status?: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(blogPosts)
      .where(status ? eq(blogPosts.status, status) : undefined);
    return result?.count ?? 0;
  }
  async createErrorLog(log: InsertErrorLog): Promise<ErrorLog> {
    const [created] = await db.insert(errorLogs).values(log as any).returning();
    return created;
  }

  async getErrorLogs(filters?: { level?: string; source?: string; limit?: number; offset?: number }): Promise<ErrorLog[]> {
    const conditions = [];
    if (filters?.level) conditions.push(eq(errorLogs.level, filters.level));
    if (filters?.source) conditions.push(eq(errorLogs.source, filters.source));
    const query = db.select().from(errorLogs);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(desc(errorLogs.createdAt))
        .limit(filters?.limit ?? 100)
        .offset(filters?.offset ?? 0);
    }
    return query
      .orderBy(desc(errorLogs.createdAt))
      .limit(filters?.limit ?? 100)
      .offset(filters?.offset ?? 0);
  }

  async getErrorLogCount(filters?: { level?: string; source?: string }): Promise<number> {
    const conditions = [];
    if (filters?.level) conditions.push(eq(errorLogs.level, filters.level));
    if (filters?.source) conditions.push(eq(errorLogs.source, filters.source));
    if (conditions.length > 0) {
      const [result] = await db.select({ count: count() }).from(errorLogs).where(and(...conditions));
      return result?.count ?? 0;
    }
    const [result] = await db.select({ count: count() }).from(errorLogs);
    return result?.count ?? 0;
  }

  async clearErrorLogs(before?: Date): Promise<number> {
    if (before) {
      const result = await db.delete(errorLogs).where(lt(errorLogs.createdAt, before));
      return result.rowCount ?? 0;
    }
    const result = await db.delete(errorLogs);
    return result.rowCount ?? 0;
  }
}

export const storage = new DatabaseStorage();
