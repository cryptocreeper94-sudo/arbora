# VERDARA (App #28) — Full Backend Handoff Document
## DarkWave Trust Layer Ecosystem
**Generated:** February 2026
**Status:** Production-ready, live on Replit

---

## 1. OVERVIEW

Verdara is a comprehensive AI-powered outdoor recreation super-app and App #28 in the DarkWave Trust Layer (DWTL) ecosystem. It integrates nature identification, outdoor activity planning and tracking, arborist business management, a wood economy marketplace, trip planning, wild edibles/natural medicine, real-time chat, a blog CMS, and a location catalog. Verdara is designed as a mobile-first PWA with offline caching and aims to be the leading non-governmental reference for outdoor recreation in the US.

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion, Wouter, TanStack React Query |
| Backend | Express.js 5, TypeScript, tsx runtime |
| Database | PostgreSQL (Neon-backed via Replit), Drizzle ORM |
| Auth | Custom email/password (bcryptjs, 12 rounds), cookie-based sessions, Resend email verification |
| Payments | Stripe Checkout, Stripe Webhooks, subscription tiers |
| AI | OpenAI GPT-4o (Vision API for species identification, text generation for blog) |
| Maps | Leaflet + React-Leaflet (interactive maps for trails and catalog) |
| Weather | Open-Meteo API (live weather widget) |
| Email | Resend (transactional email delivery) |
| Real-time | WebSocket (ws) for Signal Chat |
| PWA | Service worker with offline caching (v3) |

---

## 3. PROJECT STRUCTURE

```
/
├── client/
│   └── src/
│       ├── App.tsx                    # Root router — Verdara + Arbora routing
│       ├── components/
│       │   ├── app-layout.tsx         # Verdara main layout (sidebar + mobile tabs)
│       │   ├── arbora-layout.tsx      # Arbora standalone layout (navy/copper)
│       │   ├── bento-grid.tsx         # Bento grid dashboard component
│       │   ├── glass-card.tsx         # Glassmorphism card component
│       │   ├── leaflet-map.tsx        # Reusable Leaflet map
│       │   ├── living-catalog-banner.tsx  # Living catalog banner
│       │   ├── theme-provider.tsx     # Dark/light theme provider
│       │   ├── trust-badge.tsx        # TrustShield badge component
│       │   ├── weather-widget.tsx     # Live weather widget
│       │   └── ui/                    # Shadcn UI primitives
│       ├── hooks/
│       │   ├── use-auth.ts            # Auth context hook
│       │   └── use-toast.ts           # Toast notification hook
│       ├── lib/
│       │   ├── queryClient.ts         # TanStack Query + apiRequest helper
│       │   └── utils.ts              # cn() utility
│       └── pages/
│           ├── landing.tsx            # Public landing page
│           ├── explore.tsx            # Command Center / home dashboard
│           ├── dashboard.tsx          # User activity dashboard
│           ├── identify.tsx           # AI species identification
│           ├── trails.tsx             # Trail explorer with Leaflet maps
│           ├── catalog.tsx            # Location catalog listing
│           ├── catalog-detail.tsx     # Individual location detail
│           ├── marketplace.tsx        # Wood economy marketplace
│           ├── planner.tsx            # Trip planner
│           ├── arborist.tsx           # Arborist Pro module (legacy single-page)
│           ├── camping.tsx            # Camping guide
│           ├── fishing.tsx            # Fishing guide
│           ├── hunting.tsx            # Hunting guide
│           ├── climbing.tsx           # Climbing guide
│           ├── watersports.tsx        # Water sports guide
│           ├── winter.tsx             # Winter sports guide
│           ├── coastal.tsx            # Coastal guide
│           ├── desert.tsx             # Desert guide
│           ├── wetlands.tsx           # Wetlands guide
│           ├── caves.tsx              # Caves guide
│           ├── prairie.tsx            # Prairie guide
│           ├── mtb.tsx                # Mountain biking guide
│           ├── emobility.tsx          # E-mobility guide
│           ├── charters.tsx           # Charters guide
│           ├── public-lands.tsx       # Public lands directory
│           ├── survival.tsx           # Survival skills
│           ├── conservation.tsx       # Conservation guide
│           ├── foraging.tsx           # Wild edibles & natural medicine
│           ├── price-compare.tsx      # Gear price comparison
│           ├── signal-chat.tsx        # Real-time chat (WebSocket)
│           ├── developer-portal.tsx   # Developer portal & roadmap
│           ├── vault.tsx              # TrustVault media gallery
│           ├── pricing.tsx            # Subscription pricing page
│           ├── blog.tsx               # Blog listing
│           ├── blog-detail.tsx        # Blog post detail
│           ├── blog-admin.tsx         # Blog admin/editor
│           ├── auth.tsx               # Auth page (login/register)
│           ├── admin.tsx              # Admin panel
│           ├── track.tsx              # GPS activity tracking
│           ├── arbora-*.tsx           # 10 Arbora pages (see Arbora handoff)
│           └── not-found.tsx          # 404 page
├── server/
│   ├── index.ts                       # Server entry point
│   ├── routes.ts                      # All REST API routes (1,457 lines)
│   ├── storage.ts                     # IStorage interface + DatabaseStorage (842 lines)
│   ├── auth.ts                        # Auth routes + middleware (requireAuth, requireTier)
│   ├── trustlayer-sso.ts             # Trust Layer SSO + chat auth
│   ├── chat-ws.ts                    # WebSocket chat server
│   ├── ecosystem.ts                  # DW ecosystem routes (TrustShield, SIG, STAMP, TLID, Credits)
│   ├── garagebot.ts                  # GarageBot API proxy
│   ├── email.ts                      # Resend email service
│   ├── db.ts                         # Database connection (Drizzle + pg)
│   ├── seed.ts                       # Trail/campground seeding
│   ├── catalog-seed.ts               # Catalog location seeding (170+ US locations)
│   ├── seedChat.ts                   # Chat channel seeding
│   ├── static.ts                     # Static file serving
│   ├── vite.ts                       # Vite dev server integration
│   └── replit_integrations/          # Replit-managed integrations (OpenAI)
├── shared/
│   └── schema.ts                      # Drizzle schema + Zod validation (504 lines)
└── attached_assets/                   # Image assets
```

