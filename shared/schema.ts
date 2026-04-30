import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, integer, real, boolean,
  timestamp, serial, jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  tier: text("tier").default("Free Explorer"),
  trailsCompleted: integer("trails_completed").default(0),
  speciesIdentified: integer("species_identified").default(0),
  conservationDonated: real("conservation_donated").default(0),
  equipmentTracked: integer("equipment_tracked").default(0),
  trustLayerId: text("trust_layer_id").unique(),
  ecosystemPinHash: text("ecosystem_pin_hash"),
  ecosystemApp: text("ecosystem_app"),
  uniqueHash: text("unique_hash").unique(),
  memberSince: timestamp("member_since").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trails = pgTable("trails", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  distance: text("distance").notNull(),
  elevation: text("elevation").notNull(),
  difficulty: text("difficulty").notNull(),
  rating: real("rating").default(0),
  reviews: integer("reviews").default(0),
  image: text("image"),
  description: text("description"),
  activityType: text("activity_type").default("hiking"),
  features: text("features").array(),
  isFeatured: boolean("is_featured").default(false),
  lat: real("lat"),
  lng: real("lng"),
});

export const identifications = pgTable("identifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name"),
  category: text("category").notNull(),
  confidence: real("confidence"),
  description: text("description"),
  habitat: text("habitat"),
  characteristics: text("characteristics"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id),
  species: text("species").notNull(),
  grade: text("grade").notNull(),
  dimensions: text("dimensions").notNull(),
  pricePerBf: real("price_per_bf").notNull(),
  sellerName: text("seller_name").notNull(),
  trustLevel: integer("trust_level").default(1),
  trustScore: integer("trust_score").default(500),
  location: text("location"),
  image: text("image"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripPlans = pgTable("trip_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  waypoints: jsonb("waypoints").$type<{ id: number; name: string; time: string; duration: string }[]>(),
  gearChecklist: jsonb("gear_checklist").$type<{ name: string; items: { id: number; name: string; checked: boolean }[] }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campgrounds = pgTable("campgrounds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  price: real("price").notNull(),
  rating: real("rating").default(0),
  sites: integer("sites").default(0),
  amenities: text("amenities").array(),
  image: text("image"),
  description: text("description"),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  date: text("date"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLocations = pgTable("activity_locations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  state: text("state"),
  description: text("description"),
  image: text("image"),
  rating: real("rating").default(0),
  reviews: integer("reviews").default(0),
  difficulty: text("difficulty"),
  season: text("season"),
  regulations: text("regulations"),
  species: text("species").array(),
  amenities: text("amenities").array(),
  tags: text("tags").array(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  isFeatured: boolean("is_featured").default(false),
});

export const arboristClients = pgTable("arborist_clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristJobs = pgTable("arborist_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => arboristClients.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("scheduled"),
  scheduledDate: text("scheduled_date"),
  completedDate: text("completed_date"),
  crew: text("crew").array(),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristInvoices = pgTable("arborist_invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => arboristClients.id),
  jobId: integer("job_id").references(() => arboristJobs.id),
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").default("draft"),
  items: jsonb("items").$type<{ description: string; quantity: number; unitPrice: number }[]>(),
  subtotal: real("subtotal").default(0),
  tax: real("tax").default(0),
  total: real("total").default(0),
  dueDate: text("due_date"),
  paidDate: text("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristDeals = pgTable("arborist_deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => arboristClients.id),
  title: text("title").notNull(),
  value: real("value").default(0),
  stage: text("stage").default("new"),
  description: text("description"),
  expectedCloseDate: text("expected_close_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristEstimates = pgTable("arborist_estimates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => arboristClients.id),
  estimateNumber: text("estimate_number").notNull(),
  status: text("status").default("draft"),
  items: jsonb("items").$type<{ description: string; quantity: number; unitPrice: number }[]>(),
  subtotal: real("subtotal").default(0),
  tax: real("tax").default(0),
  total: real("total").default(0),
  validUntil: text("valid_until"),
  notes: text("notes"),
  siteAddress: text("site_address"),
  treeSpecies: text("tree_species"),
  serviceType: text("service_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristCrewMembers = pgTable("arborist_crew_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").default("climber"),
  hourlyRate: real("hourly_rate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristTimeEntries = pgTable("arborist_time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  crewMemberId: integer("crew_member_id").references(() => arboristCrewMembers.id),
  jobId: integer("job_id").references(() => arboristJobs.id),
  date: text("date").notNull(),
  hoursWorked: real("hours_worked").notNull(),
  overtimeHours: real("overtime_hours").default(0),
  notes: text("notes"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arboristInventory = pgTable("arborist_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").default("supplies"),
  sku: text("sku"),
  currentQuantity: integer("current_quantity").default(0),
  unit: text("unit").default("each"),
  reorderPoint: integer("reorder_point").default(5),
  costPerUnit: real("cost_per_unit"),
  supplier: text("supplier"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const catalogLocations = pgTable("catalog_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  description: text("description"),
  editorialSummary: text("editorial_summary"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  lat: real("lat"),
  lng: real("lng"),
  activities: text("activities").array(),
  species: text("species").array(),
  gameTypes: text("game_types").array(),
  amenities: text("amenities").array(),
  seasons: text("seasons").array(),
  tags: text("tags").array(),
  difficulty: text("difficulty"),
  regulations: text("regulations"),
  website: text("website"),
  phone: text("phone"),
  bookingUrl: text("booking_url"),
  permitUrl: text("permit_url"),
  imageUrl: text("image_url"),
  photos: text("photos").array(),
  rating: real("rating").default(0),
  reviews: integer("reviews").default(0),
  priceRange: text("price_range"),
  providerType: text("provider_type"),
  jurisdiction: text("jurisdiction"),
  source: text("source").default("manual"),
  sourceId: text("source_id"),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const locationSubmissions = pgTable("location_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  city: text("city"),
  state: text("state"),
  lat: real("lat"),
  lng: real("lng"),
  activities: text("activities").array(),
  species: text("species").array(),
  website: text("website"),
  status: text("status").default("pending"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campgroundBookings = pgTable("campground_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  campgroundId: integer("campground_id").references(() => campgrounds.id),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  guests: integer("guests").default(1),
  siteType: text("site_type").default("tent"),
  status: text("status").default("confirmed"),
  totalPrice: real("total_price"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content"),
  userName: text("user_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatUsers = pgTable("chat_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#06b6d4"),
  role: text("role").notNull().default("member"),
  trustLayerId: text("trust_layer_id").unique(),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatChannels = pgTable("chat_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull().default("ecosystem"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  authorId: integer("author_id").references(() => users.id),
  authorName: text("author_name"),
  status: text("status").default("draft"),
  category: text("category"),
  tags: text("tags").array(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
  ogImage: text("og_image"),
  readingTime: integer("reading_time"),
  featured: boolean("featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const chatRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Valid email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least 1 capital letter")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least 1 special character")
    .regex(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, "Password does not meet security requirements"),
  displayName: z.string().min(1, "Display name is required"),
});

export const insertChatUserSchema = createInsertSchema(chatUsers).omit({ id: true, createdAt: true, lastSeen: true });
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

export type ChatUser = typeof chatUsers.$inferSelect;
export type InsertChatUser = z.infer<typeof insertChatUserSchema>;
export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least 1 capital letter")
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/, "Password must contain at least 1 special character");

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, memberSince: true });
export const insertTrailSchema = createInsertSchema(trails).omit({ id: true });
export const insertIdentificationSchema = createInsertSchema(identifications).omit({ id: true, createdAt: true });
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({ id: true, createdAt: true });
export const insertTripPlanSchema = createInsertSchema(tripPlans).omit({ id: true, createdAt: true });
export const insertCampgroundSchema = createInsertSchema(campgrounds).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export const insertActivityLocationSchema = createInsertSchema(activityLocations).omit({ id: true });
export const insertArboristClientSchema = createInsertSchema(arboristClients).omit({ id: true, createdAt: true });
export const insertArboristJobSchema = createInsertSchema(arboristJobs).omit({ id: true, createdAt: true });
export const insertArboristInvoiceSchema = createInsertSchema(arboristInvoices).omit({ id: true, createdAt: true });
export const insertArboristDealSchema = createInsertSchema(arboristDeals).omit({ id: true, createdAt: true });
export const insertArboristEstimateSchema = createInsertSchema(arboristEstimates).omit({ id: true, createdAt: true });
export const insertArboristCrewMemberSchema = createInsertSchema(arboristCrewMembers).omit({ id: true, createdAt: true });
export const insertArboristTimeEntrySchema = createInsertSchema(arboristTimeEntries).omit({ id: true, createdAt: true });
export const insertArboristInventorySchema = createInsertSchema(arboristInventory).omit({ id: true, createdAt: true });
export const insertCatalogLocationSchema = createInsertSchema(catalogLocations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLocationSubmissionSchema = createInsertSchema(locationSubmissions).omit({ id: true, createdAt: true });
export const insertCampgroundBookingSchema = createInsertSchema(campgroundBookings).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrail = z.infer<typeof insertTrailSchema>;
export type Trail = typeof trails.$inferSelect;
export type InsertIdentification = z.infer<typeof insertIdentificationSchema>;
export type Identification = typeof identifications.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertTripPlan = z.infer<typeof insertTripPlanSchema>;
export type TripPlan = typeof tripPlans.$inferSelect;
export type InsertCampground = z.infer<typeof insertCampgroundSchema>;
export type Campground = typeof campgrounds.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type InsertActivityLocation = z.infer<typeof insertActivityLocationSchema>;
export type ActivityLocation = typeof activityLocations.$inferSelect;
export type InsertArboristClient = z.infer<typeof insertArboristClientSchema>;
export type ArboristClient = typeof arboristClients.$inferSelect;
export type InsertArboristJob = z.infer<typeof insertArboristJobSchema>;
export type ArboristJob = typeof arboristJobs.$inferSelect;
export type InsertArboristInvoice = z.infer<typeof insertArboristInvoiceSchema>;
export type ArboristInvoice = typeof arboristInvoices.$inferSelect;
export type InsertArboristDeal = z.infer<typeof insertArboristDealSchema>;
export type ArboristDeal = typeof arboristDeals.$inferSelect;
export type InsertArboristEstimate = z.infer<typeof insertArboristEstimateSchema>;
export type ArboristEstimate = typeof arboristEstimates.$inferSelect;
export type InsertArboristCrewMember = z.infer<typeof insertArboristCrewMemberSchema>;
export type ArboristCrewMember = typeof arboristCrewMembers.$inferSelect;
export type InsertArboristTimeEntry = z.infer<typeof insertArboristTimeEntrySchema>;
export type ArboristTimeEntry = typeof arboristTimeEntries.$inferSelect;
export type InsertArboristInventory = z.infer<typeof insertArboristInventorySchema>;
export type ArboristInventoryItem = typeof arboristInventory.$inferSelect;
export type InsertCatalogLocation = z.infer<typeof insertCatalogLocationSchema>;
export type CatalogLocation = typeof catalogLocations.$inferSelect;
export type InsertLocationSubmission = z.infer<typeof insertLocationSubmissionSchema>;
export type LocationSubmission = typeof locationSubmissions.$inferSelect;
export type InsertCampgroundBooking = z.infer<typeof insertCampgroundBookingSchema>;
export type CampgroundBooking = typeof campgroundBookings.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  source: text("source").notNull(),
  url: text("url"),
  userAgent: text("user_agent"),
  userId: integer("user_id"),
  deviceInfo: jsonb("device_info"),
  metadata: jsonb("metadata"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({ id: true, createdAt: true });
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

export const hallmarks = pgTable("hallmarks", {
  id: serial("id").primaryKey(),
  thId: text("th_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  appId: text("app_id"),
  appName: text("app_name"),
  productName: text("product_name"),
  releaseType: text("release_type"),
  metadata: jsonb("metadata"),
  dataHash: text("data_hash").notNull(),
  txHash: text("tx_hash"),
  blockHeight: text("block_height"),
  qrCodeSvg: text("qr_code_svg"),
  verificationUrl: text("verification_url"),
  hallmarkId: integer("hallmark_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trustStamps = pgTable("trust_stamps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  category: text("category").notNull(),
  data: jsonb("data"),
  dataHash: text("data_hash").notNull(),
  txHash: text("tx_hash"),
  blockHeight: text("block_height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hallmarkCounter = pgTable("hallmark_counter", {
  id: text("id").primaryKey(),
  currentSequence: text("current_sequence").notNull().default("0"),
});

export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredUserId: integer("referred_user_id").references(() => users.id),
  referralHash: text("referral_hash").notNull(),
  platform: text("platform").notNull().default("verdara"),
  status: text("status").notNull().default("pending"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referralId: integer("referral_id").references(() => affiliateReferrals.id),
  amount: text("amount").notNull(),
  currency: text("currency").default("SIG"),
  tier: text("tier").default("base"),
  status: text("status").default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHallmarkSchema = createInsertSchema(hallmarks).omit({ id: true, createdAt: true });
export type InsertHallmark = z.infer<typeof insertHallmarkSchema>;
export type Hallmark = typeof hallmarks.$inferSelect;

export const insertTrustStampSchema = createInsertSchema(trustStamps).omit({ id: true, createdAt: true });
export type InsertTrustStamp = z.infer<typeof insertTrustStampSchema>;
export type TrustStamp = typeof trustStamps.$inferSelect;

export const insertAffiliateReferralSchema = createInsertSchema(affiliateReferrals).omit({ id: true, createdAt: true, convertedAt: true });
export type InsertAffiliateReferral = z.infer<typeof insertAffiliateReferralSchema>;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;

export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissions).omit({ id: true, createdAt: true, paidAt: true });
export type InsertAffiliateCommission = z.infer<typeof insertAffiliateCommissionSchema>;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
