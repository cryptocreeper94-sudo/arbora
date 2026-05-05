# PaintPros.io - Complete Business & Marketing Backend Handoff

## Purpose
This document provides a complete technical handoff of the PaintPros.io business backend systems: CRM, scheduling/booking, marketing automation (Meta/Facebook/Instagram), analytics, crew management, AI credits, payment processing, lead generation, follow-up automation, referral programs, inventory management, and all supporting services. Everything needed for another agent or developer to understand, recreate, or extend the platform.

---

## 1. Platform Overview

PaintPros.io is a multi-tenant SaaS platform for the painting and home services industry. Four distinct sites run from one codebase:

| Site | Domain | Purpose | Branding |
|------|--------|---------|----------|
| PaintPros.io | paintpros.io | Flagship SaaS demo + white-label template | Navy (#0f172a) / White (#f8fafc) |
| NashPaintPros.io | nashpaintpros.io | Ecosystem advertising hub + lead gen marketplace | Navy / White (dark premium) |
| TLID.io | tlid.io | TrustLayer Marketing - automated ad platform for ANY business | Cyan / Lavender / Purple |
| TradeWorksAI.io | tradeworksai.com | Multi-trade field tools platform | Navy / White |

**Critical Design Rules:**
- NO green or cream colors anywhere
- Always use lucide-react icons, never emoji
- Never say "AI" or "app" in user-facing text - use "room visualizer tool", "estimator tool", "instant estimation"

---

## 2. Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript (tsx)
- **Framework:** Express.js
- **ORM:** Drizzle ORM with PostgreSQL (Neon-backed via Replit)
- **Schema:** `shared/schema.ts` (Drizzle table definitions + Zod validation)
- **Routes:** `server/routes.ts` (extensive API endpoints)
- **Storage Layer:** `server/storage.ts` (CRUD interface - all DB operations go through `IStorage`)
- **Database Config:** `server/db.ts` (Drizzle + Neon connection)

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** wouter (90+ pages in `client/src/pages/`)
- **Data Fetching:** TanStack React Query v5
- **Styling:** Tailwind CSS + Shadcn/ui (Radix-based)
- **Animations:** Framer Motion
- **Icons:** lucide-react

### Key Server Files
| File | Purpose |
|------|---------|
| `server/routes.ts` | All 300+ API endpoints |
| `server/storage.ts` | Database CRUD interface (IStorage) |
| `server/aiCredits.ts` | AI credit costs, packs, subscription tiers |
| `server/stripeClient.ts` | Stripe client with hybrid credential management |
| `server/resend.ts` | Resend email service integration |
| `server/meta-oauth.ts` | Facebook/Instagram OAuth flow |
| `server/npp-posting-scheduler.ts` | NPP organic posting scheduler |
| `server/npp-ad-scheduler.ts` | NPP ad campaign scheduler |
| `server/darkwave-unified-scheduler.ts` | Multi-tenant ecosystem posting scheduler |
| `server/autopilot-engine.ts` | Marketing Autopilot multi-tenant engine |
| `server/social-connectors.ts` | Twitter/X and Nextdoor connectors |
| `server/tenant-provisioning.ts` | Tenant creation + Stripe checkout |
| `server/orbit.ts` | Orbit ecosystem sync |
| `shared/schema.ts` | All database table definitions |
| `client/src/config/tenant.ts` | Multi-tenant frontend config |

---

## 3. Multi-Tenant Architecture

### How Tenants Work
- Most business data tables have a `tenantId` column for data isolation (some global tables like `users`, `sessions`, and system-level tables do not have tenantId or have it as optional)
- Frontend tenant selection driven by `VITE_TENANT_ID` environment variable
- Tenant config in `client/src/config/tenant.ts` defines branding, services, pricing, SEO, and feature toggles per tenant
- Production tenants table (`tenants`) stores subscription/billing info, Stripe IDs, feature flags
- Trial tenants table (`trialTenants`) for self-service signups with usage limits

### Tenant Config Structure (`TenantConfig`)
```typescript
interface TenantConfig {
  id: string;                    // 'demo', 'npp', 'lumepaint', 'tlid', etc.
  slug: string;                  // URL-friendly identifier
  tradeVertical: TradeVertical;  // 'painting', 'roofing', 'hvac', etc.
  subscriptionTier: SubscriptionTier; // 'estimator_only' | 'full_suite'
  brandingModel: BrandingModel;  // 'franchise' | 'custom'
  name: string;
  tagline: string;
  theme: { primaryColor, accentColor, darkMode, lightMode };
  services: { interiorPainting, exteriorPainting, ... };
  pricing: { doorsPerUnit, wallsPerSqFt, fullJobPerSqFt, ... };
  seo: { title, description, keywords, serviceAreas };
  features: { estimator, portfolio, reviews, blog, onlineBooking, aiAssistant };
  social: { facebook, instagram, twitter, linkedin, google };
}
```

### Tenant Provisioning Flow (`server/tenant-provisioning.ts`)
1. User submits onboarding form (company name, trade vertical, selected trades, tier)
2. System generates URL slug from company name
3. Creates Stripe customer with metadata
4. Inserts tenant record with `status: "provisioning"`
5. Creates Stripe Checkout session with appropriate price IDs
6. On successful payment webhook, activates tenant (`status: "active"`)
7. Syncs to Orbit ecosystem

### Stripe Price IDs (Production)
**Trade Estimators (per-vertical):**
| Trade | Monthly Price ID | Annual Price ID |
|-------|-----------------|----------------|
| Painting | `price_1SrBzdPQpkkF93FKy15vIwzk` | `price_1SrBzdPQpkkF93FKlyz5qaIJ` |
| Roofing | `price_1SrBzePQpkkF93FK60VGhCdM` | `price_1SrBzePQpkkF93FKiwe9uQpj` |
| HVAC | `price_1SrBzfPQpkkF93FKYCsvXoQp` | `price_1SrBzfPQpkkF93FKz07rfQti` |
| Electrical | `price_1SrBzgPQpkkF93FKeGlRsJ4t` | `price_1SrBzgPQpkkF93FKcPNB1obI` |
| Plumbing | `price_1SrBzhPQpkkF93FK5T5LhOKe` | `price_1SrBzhPQpkkF93FKtqRu7Dc4` |
| Landscaping | `price_1SrBziPQpkkF93FKxtIWid03` | `price_1SrBziPQpkkF93FKRaEsWRnI` |
| Construction | `price_1SrCEMPQpkkF93FKWbCpPnSJ` | `price_1SrCEMPQpkkF93FKK4y5DaIC` |

**Trade Bundles:**
| Bundle | Monthly | Annual | Trades |
|--------|---------|--------|--------|
| 3-Trade | `price_1SrBziPQpkkF93FKqU4gHpG3` | `price_1SrBzjPQpkkF93FKHnvtYJuI` | 3 |
| All-Trades | `price_1SrBzjPQpkkF93FKVn6QHOXH` | `price_1SrBzkPQpkkF93FKShNdCxwk` | 7 |

**Platform Tiers:**
| Tier | Monthly | Annual | Price |
|------|---------|--------|-------|
| Professional | `price_1SlCL5PQpkkF93FKe0aUduOg` | `price_1SlCL5PQpkkF93FKYh5D4Tj7` | $199/mo |
| Enterprise | `price_1SlCL6PQpkkF93FKuFz2kDcu` | `price_1SlCL6PQpkkF93FKTKOkcU9A` | $499/mo |

**Combo Bundles:**
| Combo | Monthly | Annual | Price |
|-------|---------|--------|-------|
| Pro + All Trades | `price_1SrBzkPQpkkF93FKJCxeiNix` | `price_1SrBzkPQpkkF93FKmHIerZg3` | $269/mo |
| Enterprise + All Trades | `price_1SrBzlPQpkkF93FKDQeUnnA5` | `price_1SrBzlPQpkkF93FKJ61myt1o` | $569/mo |

---

## 4. CRM System

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `leads` | Customer leads | tenantId, name, email, phone, address, source, status, projectType, estimatedValue |
| `crmDeals` | Sales pipeline deals | tenantId, leadId, dealName, stage, value, expectedCloseDate, assignedTo |
| `crmActivities` | Activity tracking | entityType, entityId, activityType (call/email/meeting/note/follow_up), description, scheduledAt |
| `crmNotes` | Notes on entities | entityType (lead/deal/estimate), entityId, content, createdBy |
| `estimates` | Cost estimates | tenantId, leadId, totalCost, rooms, services, status (draft/sent/accepted/declined) |
| `estimateRequests` | Incoming requests | name, email, phone, address, serviceType, description, status |
| `proposals` | Formal proposals | tenantId, estimateId, content, status (draft/sent/viewed/accepted/declined) |
| `proposalTemplates` | Reusable templates | tenantId, name, category, content, variables |
| `proposalSignatures` | E-signatures | proposalId, signerName, signerEmail, signatureDataUrl, signedAt |

### CRM Pipeline Stages
The deals pipeline uses these stages: `new` → `contacted` → `qualified` → `proposal_sent` → `negotiation` → `won` / `lost`

### API Endpoints
```
GET    /api/crm/deals              - List all deals
POST   /api/crm/deals              - Create a deal
GET    /api/crm/deals/:id          - Get deal by ID
PUT    /api/crm/deals/:id          - Update deal
DELETE /api/crm/deals/:id          - Delete deal
GET    /api/crm/deals/pipeline     - Pipeline summary (stage counts + values)

GET    /api/crm/activities          - All activities
POST   /api/crm/activities          - Create activity
GET    /api/crm/activities/:entityType/:entityId - Activities for entity

POST   /api/crm/notes              - Create note
GET    /api/crm/notes/:entityType/:entityId - Notes for entity
PUT    /api/crm/notes/:id          - Update note
DELETE /api/crm/notes/:id          - Delete note

GET    /api/leads                  - List all leads
POST   /api/leads                  - Create lead
GET    /api/leads/:id              - Get lead
GET    /api/leads/search?q=        - Search leads

POST   /api/estimates              - Create estimate
GET    /api/estimates              - List estimates
GET    /api/estimates/:id          - Get estimate by ID
GET    /api/estimates/lead/:leadId - Estimates for a lead

POST   /api/estimate-requests      - Create estimate request
GET    /api/estimate-requests      - List requests
PUT    /api/estimate-requests/:id/status - Update status

POST   /api/proposals              - Create proposal
GET    /api/proposals              - List proposals
GET    /api/proposals/:id          - Get proposal
PUT    /api/proposals/:id/status   - Update proposal status
POST   /api/proposals/:id/sign     - Submit e-signature
GET    /api/proposals/:id/signature - Get signature
```

### Frontend Components
| Component | File | Purpose |
|-----------|------|---------|
| Deals Pipeline | `client/src/components/crm/deals-pipeline.tsx` | Kanban-style pipeline board |
| Activity Timeline | `client/src/components/crm/activity-timeline.tsx` | Chronological activity log |
| Proposal Templates | `client/src/components/crm/proposal-templates.tsx` | Template CRUD management |
| DripJobs Import | `client/src/components/crm/dripjobs-import.tsx` | Import from DripJobs CRM |

### Frontend Pages
| Page | Route | Purpose |
|------|-------|---------|
| Estimate | `/estimate` | Customer-facing estimate form |
| Estimator Config | `/estimator-config` | Admin pricing configuration |
| Estimator App | `/estimator-app` | Full estimator application |
| Proposal Sign | `/proposal/:id/sign` | Customer e-signature page |

---

## 5. Scheduling & Booking System

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `calendarEvents` | All calendar entries | tenantId, title, eventType (appointment/estimate/job/meeting/reminder/blocked), status (scheduled/confirmed/in_progress/completed/cancelled/no_show), startTime, endTime, customerName, assignedTo, relatedLeadId, isRecurring |
| `calendarReminders` | Event notifications | eventId, reminderType (email/sms/push/in_app), offsetMinutes, recipientRole, status (pending/sent/failed) |
| `eventColorPresets` | Color coding config | tenantId, name, colorCode, eventType, isDefault |
| `schedulingSlots` | Available time slots | tenantId, dayOfWeek, startTime, endTime, maxBookings, isActive |
| `customerBookings` | Customer appointments | tenantId, customerName, customerEmail, customerPhone, serviceType, preferredDate, status (pending/confirmed/cancelled/completed/no_show), calendarEventId |

### API Endpoints
```
GET    /api/calendar/events                   - List events (optional ?start=&end= filters)
POST   /api/calendar/events                   - Create event
GET    /api/calendar/events/:id               - Get event
PUT    /api/calendar/events/:id               - Update event
DELETE /api/calendar/events/:id               - Delete event

POST   /api/calendar/reminders                - Create reminder
GET    /api/calendar/reminders/event/:eventId  - Reminders for event
PUT    /api/calendar/reminders/:id/status      - Update reminder status

GET    /api/calendar/color-presets             - List color presets
POST   /api/calendar/color-presets             - Create preset

GET    /api/scheduling/slots                   - Available booking slots
POST   /api/scheduling/slots                   - Create slot
PUT    /api/scheduling/slots/:id               - Update slot

POST   /api/bookings                           - Create booking
GET    /api/bookings                           - List bookings
GET    /api/bookings/:id                       - Get booking
PUT    /api/bookings/:id/status                - Update booking status
```

### Frontend Components
| Component | File | Purpose |
|-----------|------|---------|
| CRM Calendar | `client/src/components/crm-calendar.tsx` | Full calendar view with drag-and-drop |
| Booking Wizard | `client/src/components/booking-wizard.tsx` | 5-step customer booking form |
| Bookings Card | `client/src/components/bookings-card.tsx` | Admin booking management card |
| Google Calendar Connect | `client/src/components/google-calendar-connect.tsx` | Google Calendar sync setup |

### Booking Wizard Flow (5 Steps)
1. **Service Selection** - Choose service type (interior, exterior, commercial, etc.)
2. **Date & Time** - Pick from available scheduling slots
3. **Contact Info** - Customer name, email, phone
4. **Address** - Service location details
5. **Confirmation** - Review and submit booking

---

## 6. Marketing Automation

### 6.1 Marketing Content System

#### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `marketingPosts` | Text content library | tenantId, content, category (educational/gamified/sales/seasonal/evergreen/testimonial/behind-scenes), isActive, usageCount, lastUsedAt |
| `marketingImages` | Image library | tenantId, imageUrl, category, description, usageCount, lastUsedAt, isActive |
| `contentLibrary` | Unified content store | tenantId, title, body, contentType, category, platform (facebook/instagram/twitter/all), tags, mediaUrls, isApproved |
| `scheduledPosts` | Scheduled/posted items | tenantId, platform, content, imageUrl, scheduledFor, postedAt, status (scheduled/posting/posted/failed), externalPostId, metaAdId |
| `autoPostingSchedule` | Posting time config | tenantId, dayOfWeek, postTime (HH:MM CST), isActive, category |

#### Content Types & Categories
- **educational** - Tips, how-tos, painting advice
- **gamified** - Interactive content, polls, quizzes
- **sales** - Promotions, discounts, CTAs
- **seasonal** - Holiday/seasonal themed
- **evergreen** - Always-relevant content
- **testimonial** - Customer reviews and stories
- **behind-scenes** - Team/process highlights

### 6.2 Meta (Facebook/Instagram) Integration

#### OAuth Flow (`server/meta-oauth.ts`)
1. User clicks "Connect with Facebook" on Autopilot portal
2. System generates OAuth URL with permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, `business_management`
3. User authorizes on Facebook
4. Callback exchanges code for short-lived token
5. Short-lived token exchanged for long-lived token (60 days)
6. System fetches user's Pages and linked Instagram accounts
7. Stores page access tokens in `metaIntegrations` table

#### Meta Integration Table
```sql
metaIntegrations:
  tenantId, userAccessToken, pageAccessToken, pageId, pageName,
  instagramAccountId, instagramUsername, tokenExpiresAt,
  adAccountId, businessId, isActive
```

#### API Endpoints
```
GET    /api/meta/auth-url           - Get OAuth authorization URL
GET    /api/meta/callback           - OAuth callback handler
GET    /api/meta/status             - Check connection status
POST   /api/meta/disconnect         - Disconnect Meta integration
POST   /api/meta/post               - Manual post to Facebook/Instagram
GET    /api/meta/insights           - Get page/post insights
```

### 6.3 Posting Schedulers

#### NPP Posting Scheduler (`server/npp-posting-scheduler.ts`)
- **Schedule:** 9x daily every 2 hours: 6am, 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm, 10pm CST
- **Platforms:** Facebook + Instagram (via Meta Graph API), Twitter/X (via OAuth 1.0a)
- **Content Selection:** Rotates through `marketingPosts` and `marketingImages` using usage count (least-used first)
- **Image Handling:** Fetches next least-used image, updates usage count after posting
- **Token Validation:** Checks Meta token validity before each post attempt
- **Check Interval:** Every 60 seconds

#### DarkWave Unified Scheduler (`server/darkwave-unified-scheduler.ts`)
- **Purpose:** Multi-tenant ecosystem posting for 15+ brands
- **Ecosystem Tenants:** darkwave, dwtl, pulse, tlid, tradeworksai, paintpros, tldriverconnect, garagebot, trustshield, lotopspro, vedasolus, brewboard, orbitstaffing, orbycommander, strikeagent
- **Schedule:** Hourly 6am-10pm CST (17 slots/day), businesses rotate so each gets ~3 posts/day
- **Platforms:** Facebook, Instagram, Twitter/X
- **X/Twitter Rate Limiting:** Free tier (500 posts/month), max 1 X post per restart to prevent burst
- **Tenant URLs:** Each tenant has a configured website URL appended to posts

#### Autopilot Engine (`server/autopilot-engine.ts`)
- **Purpose:** Multi-tenant marketing automation for paying subscribers
- **Connectors:** `MultiTenantFacebookConnector` and `MultiTenantInstagramConnector`
- **Each subscriber** has their own Meta credentials stored per-subscription
- **Facebook posting:** Text or photo posts via Graph API v18.0 `/{pageId}/feed` or `/{pageId}/photos`
- **Instagram posting:** Two-step process: create media container → publish container

### 6.4 Ad Campaign System

#### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `adCampaigns` | Campaign records | tenantId, campaignName, platform, status (draft/active/paused/completed/failed), dailyBudget, totalBudget, totalSpent, startDate, endDate, targeting (JSON), metaCampaignId, metaAdSetId, metaAdId |

#### Ad Campaign Scheduler (`server/npp-ad-scheduler.ts`)
- **ADS_ENABLED:** `true` (Meta App is live)
- **Check Interval:** Every 30 minutes
- **Business Hours:** 8am-6pm CST
- **Campaign Duration:** 7 days with automatic rotation
- **Budget:** $50/day ($25 Facebook + $25 Instagram)
- **Geo Targeting:** Uses Meta Geo API to look up city keys for targeting
- **Campaign Creation Flow:**
  1. Create Campaign via Marketing API
  2. Create Ad Set with targeting (city, radius, age range)
  3. Create Ad creative with post content
  4. Monitor spend via API

#### API Endpoints
```
GET    /api/ad-campaigns            - List campaigns
POST   /api/ad-campaigns            - Create campaign
GET    /api/ad-campaigns/:id        - Get campaign
PUT    /api/ad-campaigns/:id        - Update campaign
PUT    /api/ad-campaigns/:id/status - Pause/resume campaign
GET    /api/ad-campaigns/spend      - Get current spend data
```

### 6.5 Social Connectors (`server/social-connectors.ts`)

#### Twitter/X Connector
- Uses OAuth 1.0a with HMAC-SHA1 signatures
- Supports text-only and image posts
- Image upload: downloads image → uploads to Twitter media endpoint → attaches to tweet
- Credentials: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

#### Nextdoor Connector
- Placeholder for future Nextdoor API integration

### 6.6 Marketing Autopilot Subscription System

#### Database Table: `autopilotSubscriptions`
```
tenantId, businessName, ownerName, email, phone, website,
status (pending/active/paused/cancelled), isInternal (no billing for platform apps),
stripeCustomerId, stripeSubscriptionId,
metaConnected, facebookPageId, instagramAccountId,
postingSchedule ('4x-daily'/'3x-daily'/'2x-daily'),
monthlyPrice (default $59.00)
```

#### API Endpoints
```
POST   /api/autopilot/subscribe     - Create subscription
GET    /api/autopilot/subscribers   - List all subscribers
GET    /api/autopilot/portal/:id    - Subscriber portal data
PUT    /api/autopilot/portal/:id    - Update subscriber settings
POST   /api/autopilot/post/:id      - Manual post for subscriber
GET    /api/autopilot/analytics/:id - Subscriber analytics
```

#### Frontend Pages
| Page | Route | Purpose |
|------|-------|---------|
| Marketing Autopilot | `/autopilot` | Landing/signup page |
| Autopilot Onboarding | `/autopilot/onboarding` | Subscriber setup wizard |
| Autopilot Portal | `/autopilot/portal` | Subscriber management dashboard |
| Autopilot Dashboard | `/autopilot/dashboard` | Analytics and insights |
| Autopilot Admin | `/autopilot/admin` | Platform admin - manage all subscribers |
| Autopilot Setup Guide | `/autopilot/setup` | Step-by-step setup instructions |

---

## 7. Analytics & Tracking

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `pageViews` | Individual page hits | tenantId, page, referrer, userAgent, ipHash, sessionId, deviceType, browser, country, city, duration |
| `analyticsSummary` | Pre-computed daily stats | date, totalViews, uniqueVisitors, avgDuration, bounceRate, topPages (JSON), topReferrers (JSON), deviceBreakdown (JSON) |
| `marketingChannels` | Marketing channel definitions | tenantId, name, channelType, source, medium, isActive |
| `marketingAttribution` | Revenue attribution per channel | tenantId, channelId, periodStart, periodEnd, impressions, clicks, leads, conversions, revenue, spend |

### Storage Interface Methods
```typescript
trackPageView(view: InsertPageView): Promise<PageView>
getPageViews(startDate?, endDate?): Promise<PageView[]>
getPageViewsByPage(page: string): Promise<PageView[]>
getLiveVisitorCount(): Promise<number>
getLiveVisitorCountByTenant(tenantId: string): Promise<number>
getAvailableTenants(): Promise<string[]>
getAnalyticsDashboard(): Promise<{ totalViews, uniqueVisitors, topPages, topReferrers, deviceBreakdown, recentViews, dailyTrend }>
getAnalyticsDashboardByTenant(tenantId: string): Promise<...>
getGeographicBreakdown(startDate, endDate, tenantId?): Promise<{ country, city, views, uniqueVisitors }[]>
```

### API Endpoints
```
POST   /api/analytics/track         - Track page view (called from frontend)
GET    /api/analytics/dashboard      - Full analytics dashboard data
GET    /api/analytics/dashboard/:tenantId - Per-tenant analytics
GET    /api/analytics/live           - Live visitor count
GET    /api/analytics/live/:tenantId - Live visitors per tenant
GET    /api/analytics/tenants        - Available tenants list
GET    /api/analytics/geo            - Geographic breakdown
```

### Frontend Components
| Component | File | Purpose |
|-----------|------|---------|
| Analytics Dashboard | `client/src/components/analytics-dashboard.tsx` | Global analytics view |
| Tenant Analytics | `client/src/components/tenant-analytics-dashboard.tsx` | Per-tenant analytics |
| Unified Analytics | `client/src/components/unified-analytics-dashboard.tsx` | Cross-tenant unified view |
| Live Visitors Card | `client/src/components/live-visitors-card.tsx` | Real-time visitor counter |

### External Integrations
- **Google Analytics 4:** Client-side via `VITE_GA_MEASUREMENT_ID`
- **ip-api.com:** Free geo-lookup for visitor country/city on page view tracking
- **Meta Graph API:** Facebook/Instagram post insights and ad analytics

---

## 8. Crew Management

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `crewLeads` | Team leaders | tenantId, firstName, lastName, email, phone, pin (default "3333"), isActive |
| `crewMembers` | Workers under leads | leadId, firstName, lastName, role (painter/apprentice/helper), hourlyRate, isActive |
| `timeEntries` | Hours worked | crewMemberId, leadId, date, hoursWorked, overtimeHours, jobAddress, status (pending/approved/submitted_to_payroll) |
| `jobNotes` | Field notes | leadId, tenantId, jobAddress, customerName, title, content, photos (JSON), sentToOwner, pdfUrl |
| `incidentReports` | On-site incidents | leadId, incidentType (injury/property_damage/customer_complaint/equipment/weather), severity (low/medium/high/critical), description, photos, status (open/investigating/resolved/closed) |

### API Endpoints
```
GET    /api/crew/leads              - List crew leads
POST   /api/crew/leads              - Create crew lead
GET    /api/crew/leads/:id          - Get crew lead
PUT    /api/crew/leads/:id          - Update crew lead

GET    /api/crew/members/:leadId    - Members under a lead
POST   /api/crew/members            - Add crew member
PUT    /api/crew/members/:id        - Update member

POST   /api/crew/time-entries       - Log time entry
GET    /api/crew/time-entries/:leadId - Time entries for a lead
PUT    /api/crew/time-entries/:id/approve - Approve time entry

POST   /api/crew/job-notes          - Create job note
GET    /api/crew/job-notes/:leadId  - Notes by crew lead
POST   /api/crew/job-notes/:id/send - Send note to owner/admin

POST   /api/crew/incidents          - Report incident
GET    /api/crew/incidents          - List incidents
PUT    /api/crew/incidents/:id/resolve - Resolve incident
```

### Frontend Pages
| Page | Route | Purpose |
|------|-------|---------|
| Crew Lead | `/crew-lead` | Crew lead dashboard (time, notes, incidents) |
| Project Manager | `/project-manager` | Project management view |

### Frontend Components
| Component | File | Purpose |
|-----------|------|---------|
| Crew Management Card | `client/src/components/crew-management-card.tsx` | Admin crew overview |
| Team Management Card | `client/src/components/team-management-card.tsx` | Team roster management |

---

## 9. AI Credits System

### Cost Structure (`server/aiCredits.ts`)
| Action | Cost (cents) | Description |
|--------|-------------|-------------|
| `chat_response` | 5 | AI chat response |
| `photo_analysis` | 10 | Photo analysis via GPT-4o |
| `voice_response` | 8 | ElevenLabs TTS response |
| `document_analysis` | 15 | Document analysis |
| `live_translation_minute` | 50 | STT + translation + TTS per minute |
| `measure_scan` | 5 | Room measurement scan |
| `color_match` | 8 | Color matching from camera |
| `room_visualizer` | 10 | Visualize colors on walls |
| `complete_estimate` | 15 | Generate complete estimate package |

### Credit Packs (One-Time Purchase)
| Pack | Price | Price ID | Product ID |
|------|-------|----------|------------|
| Starter | $10 | `price_1SlCL0PQpkkF93FKHmRequxm` | `prod_TidcHchxkxT0mS` |
| Value | $25 | `price_1SlCL1PQpkkF93FKC8Sj886m` | `prod_Tidc5VTXha0kjm` |
| Pro | $50 | `price_1SlCL2PQpkkF93FKq3WySCsz` | `prod_TidcfZac0yw1Wd` |
| Business | $100 | `price_1SlCL3PQpkkF93FKSwtcdiLH` | `prod_TidcknVUI06OGI` |

### Subscription Tiers (Recurring) - defined in `server/aiCredits.ts`
These are the SaaS subscription tiers for the platform (used by `SUBSCRIPTION_TIERS` constant). Note: the same Full Suite and Franchise price IDs are also referenced in tenant provisioning (`server/tenant-provisioning.ts`) as the "professional" and "enterprise" platform tiers respectively.

| Tier | Monthly | Annual | Monthly Price ID | Annual Price ID | Product ID |
|------|---------|--------|-----------------|----------------|------------|
| Estimator Only | $29/mo | $290/yr | `price_1SlCL4PQpkkF93FKJ5F9y9sC` | `price_1SlCL4PQpkkF93FKVaopUqqO` | `prod_TidcZLYvHjoGku` |
| Full Suite | $199/mo | $1,990/yr | `price_1SlCL5PQpkkF93FKe0aUduOg` | `price_1SlCL5PQpkkF93FKYh5D4Tj7` | `prod_TidcccTbdU7gJT` |
| Franchise | $499/mo | $4,990/yr | `price_1SlCL6PQpkkF93FKuFz2kDcu` | `price_1SlCL6PQpkkF93FKTKOkcU9A` | `prod_TidcGbEKJECTYU` |

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tenantCredits` | Credit balance per tenant | tenantId, balanceCents, totalPurchasedCents, totalUsedCents, lowBalanceThresholdCents, stripeCustomerId |
| `aiUsageLogs` | Every AI action logged | tenantId, userId, actionType, costCents, inputTokens, outputTokens, model, balanceAfterCents |
| `creditPurchases` | Purchase history | tenantId, amountCents, stripePaymentIntentId, stripeSessionId, paymentStatus, packType |

### API Endpoints
```
GET    /api/credits/balance          - Get current credit balance
POST   /api/credits/deduct           - Deduct credits for action
POST   /api/credits/checkout         - Create Stripe checkout for credit pack
GET    /api/credits/usage            - Usage history
GET    /api/credits/usage/summary    - Usage summary by action type
```

### Frontend Pages
| Page | Route | Purpose |
|------|-------|---------|
| Credits Dashboard | `/credits` | Balance, usage history, purchase packs |
| Credits Success | `/credits/success` | Post-purchase confirmation |
| Credits Cancel | `/credits/cancel` | Purchase cancelled page |

---

## 10. Payment Processing

### Stripe Integration (`server/stripeClient.ts`)
**Hybrid credential management:**
1. First checks for `STRIPE_LIVE_SECRET_KEY` + `STRIPE_LIVE_PUBLISHABLE_KEY` environment secrets
2. Falls back to Replit managed Stripe connection (sandbox)
3. Uses `getUncachableStripeClient()` to always get fresh client (never cached)

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `payments` | Payment records | tenantId, estimateId, amount, paymentMethod (stripe/coinbase/cash/check), status (pending/processing/completed/failed/refunded), stripePaymentIntentId |

### API Endpoints
```
POST   /api/payments                 - Create payment
GET    /api/payments                 - List payments
GET    /api/payments/:id             - Get payment
PUT    /api/payments/:id/status      - Update payment status
POST   /api/payments/stripe/checkout - Create Stripe checkout session
POST   /api/payments/stripe/webhook  - Stripe webhook handler
GET    /api/stripe/publishable-key   - Get publishable key for frontend
```

### Frontend Pages
| Page | Route | Purpose |
|------|-------|---------|
| Pay | `/pay/:estimateId` | Customer payment page for estimate |
| Pricing | `/pricing` | Subscription pricing display |

---

## 11. Email Service (Resend)

### Integration (`server/resend.ts`)
- Uses Replit connector for secure API key management
- Fetches credentials via Replit Connectors API
- Default sender: `PaintPros.io <onboarding@resend.dev>`

### Email Functions
| Function | Purpose | Recipient |
|----------|---------|-----------|
| `sendContactEmail(data)` | Contact form submissions | `CONTACT_EMAIL` or `service@nashpaintpros.io` |
| `sendContractorApplicationEmail(data)` | Contractor applications | NPP service email |
| `sendLeadNotificationEmail(data)` | New lead notifications | Tenant admin email |

### API Endpoints
```
POST   /api/contact                  - Send contact form email
POST   /api/contractor-application   - Send contractor application email
```

---

## 12. Follow-Up Automation

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `followupSequences` | Sequence definitions | tenantId, name, triggerType (estimate_sent/no_response/proposal_viewed), isActive |
| `followupSteps` | Steps within sequences | sequenceId, stepOrder, delayDays, channel (email/sms), subject, content |
| `followupLogs` | Execution log | tenantId, sequenceId, stepId, leadId, status (pending/sent/failed/cancelled), scheduledFor, sentAt |
| `estimateFollowups` | Estimate-specific followups | estimateId, tenantId, followupType, scheduledDate, completedDate, status, notes |

### How It Works
1. A trigger event occurs (estimate sent, proposal viewed, no response after X days)
2. System looks up matching `followupSequences` for the tenant
3. Creates `followupLogs` entries for each step with `scheduledFor` timestamps
4. Background job checks for pending followups and executes them via email/SMS
5. Logs status (sent/failed) for each step

### API Endpoints
```
GET    /api/followup-sequences       - List sequences
POST   /api/followup-sequences       - Create sequence
PUT    /api/followup-sequences/:id   - Update sequence
GET    /api/followup-sequences/:id/steps - Get steps
POST   /api/followup-steps           - Add step to sequence

GET    /api/estimate-followups/:estimateId - Followups for estimate
POST   /api/estimate-followups       - Create estimate followup
PUT    /api/estimate-followups/:id   - Update followup status
GET    /api/estimate-followups/pending - All pending followups
```

---

## 13. Referral Program

### Database Table: `referralProgram`
```
tenantId, referrerName, referrerEmail, referrerPhone,
referredName, referredEmail, referredPhone,
status (pending/contacted/converted/paid),
rewardType (cash/discount/credit), rewardAmount,
jobId (linked job if converted), paidAt
```

### API Endpoints
```
POST   /api/referrals               - Create referral
GET    /api/referrals               - List referrals
PUT    /api/referrals/:id/status    - Update referral status
PUT    /api/referrals/:id/pay       - Mark reward as paid
```

---

## 14. Inventory Management

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `inventoryItems` | Stock items | tenantId, name, category (paint/primer/supplies/equipment), brand, sku, currentQuantity, unit, reorderPoint, costPerUnit, supplier |
| `inventoryTransactions` | Stock movements | tenantId, itemId, transactionType (purchase/usage/adjustment/return), quantity, jobId, notes |

### API Endpoints
```
GET    /api/inventory               - List inventory items
POST   /api/inventory               - Add inventory item
PUT    /api/inventory/:id           - Update item
GET    /api/inventory/:id/transactions - Transaction history
POST   /api/inventory/transactions  - Log transaction
GET    /api/inventory/low-stock     - Items below reorder point
```

---

## 15. Subcontractor Management

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `subcontractors` | Subcontractor registry | tenantId, companyName, contactName, email, phone, specialty, licenseNumber, insuranceExpiry, hourlyRate, dayRate, rating, totalJobs |
| `subcontractorAssignments` | Job assignments | tenantId, subcontractorId, jobId, startDate, endDate, agreedRate, rateType (hourly/daily/fixed), status |

### API Endpoints
```
GET    /api/subcontractors           - List subcontractors
POST   /api/subcontractors           - Add subcontractor
PUT    /api/subcontractors/:id       - Update subcontractor
POST   /api/subcontractors/assign    - Assign to job
GET    /api/subcontractors/:id/assignments - View assignments
```

---

## 16. Customer Portal & Jobs

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `jobs` | Active jobs | tenantId, estimateId, leadId, customerName, address, status (scheduled/in_progress/completed/invoiced), startDate, completionDate, assignedCrewLead |
| `portfolioEntries` | Before/after gallery | tenantId, jobId, title, projectType, beforePhotoUrl, afterPhotoUrl, colorUsed, brandUsed, isFeatured, customerTestimonial |
| `warranties` | Job warranties | tenantId, jobId, warrantyType, startDate, expirationDate, terms, status |

### API Endpoints
```
GET    /api/jobs                     - List jobs
POST   /api/jobs                     - Create job
GET    /api/jobs/:id                 - Get job
PUT    /api/jobs/:id                 - Update job
PUT    /api/jobs/:id/status          - Update job status

GET    /api/portfolio                - Portfolio entries
POST   /api/portfolio                - Create portfolio entry
PUT    /api/portfolio/:id            - Update entry

GET    /api/warranties               - List warranties
POST   /api/warranties               - Create warranty
```

---

## 17. AI-Powered Tools

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `photoAnalyses` | AI photo analysis results | tenantId, imageUrl, imageType, estimatedSqft, roomType, surfacesDetected, conditionNotes, colorSuggestions, aiModel, confidence |
| `aiProposals` | AI-generated proposals | tenantId, estimateId, customerName, projectScope, generatedContent, executiveSummary, scopeOfWork, status |
| `chatSessions` | Live chat sessions | tenantId, visitorId, visitorName, status (active/closed/converted), convertedToLead, leadId |
| `chatMessages` | Chat messages | sessionId, senderType (visitor/agent/bot), content, messageType |

### AI Features Available
- **Photo Analysis:** Upload room/exterior photos → GPT-4o analyzes surfaces, estimates sqft, suggests colors
- **AI Proposal Writer:** Generate professional proposals from estimate data
- **Live Translator:** Real-time English/Spanish translation (STT + translation + TTS)
- **Voice-to-Estimate:** Speak project details, AI creates estimate
- **Smart Lead Scoring:** AI scores leads based on engagement data
- **Follow-up Optimizer:** AI suggests optimal follow-up timing and messaging

---

## 18. Call Tracking & Marketing Attribution

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `callTrackingNumbers` | Tracked phone numbers | tenantId, phoneNumber, source, campaign, forwardTo, isActive |
| `marketingChannels` | Channel definitions | tenantId, name, channelType, source, medium |
| `marketingAttribution` | Revenue attribution | tenantId, channelId, periodStart, impressions, clicks, leads, conversions, revenue, spend |

---

## 19. QuickBooks Export

### Database Table: `accountingExports`
```
tenantId, exportType (invoices/payments/expenses),
exportFormat (csv/json/qbo),
dateRangeStart, dateRangeEnd, recordCount,
fileUrl, fileName, status (pending/processing/completed/failed)
```

---

## 20. Franchise Management

### Database Table: `franchises`
```
franchiseId, tenantId, companyName, ownerName,
territory (JSON array of cities/regions),
monthlyFee, setupFee, status (pending/active/suspended),
parentTenantId (for hierarchy)
```

---

## 21. Blog System

### Features
- Multi-tenant blog with GPT-4o powered post generation
- SEO optimization with meta tags and structured data
- Categories and tags per tenant
- Draft/published/scheduled status workflow

### Frontend Page
| Page | Route | Purpose |
|------|-------|---------|
| Blog | `/blog` | Blog listing and individual posts |

---

## 22. Command Center

### Access
- **Route:** `/command-center`
- **PIN Access:** Role-based PIN authentication (Admin PIN: 4444)
- **Roles:** Admin, Owner, Developer, Crew Lead

### Dashboard Sections (8 Categories)
Each section is a glassmorphism card with photorealistic background and horizontal carousel:
1. **Operations** - Crew management, time tracking, scheduling
2. **Sales** - CRM deals, estimates, proposals
3. **Marketing** - Content hub, social media, ad campaigns
4. **Analytics** - Traffic, performance, attribution
5. **Finance** - Payments, invoices, credits
6. **Customers** - Portal, reviews, referrals
7. **Team** - Crew leads, members, incidents
8. **Settings** - Tenant config, integrations, tools

---

## 23. Royalty Ledger System

### Purpose
Tracks revenue, expenses, and payouts for profit sharing (50% split).

### Products Tracked
| Code | Name | Domain |
|------|------|--------|
| `paintpros` | PaintPros.io | paintpros.io |
| `brewandboard` | Brew and Board | brewandboard.coffee |
| `orbitstaffing` | Orbit Staffing | orbitstaffing.io |
| `shared` | Shared/Combined | N/A |

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `royaltyRevenue` | Revenue entries | productCode, revenueType (saas_subscription/saas_setup/nashville_paycheck), amount, periodStart, periodEnd, stripePaymentId |

### Frontend Page
| Page | Route | Purpose |
|------|-------|---------|
| Royalty Dashboard | `/royalty-dashboard` | Revenue/expense tracking |

---

## 24. Trial System

### Database Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `trialTenants` | Self-service trials | ownerEmail, companyName, companySlug, status, estimatesUsed, leadsUsed, blockchainStampsUsed, onboardingStep |
| `trialUsageLog` | Trial activity tracking | trialTenantId, action (estimate_created/lead_captured/stamp_used/page_view), resourceType, resourceId |

### Trial Flow
1. User signs up at `/start-trial`
2. System creates `trialTenant` with usage limits
3. User accesses trial portal at `/trial/:slug`
4. Usage tracked in `trialUsageLog`
5. Upgrade available at `/trial/:slug/upgrade`
6. On payment, converts to full `tenant` record

---

## 25. Environment Variables & Secrets

### Required Secrets
| Secret | Purpose |
|--------|---------|
| `STRIPE_LIVE_SECRET_KEY` | Stripe live API key |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Stripe publishable key |
| `ELEVENLABS_API_KEY` | Text-to-speech |
| `VITE_FIREBASE_API_KEY` | Firebase Auth (frontend) |
| `VITE_FIREBASE_APP_ID` | Firebase Auth (frontend) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Auth (frontend) |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `VAPID_PUBLIC_KEY` | Push notifications |
| `VAPID_PRIVATE_KEY` | Push notifications |
| `DARKWAVE_API_KEY` | DarkWave ecosystem API |
| `DARKWAVE_API_SECRET` | DarkWave ecosystem secret |
| `ORBIT_ECOSYSTEM_API_KEY` | Orbit ecosystem sync |
| `ORBIT_ECOSYSTEM_API_SECRET` | Orbit ecosystem secret |
| `ORBIT_FINANCIAL_HUB_SECRET` | Orbit financial integration |
| `PAINTPROS_WEBHOOK_SECRET` | Webhook verification |
| `INSTAGRAM_APP_SECRET` | Instagram OAuth |

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_TENANT_ID` | Active tenant for frontend |
| `CONTACT_EMAIL` | Override contact form recipient |
| `META_APP_ID` / `FACEBOOK_APP_ID` | Meta OAuth app ID |
| `META_APP_SECRET` / `FACEBOOK_APP_SECRET` | Meta OAuth app secret |
| `TWITTER_API_KEY` | Twitter/X OAuth |
| `TWITTER_API_SECRET` | Twitter/X OAuth |
| `TWITTER_ACCESS_TOKEN` | Twitter/X posting |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter/X posting |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 |

---

## 26. Key Frontend Routes Summary

### Public-Facing
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Tenant-specific home page |
| `/services` | Services | Service listings |
| `/portfolio` | Portfolio | Before/after gallery |
| `/estimate` | Estimate | Customer estimate form |
| `/book` | Book | Online booking wizard |
| `/reviews` | Reviews | Customer reviews |
| `/about` | About | Company info |
| `/contact` | Contact | Contact form |
| `/blog` | Blog | Blog listing |
| `/pricing` | Pricing | Subscription pricing |
| `/colors` | Color Library | Paint color browser |
| `/faq` | FAQ | Frequently asked questions |

### Admin/Management
| Route | Page | Purpose |
|-------|------|---------|
| `/command-center` | Command Center | Central admin dashboard |
| `/admin` | Admin | Admin panel |
| `/owner` | Owner | Owner dashboard |
| `/developer` | Developer | Developer tools |
| `/crew-lead` | Crew Lead | Crew management |
| `/project-manager` | Project Manager | Project tracking |
| `/marketing` or `/marketing-hub` | Marketing Hub | Content + social management |
| `/ops` | OpsAI | Operations AI tools |
| `/estimator-config` | Estimator Config | Pricing configuration |

### Marketing & Autopilot
| Route | Page | Purpose |
|-------|------|---------|
| `/autopilot` | Marketing Autopilot | Autopilot landing/signup |
| `/autopilot/onboarding` | Onboarding | Setup wizard |
| `/autopilot/portal` | Portal | Subscriber dashboard |
| `/autopilot/dashboard` | Dashboard | Analytics |
| `/autopilot/admin` | Admin | Manage all subscribers |

### Financial
| Route | Page | Purpose |
|-------|------|---------|
| `/credits` | Credits Dashboard | AI credit balance/purchase |
| `/pay/:estimateId` | Payment | Customer payment page |
| `/royalty-dashboard` | Royalty | Revenue/expense tracking |

### Trial & Onboarding
| Route | Page | Purpose |
|-------|------|---------|
| `/start-trial` | Trial Signup | Self-service trial |
| `/trial/:slug` | Trial Portal | Trial user dashboard |
| `/onboarding` | Onboarding | New customer onboarding |
| `/start` | Start | Getting started guide |

---

## 27. Data Flow Patterns

### Lead → Estimate → Proposal → Job → Payment
1. Lead captured via estimate form, contact form, or chat widget
2. Estimate created with room measurements and pricing
3. Proposal generated (optionally AI-powered) from estimate
4. Customer signs proposal via e-signature
5. Job created from accepted proposal
6. Payment collected via Stripe checkout
7. Follow-up sequences triggered at each stage
8. Portfolio entry created from completed job

### Marketing Content Flow
1. Content created in `contentLibrary` or `marketingPosts`
2. Images uploaded to `marketingImages` with categories
3. Posting schedule configured in `autoPostingSchedule`
4. Scheduler picks least-used content at configured times
5. Posts to Facebook, Instagram, and Twitter/X via respective APIs
6. Post results logged in `scheduledPosts` with external IDs
7. Insights fetched periodically via Meta Graph API

### Tenant Provisioning Flow
1. Prospect fills out onboarding form
2. Stripe customer created with company metadata
3. Tenant record inserted with `status: "provisioning"`
4. Stripe Checkout session created with tier-appropriate pricing
5. Payment webhook fires on success
6. Tenant activated, synced to Orbit ecosystem
7. Sample data seeded for immediate use

---

## 28. Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ PaintPros│ │   NPP    │ │  TLID    │ │ TradeWorksAI │   │
│  │  Home    │ │ Ecosystem│ │ Marketing│ │  Field Tools │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       └─────────────┴────────────┴──────────────┘           │
│                         │ TanStack Query                     │
├─────────────────────────┼───────────────────────────────────┤
│                    EXPRESS.JS API                             │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  CRM    │ │Calendar │ │Marketing │ │   AI Credits     │ │
│  │ Routes  │ │ Routes  │ │ Routes   │ │   Routes         │ │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────────┬─────────┘ │
│       └───────────┴───────────┴────────────────┘            │
│                         │ IStorage Interface                 │
├─────────────────────────┼───────────────────────────────────┤
│                   STORAGE LAYER                              │
│                    (server/storage.ts)                        │
│                         │ Drizzle ORM                        │
├─────────────────────────┼───────────────────────────────────┤
│                   POSTGRESQL (Neon)                           │
│                   All Business Tables                        │
├─────────────────────────────────────────────────────────────┤
│                 BACKGROUND SERVICES                          │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────────────┐ │
│  │ NPP Post   │ │ NPP Ad     │ │ DarkWave Unified        │ │
│  │ Scheduler  │ │ Scheduler  │ │ Scheduler (15 tenants)  │ │
│  └────────────┘ └────────────┘ └─────────────────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────────────┐ │
│  │ Autopilot  │ │ Follow-up  │ │ Calendar Reminder       │ │
│  │ Engine     │ │ Processor  │ │ Processor               │ │
│  └────────────┘ └────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 EXTERNAL SERVICES                            │
│  Meta Graph API │ Stripe │ OpenAI │ ElevenLabs │ Resend    │
│  Twitter/X API  │ Firebase │ Google APIs │ Orbit Ecosystem │
└─────────────────────────────────────────────────────────────┘
```

---

## 29. Storage Interface Reference

All database operations go through `server/storage.ts` via the `IStorage` interface. Key method groups:

### Tenant Operations
```typescript
getTenant(id: string): Promise<Tenant | undefined>
```

### User Operations
```typescript
getUser(id: string): Promise<User | undefined>
upsertUser(userData: UpsertUser): Promise<User>
getUserByEmail(email: string): Promise<User | undefined>
updateUserRole(id: string, role: string, tenantId?: string): Promise<User | undefined>
getUsersByTenant(tenantId: string): Promise<User[]>
setPasswordResetToken(email, token, expires): Promise<boolean>
getUserByResetToken(token): Promise<User | undefined>
updateUserPassword(userId, passwordHash): Promise<boolean>
```

### Lead/Estimate Operations
```typescript
createLead(lead): Promise<Lead>
getLeadById(id): Promise<Lead | undefined>
getLeadByEmail(email): Promise<Lead | undefined>
getLeads(): Promise<Lead[]>
searchLeads(query): Promise<Lead[]>
createEstimate(estimate): Promise<Estimate>
getEstimateById(id): Promise<Estimate | undefined>
getEstimatesByLeadId(leadId): Promise<Estimate[]>
getEstimates(): Promise<Estimate[]>
createEstimateRequest(request): Promise<EstimateRequest>
getEstimateRequests(): Promise<EstimateRequest[]>
updateEstimateRequestStatus(id, status): Promise<EstimateRequest | undefined>
```

### CRM Operations
```typescript
createCrmDeal(deal): Promise<CrmDeal>
getCrmDeals(): Promise<CrmDeal[]>
getCrmDealById(id): Promise<CrmDeal | undefined>
getCrmDealsByStage(stage): Promise<CrmDeal[]>
updateCrmDeal(id, updates): Promise<CrmDeal | undefined>
deleteCrmDeal(id): Promise<void>
getCrmPipelineSummary(): Promise<{ stage, count, totalValue }[]>
createCrmActivity(activity): Promise<CrmActivity>
getCrmActivitiesByEntity(entityType, entityId): Promise<CrmActivity[]>
getAllCrmActivities(): Promise<CrmActivity[]>
createCrmNote(note): Promise<CrmNote>
getCrmNotesByEntity(entityType, entityId): Promise<CrmNote[]>
updateCrmNote(id, content): Promise<CrmNote | undefined>
deleteCrmNote(id): Promise<void>
```

### Calendar Operations
```typescript
createCalendarEvent(event): Promise<CalendarEvent>
getCalendarEvents(tenantId, start?, end?): Promise<CalendarEvent[]>
getCalendarEventById(id): Promise<CalendarEvent | undefined>
updateCalendarEvent(id, updates): Promise<CalendarEvent | undefined>
deleteCalendarEvent(id): Promise<void>
createCalendarReminder(reminder): Promise<CalendarReminder>
getCalendarRemindersByEvent(eventId): Promise<CalendarReminder[]>
```

### Analytics Operations
```typescript
trackPageView(view): Promise<PageView>
getPageViews(startDate?, endDate?): Promise<PageView[]>
getLiveVisitorCount(): Promise<number>
getLiveVisitorCountByTenant(tenantId): Promise<number>
getAnalyticsDashboard(): Promise<DashboardData>
getAnalyticsDashboardByTenant(tenantId): Promise<DashboardData>
getGeographicBreakdown(startDate, endDate, tenantId?): Promise<GeoData[]>
```

### Proposal Operations
```typescript
createProposalTemplate(template): Promise<ProposalTemplate>
getProposalTemplates(): Promise<ProposalTemplate[]>
createProposal(proposal): Promise<Proposal>
getProposals(): Promise<Proposal[]>
updateProposalStatus(id, status): Promise<Proposal | undefined>
createProposalSignature(signature): Promise<ProposalSignature>
getProposalSignature(proposalId): Promise<ProposalSignature | undefined>
```

### Payment Operations
```typescript
createPayment(payment): Promise<Payment>
getPayments(): Promise<Payment[]>
getPaymentById(id): Promise<Payment | undefined>
updatePaymentStatus(id, status, processorId?): Promise<Payment | undefined>
markPaymentComplete(id): Promise<Payment | undefined>
```

### PIN/Auth Operations
```typescript
getUserPinByRole(role): Promise<UserPin | undefined>
getUserPinByPin(pin): Promise<UserPin | undefined>
createOrUpdateUserPin(data): Promise<UserPin>
updateUserPin(role, pin, mustChangePin): Promise<UserPin | undefined>
```

---

## 30. Critical Implementation Notes

### For Recreating the System
1. **Start with `shared/schema.ts`** - All 194 table definitions are the source of truth
2. **Storage layer first** - Implement `IStorage` interface before writing routes
3. **Routes are thin** - All business logic goes through storage interface
4. **Zod validation** - Every insert schema is auto-generated from Drizzle schema via `drizzle-zod`
5. **Multi-tenant everything** - Every query MUST filter by `tenantId`
6. **Background schedulers** - Start them in `server/index.ts` after server boot
7. **Meta tokens expire** - Long-lived tokens last 60 days; implement refresh logic
8. **Stripe webhooks** - Handle `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`

### Security Notes
- PIN-based access control for Command Center roles
- Firebase Authentication for user accounts
- WebAuthn/FIDO2 support for biometric login
- All API keys stored as Replit secrets (never in code)
- IP hashing for analytics privacy
- Stripe webhook signature verification

### Performance Notes
- Analytics summary table caches daily computations
- Live visitor count uses 5-minute window on `pageViews.createdAt`
- Content selection uses usage-count ordering (least-used first) for rotation
- City key cache for Meta geo lookups (in-memory Map)
- X/Twitter rate limiting with per-session post counter

---

*Document generated: February 2026*
*Platform version: PaintPros.io Multi-Tenant SaaS v2.x*