---

## 4. DATABASE SCHEMA (25 Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User accounts | id, email, password, username, displayName, subscriptionTier, stripeCustomerId, trustLayerId |
| `sessions` | Auth sessions | sid, sess, expire |
| `trails` | Trail listings | id, name, location, difficulty, distance, elevationGain, lat, lng, imageUrl |
| `identifications` | AI species IDs | id, userId, imageUrl, species, confidence, habitat, conservationStatus, funFacts |
| `marketplace_listings` | Marketplace products | id, userId, title, description, price, category, imageUrl, status |
| `trip_plans` | Trip plans | id, userId, title, destination, startDate, endDate, gearList, notes |
| `campgrounds` | Campground listings | id, name, location, pricePerNight, amenities, imageUrl, lat, lng |
| `activity_log` | User activity tracking | id, userId, type, distance, duration, calories, gpsTrack |
| `activity_locations` | GPS waypoints | id, activityId, lat, lng, elevation, timestamp |
| `arborist_clients` | Arborist client records | id, userId, name, email, phone, address, notes |
| `arborist_jobs` | Arborist job records | id, userId, clientId, title, description, status, scheduledDate, estimatedCost |
| `arborist_invoices` | Arborist invoices | id, userId, clientId, invoiceNumber, items (JSONB), subtotal, tax, total, status |
| `arborist_deals` | CRM deal pipeline | id, userId, clientId, title, value, stage, description, expectedCloseDate |
| `arborist_estimates` | Job estimates | id, userId, clientId, estimateNumber, items (JSONB), subtotal, tax, total, serviceType, treeSpecies |
| `arborist_crew_members` | Crew members | id, userId, firstName, lastName, email, phone, role, hourlyRate, isActive |
| `arborist_time_entries` | Time tracking | id, userId, crewMemberId, jobId, date, hoursWorked, overtimeHours, status |
| `arborist_inventory` | Inventory items | id, userId, name, category, sku, currentQuantity, unit, reorderPoint, costPerUnit, supplier |
| `catalog_locations` | Outdoor location catalog | id, name, slug, type, state, region, lat, lng, description, activities, imageUrl |
| `location_submissions` | User location submissions | id, userId, name, type, state, description, status |
| `campground_bookings` | Campground reservations | id, userId, campgroundId, checkIn, checkOut, guests, totalCost, status |
| `reviews` | User reviews/ratings | id, userId, targetType, targetId, rating, comment |
| `chat_users` | Chat user accounts | id, username, passwordHash, trustLayerId, displayName |
| `chat_channels` | Chat channels | id, name, description, channelType |
| `chat_messages` | Chat messages | id, channelId, userId, content, messageType |
| `blog_posts` | Blog content | id, title, slug, content, excerpt, category, author, imageUrl, seoKeywords, published |

---

## 5. API ROUTES (90+ Endpoints)

### Authentication (`server/auth.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user (email + password) |
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/logout` | Auth | Logout (clear session) |
| GET | `/api/auth/me` | Auth | Get current user |
| GET | `/api/auth/verify` | Public | Verify email token |
| POST | `/api/auth/resend-verification` | Auth | Resend verification email |

### Trust Layer SSO (`server/trustlayer-sso.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat/auth/register` | Public | Register chat user with Trust Layer ID |
| POST | `/api/chat/auth/login` | Public | Login chat user |
| GET | `/api/chat/auth/me` | ChatAuth | Get chat user profile |
| GET | `/api/chat/channels` | Public | List chat channels |

### Core Verdara (`server/routes.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trails` | Public | List all trails |
| GET | `/api/trails/featured` | Public | Featured trails |
| GET | `/api/trails/search` | Public | Search trails |
| GET | `/api/trails/:id` | Public | Trail detail |
| GET | `/api/stats` | Public | App statistics |
| GET | `/api/marketplace` | Public | Marketplace listings |
| GET | `/api/marketplace/:id` | Public | Listing detail |
| POST | `/api/marketplace` | Craftsman Pro | Create listing |
| DELETE | `/api/marketplace/:id` | Auth | Delete listing |
| GET | `/api/user/listings` | Auth | User's listings |
| GET | `/api/campgrounds` | Public | List campgrounds |
| GET | `/api/user/identifications` | Auth | User's AI IDs |
| GET/POST | `/api/user/trips` | Auth | Trip plans CRUD |
| PATCH/DELETE | `/api/user/trips/:id` | Auth | Update/delete trip |
| GET/POST | `/api/user/activity` | Auth | Activity tracking |
| GET | `/api/user/stats` | Auth | User stats |
| GET | `/api/activities` | Public | Activity locations |
| GET | `/api/activities/:id` | Public | Activity detail |
| POST | `/api/identify` | Auth | AI species identification |

### Catalog
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/catalog` | Public | List locations (paginated, filterable) |
| GET | `/api/catalog/count` | Public | Total location count |
| GET | `/api/catalog/nearby` | Public | Proximity search |
| GET | `/api/catalog/slug/:slug` | Public | Location by slug |
| GET | `/api/catalog/:id` | Public | Location by ID |
| POST | `/api/catalog` | Auth | Add location |
| PATCH | `/api/catalog/:id` | Auth | Update location |
| DELETE | `/api/catalog/:id` | Auth | Delete location |

### Campground Bookings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookings` | Auth | User's bookings |
| POST | `/api/bookings` | Auth | Create booking |
| PATCH | `/api/bookings/:id` | Auth | Update booking |
| DELETE | `/api/bookings/:id` | Auth | Cancel booking |

### Location Submissions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/submissions` | Auth | User's submissions |
| POST | `/api/submissions` | Auth | Submit new location |
| PATCH | `/api/submissions/:id` | Auth | Update submission |

### Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reviews/:targetType/:targetId` | Public | Get reviews for target |
| POST | `/api/reviews` | Auth | Create review |

### Subscriptions & Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/subscriptions/tiers` | Public | List subscription tiers |
| POST | `/api/subscriptions/create-checkout` | Auth | Create Stripe checkout session |
| POST | `/api/webhooks/stripe` | Public | Stripe webhook handler |
| POST | `/api/checkout/create-session` | Auth | Marketplace checkout session |
| GET | `/api/checkout/session/:sessionId` | Auth | Get checkout session details |

### Blog
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/blog` | Public | List blog posts |
| GET | `/api/blog/count` | Public | Blog post count |
| GET | `/api/blog/:slug` | Public | Blog post by slug |
| POST | `/api/blog` | Craftsman Pro | Create blog post |
| PATCH | `/api/blog/:id` | Craftsman Pro | Update blog post |
| DELETE | `/api/blog/:id` | Craftsman Pro | Delete blog post |
| POST | `/api/blog/ai-generate` | Craftsman Pro | AI-generate blog content |

### Arborist (shared backend — see Arbora handoff for full CRUD)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| CRUD | `/api/arborist/clients` | Arborist Starter | Client management |
| CRUD | `/api/arborist/jobs` | Arborist Starter | Job management |
| CRUD | `/api/arborist/invoices` | Arborist Starter | Invoice management |
| CRUD | `/api/arborist/deals` | Arborist Starter | CRM pipeline |
| CRUD | `/api/arborist/estimates` | Arborist Starter | Estimates |
| CRUD | `/api/arborist/crew` | Arborist Starter | Crew management |
| CRUD | `/api/arborist/time-entries` | Arborist Starter | Time tracking |
| CRUD | `/api/arborist/inventory` | Arborist Starter | Inventory management |

### GarageBot (`server/garagebot.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/garagebot/equipment` | Auth | List equipment |
| GET | `/api/garagebot/equipment/:id` | Auth | Equipment detail + service history |
| GET | `/api/garagebot/maintenance-alerts` | Auth | Maintenance alerts |
| POST | `/api/garagebot/equipment` | Auth | Register equipment |
| PATCH | `/api/garagebot/equipment/:id` | Auth | Update equipment |

### Ecosystem (`server/ecosystem.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ecosystem/trustshield/score/:projectId` | Public | TrustShield score |
| GET | `/api/ecosystem/trustshield/tiers` | Public | TrustShield tiers |
| GET/POST | `/api/ecosystem/trustshield/certifications` | Auth | Certifications |
| GET | `/api/ecosystem/sig/tiers` | Public | Signal token tiers |
| GET | `/api/ecosystem/sig/stats` | Public | SIG stats |
| POST | `/api/ecosystem/sig/checkout` | Auth | Purchase SIG tokens |
| GET | `/api/ecosystem/sig/purchases` | Auth | SIG purchase history |
| GET | `/api/ecosystem/vault/balance` | Auth | Vault balance |
| POST | `/api/ecosystem/vault/transfer` | Auth | Vault transfer |
| POST | `/api/ecosystem/vault/gate` | Auth | Vault gating |
| POST | `/api/ecosystem/stamp` | Auth | Create DW-STAMP |
| GET | `/api/ecosystem/stamp/:stampId` | Public | Get stamp |
| GET | `/api/ecosystem/stamps/verdara` | Public | Verdara stamps |
| GET | `/api/ecosystem/tlid/search/:name` | Public | TLID search |
| GET | `/api/ecosystem/tlid/stats` | Public | TLID stats |
| GET | `/api/ecosystem/credits/balance` | Auth | Credits balance |
| GET | `/api/ecosystem/credits/packages` | Public | Credit packages |
| GET | `/api/ecosystem/credits/transactions` | Auth | Credit history |
| POST | `/api/ecosystem/credits/purchase` | Auth | Purchase credits |

### TrustHome Ecosystem API (`server/ecosystem.ts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ecosystem/identify` | HMAC | Species identification for TrustHome |
| POST | `/api/ecosystem/removal-plan` | HMAC | Tree removal plan generation |
| POST | `/api/ecosystem/assess` | HMAC | Property tree assessment |
| GET | `/api/ecosystem/species/:id` | HMAC | Species details |
| POST | `/api/ecosystem/sync-user` | HMAC | SSO user sync |

---

## 6. SUBSCRIPTION TIERS

| Tier | Level | Price | Key Features |
|------|-------|-------|-------------|
| Free Explorer | 0 | Free | Browse catalog, basic trails, community, 3 AI IDs/month |
| Outdoor Explorer | 1 | $19.99/yr | Unlimited AI ID, trip planner, price compare, wild edibles, TrustVault |
| Craftsman Pro | 2 | $29.99/yr | Marketplace selling, blog publishing, DW-STAMP certs, priority support |
| Arborist Starter | 3 | $49/mo | Up to 25 clients, job scheduling, invoicing, GarageBot, Arbora access |
| Arborist Business | 4 | $99/mo | Unlimited clients, teams, TrustShield badge |
| Arborist Enterprise | 5 | $199/mo | White-label, API access, dedicated support |

**Feature Gating:** `requireTier()` middleware on server routes. Marketplace selling requires Craftsman Pro+, all arborist tools require Arborist Starter+.

---

## 7. AUTHENTICATION

- **Method:** Custom email/password with bcryptjs (12 rounds)
- **Sessions:** Cookie-based via express-session + connect-pg-simple (PostgreSQL session store)
- **Email Verification:** Resend transactional emails with token-based verification
- **Trust Layer SSO:** JWT-based cross-app auth (HS256, shared JWT_SECRET), Trust Layer IDs (tl-xxxx-xxxx)
- **Middleware:** `requireAuth` (session check), `requireTier(tierName)` (subscription level check)

---

## 8. ENVIRONMENT SECRETS

| Secret | Purpose |
|--------|---------|
| `JWT_SECRET` | JWT signing for Trust Layer SSO (HS256) |
| `SESSION_SECRET` | Express session signing |
| `STRIPE_PUBLISHABLE_KEY` | Stripe frontend key |
| `STRIPE_SECRET_KEY` | Stripe backend key |
| `TRUSTHOME_API_KEY` | TrustHome inbound API key |
| `TRUSTHOME_API_SECRET` | TrustHome HMAC signing secret |
| `DATABASE_URL` | PostgreSQL connection (auto-provided by Replit) |

---

## 9. ECOSYSTEM INTEGRATIONS

| Integration | Status | Description |
|-------------|--------|-------------|
| GarageBot | Integrated | Equipment management proxy at /api/garagebot/* |
| DW-STAMP | Integrated | Blockchain certification on all major events |
| TrustShield | Integrated | Vendor verification badges |
| TrustVault | Integrated | Media gallery, upload, editors at /vault |
| Signal (SIG) | Integrated | Cryptocurrency token tiers and purchasing |
| TLID | Integrated | .tlid domain identity resolution |
| Credits | Integrated | AI service credit system |
| TrustHome | Integrated | Real estate API (species ID, assessments, removal plans) |
| VedaSolus | Linked | Wellness hub integration via wild edibles module |

---

## 10. LIVING CATALOG STRATEGY

- 170+ real US outdoor locations seeded
- Target: 5,000+ outdoor locations, 500+ wild plants
- Daily growth: 10-15 new entries
- All category pages display "Living Catalog" banner
- Proximity search enabled (lat/lng-based)
- Service worker cache version: v3 (bump when replacing images)

---

## 11. FRONTEND ROUTING (40+ Pages)

### Public Routes (no auth required)
`/` (landing/explore), `/trails`, `/catalog`, `/catalog/:slug`, `/marketplace`, `/price-compare`, `/developer`, `/hunting`, `/climbing`, `/fishing`, `/public-lands`, `/survival`, `/conservation`, `/mtb`, `/camping`, `/emobility`, `/winter`, `/watersports`, `/charters`, `/coastal`, `/desert`, `/wetlands`, `/caves`, `/prairie`, `/foraging`, `/pricing`, `/blog`, `/blog/:slug`

### Auth-Gated Routes
`/identify`, `/planner`, `/dashboard`, `/arborist`, `/vault`, `/admin`, `/track/:id`, `/blog/admin`

### Standalone Routes (bypass AppLayout)
`/signal-chat` — Full-screen chat interface
`/arbora/*` — Standalone Arbora PWA (see Arbora handoff)

---

## 12. UI/UX DESIGN SYSTEM

- **Theme:** Dark mode default, earthy green (#10b981) / slate / amber palette
- **Cards:** Glassmorphism with backdrop-blur
- **Layout:** Bento grids, mobile-first responsive
- **Navigation:** Sidebar (desktop) + bottom tabs (mobile)
- **Animations:** Framer Motion throughout, 60fps target
- **Icons:** lucide-react for UI, react-icons/si for brand logos
- **Maps:** Leaflet with custom markers for trails and catalog locations
