# ARBORA (App #29) — Full Backend Handoff Document
## DarkWave Trust Layer Ecosystem — Standalone Arborist Business Management PWA
**Generated:** February 2026
**Status:** Production-ready, integrated within Verdara codebase

---

## 1. OVERVIEW

Arbora is App #29 in the DarkWave Trust Layer ecosystem — a standalone Progressive Web App for professional arborist business management. While it shares backend infrastructure with Verdara (App #28), it presents a completely distinct branded experience with its own layout, navigation, theme, and route structure at `/arbora/*`. Arbora provides comprehensive business tools including CRM deal pipeline, job scheduling, estimates with line items, invoicing, crew management with time tracking, inventory management with low-stock alerts, and GarageBot equipment integration.

---

## 2. BRANDING & THEME

| Element | Value |
|---------|-------|
| Primary Background | `#0a0f1a` (deep navy) |
| Sidebar/Header Background | `#0f172a` (navy) |
| Accent Color (Copper) | `#c2703e` |
| Border Color | `rgba(194, 112, 62, 0.2)` |
| Heading Text | `#f1f5f9` |
| Body Text | `#e2e8f0` |
| Muted Text | `#94a3b8` |
| Dim Text | `#64748b` |
| Card Background | `rgba(255, 255, 255, 0.04)` |
| Success | `#10b981` |
| Warning | `#f59e0b` |
| Error | `#ef4444` |
| Icon | `attached_assets/arbora-icon.png` |
| Splash Background | `attached_assets/arbora-splash-bg.png` |

---

## 3. ARCHITECTURE

Arbora is **not a separate deployment** — it runs within the Verdara monolith but presents as a standalone app:

- **Frontend:** Separate layout component (`ArboraLayout`) with its own sidebar, mobile bottom tabs, and header. Bypasses Verdara's `AppLayout` entirely.
- **Backend:** Shares Verdara's Express server, PostgreSQL database, auth system, and storage layer. All arborist API routes are at `/api/arborist/*`.
- **Auth Gate:** Requires authentication. Unauthenticated users see a branded sign-in screen with copper (#c2703e) styling.
- **Tier Gating:** All endpoints require `Arborist Starter` subscription tier (level 3+) via `requireTier("Arborist Starter")` middleware.

---

## 4. FRONTEND STRUCTURE

### Layout Component
**File:** `client/src/components/arbora-layout.tsx`

- **Desktop:** Collapsible sidebar (240px expanded / 68px collapsed) with navigation links, Arbora logo, and "Back to Verdara" link
- **Mobile:** Hamburger menu overlay + bottom tab navigation (Home, Clients, Jobs, Pipeline, Invoices)
- **Responsive:** Full sidebar on `lg:` breakpoint, mobile bottom tabs + hamburger below

### Sidebar Navigation (10 items)
| Path | Label | Icon |
|------|-------|------|
| `/arbora` | Dashboard | LayoutDashboard |
| `/arbora/clients` | Clients | Users |
| `/arbora/deals` | Pipeline | Briefcase |
| `/arbora/jobs` | Jobs | TreePine |
| `/arbora/estimates` | Estimates | Calculator |
| `/arbora/invoices` | Invoices | FileText |
| `/arbora/calendar` | Calendar | CalendarDays |
| `/arbora/crew` | Crew | HardHat |
| `/arbora/inventory` | Inventory | Package |
| `/arbora/equipment` | Equipment | Wrench |

### Mobile Bottom Tabs (5 items)
Dashboard, Clients, Jobs, Pipeline, Invoices

---

## 5. PAGE MODULES (10 Pages)

### 5.1 Dashboard (`/arbora`)
**File:** `client/src/pages/arbora-dashboard.tsx`

- Hero banner with splash image and gradient overlay
- 4 KPI stat cards: Total Clients, Active Jobs, Pipeline Value, Outstanding Invoices
- Recent Jobs list (last 5 with status badges)
- Quick Stats grid: Estimates count, Active Crew, Inventory Items, Low Stock alerts
- All cards link to their respective pages

### 5.2 Clients (`/arbora/clients`)
**File:** `client/src/pages/arbora-clients.tsx`

- Search bar + "Add Client" button
- Grid of client cards showing: name, email, phone, address, notes
- Add client dialog: name (required), email, phone, address, notes
- Delete client with confirmation
- **API:** CRUD via `/api/arborist/clients`

### 5.3 Deals / Pipeline (`/arbora/deals`)
**File:** `client/src/pages/arbora-deals.tsx`

- Kanban-style board with 6 columns: New, Contacted, Qualified, Proposal Sent, Won, Lost
- Pipeline summary header: total deals count, total value
- Deal cards show: title, client name (looked up from clients list), value, expected close date
- Stage change dropdown on each card (move between pipeline stages)
- Add Deal dialog: title (required), client (select), value, stage, description, expected close date
- Delete deal
- **API:** CRUD via `/api/arborist/deals` + GET `/api/arborist/clients` for client name lookup

### 5.4 Jobs (`/arbora/jobs`)
**File:** `client/src/pages/arbora-jobs.tsx`

- Status filter tabs: All, Scheduled, In Progress, Completed
- Grid of job cards: title, client name, status badge, scheduled date, estimated cost, crew list
- Status change dropdown on each card
- Add Job dialog: title (required), client (select), description, scheduled date, estimated cost, crew (comma-separated), notes, status
- Delete job
- **API:** CRUD via `/api/arborist/jobs`

### 5.5 Estimates (`/arbora/estimates`)
**File:** `client/src/pages/arbora-estimates.tsx`

- Grid of estimate cards: estimate number, client, status badge, total, service type, tree species
- Status badges: draft, sent, accepted, declined
- Add Estimate dialog with dynamic line items:
  - Client (select), service type (removal, trimming, stump-grinding, consultation, planting, emergency)
  - Tree species, site address
  - Dynamic line item rows: description, quantity, unit price
  - Tax rate, auto-calculated subtotal/tax/total
  - Valid until date, notes
- Status update capability
- Delete estimate
- **API:** CRUD via `/api/arborist/estimates`
- **Backend auto-generates:** estimate number (`EST-XXXXXX`), subtotal, tax, total

### 5.6 Invoices (`/arbora/invoices`)
**File:** `client/src/pages/arbora-invoices.tsx`

- Status filter tabs: All, Draft, Sent, Paid, Overdue
- Invoice cards: invoice number, client name, status badge, total, due date
- Add Invoice dialog with dynamic line items:
  - Client (select), due date
  - Dynamic line item rows: description, quantity, unit price
  - Tax rate, auto-calculated subtotal/tax/total
  - Notes
- Status change capability
- Delete invoice
- **API:** CRUD via `/api/arborist/invoices`

### 5.7 Calendar (`/arbora/calendar`)
**File:** `client/src/pages/arbora-calendar.tsx`

- Monthly calendar grid
- Days with scheduled jobs highlighted with copper dots
- Click a day to see job list in side panel
- Prev/Next month navigation + Today button
- Jobs listed for selected day with status badges
- Link to add new job
- **Data:** GET `/api/arborist/jobs` (uses `scheduledDate` field)

### 5.8 Crew (`/arbora/crew`)
**File:** `client/src/pages/arbora-crew.tsx`

**Crew Member Management:**
- Grid of crew cards: name, role, email, phone, hourly rate, active/inactive badge
- Add Crew Member dialog: first name (required), last name (required), email, phone, role (climber, ground-crew, operator, foreman, apprentice), hourly rate
- Toggle active/inactive status
- Delete crew member

**Time Entry Tracking:**
- Section below crew list showing recent time entries
- Time entry rows: crew member name, job title, date, hours worked, overtime, status
- Add Time Entry dialog: crew member (select), job (select), date, hours worked, overtime hours, notes
- Approve time entry (PATCH status to "approved")

- **API:** Crew CRUD via `/api/arborist/crew`, Time entries via `/api/arborist/time-entries`

### 5.9 Inventory (`/arbora/inventory`)
**File:** `client/src/pages/arbora-inventory.tsx`

- Low stock alert banner at top (items below reorder point)
- Category filter tabs: All, Supplies, Safety Gear, Rigging, Cutting, Vehicle, Fuel
- Grid of inventory cards: name, category, quantity vs. reorder point, unit, cost per unit, supplier
- Add Item dialog: name (required), category (select), SKU, current quantity, unit, reorder point, cost per unit, supplier, notes
- Edit quantity (inline or dialog)
- Delete item
- **API:** CRUD via `/api/arborist/inventory`, Low stock via GET `/api/arborist/inventory/low-stock`

### 5.10 Equipment (`/arbora/equipment`)
**File:** `client/src/pages/arbora-equipment.tsx`

- GarageBot integration (same as Verdara's equipment tab, restyled for navy/copper)
- Equipment cards: year/make/model, vehicle type, engine type/size, fuel type, mileage/hours
- Maintenance alert banners: overdue (red) and upcoming (amber) counts
- Expandable detail view per equipment: maintenance schedule, service history, reminders
- Add Equipment dialog: year, make, model, type (equipment, car, truck, motorcycle, ATV), engine type, engine size, notes
- **API:** GarageBot proxy at `/api/garagebot/equipment`, `/api/garagebot/maintenance-alerts`

---

## 6. DATABASE TABLES (8 Tables)

### Shared with Verdara (pre-existing)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `arborist_clients` | Client records | id, userId, name, email, phone, address, notes, createdAt |
| `arborist_jobs` | Job tracking | id, userId, clientId, title, description, status, scheduledDate, estimatedCost, crew, notes, createdAt |
| `arborist_invoices` | Invoice management | id, userId, clientId, invoiceNumber, items (JSONB), subtotal, tax, total, status, dueDate, notes, createdAt |

### New for Arbora
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `arborist_deals` | CRM pipeline | id, userId, clientId, title, value (REAL), stage (new/contacted/qualified/proposal_sent/won/lost), description, expectedCloseDate, createdAt |
| `arborist_estimates` | Job estimates | id, userId, clientId, estimateNumber, status (draft/sent/accepted/declined), items (JSONB), subtotal, tax, total, validUntil, notes, siteAddress, treeSpecies, serviceType, createdAt |
| `arborist_crew_members` | Crew roster | id, userId, firstName, lastName, email, phone, role (climber/ground-crew/operator/foreman/apprentice), hourlyRate (REAL), isActive (BOOLEAN), createdAt |
| `arborist_time_entries` | Time tracking | id, userId, crewMemberId (FK), jobId (FK), date, hoursWorked (REAL), overtimeHours (REAL), notes, status (pending/approved), createdAt |
| `arborist_inventory` | Inventory management | id, userId, name, category (supplies/safety-gear/rigging/cutting/vehicle/fuel), sku, currentQuantity (INT), unit, reorderPoint (INT), costPerUnit (REAL), supplier, notes, createdAt |

---

## 7. API ROUTES (33 Endpoints)

All routes require `requireAuth` + `requireTier("Arborist Starter")` middleware.

### Clients
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/clients` | List all clients for user |
| POST | `/api/arborist/clients` | Create client |
| PATCH | `/api/arborist/clients/:id` | Update client |
| DELETE | `/api/arborist/clients/:id` | Delete client |

### Jobs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/jobs` | List all jobs for user |
| POST | `/api/arborist/jobs` | Create job |
| PATCH | `/api/arborist/jobs/:id` | Update job (status, details) |
| DELETE | `/api/arborist/jobs/:id` | Delete job |

### Invoices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/invoices` | List all invoices for user |
| POST | `/api/arborist/invoices` | Create invoice (auto-generates number, calculates totals) |
| PATCH | `/api/arborist/invoices/:id` | Update invoice (status, details) |
| DELETE | `/api/arborist/invoices/:id` | Delete invoice |

### Deals (CRM Pipeline)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/deals` | List all deals for user |
| POST | `/api/arborist/deals` | Create deal |
| PATCH | `/api/arborist/deals/:id` | Update deal (stage, value, details) |
| DELETE | `/api/arborist/deals/:id` | Delete deal |

### Estimates
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/estimates` | List all estimates for user |
| POST | `/api/arborist/estimates` | Create estimate (auto-generates number, calculates totals) |
| PATCH | `/api/arborist/estimates/:id` | Update estimate (status, details) |
| DELETE | `/api/arborist/estimates/:id` | Delete estimate |

### Crew Members
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/crew` | List all crew members for user |
| POST | `/api/arborist/crew` | Add crew member |
| PATCH | `/api/arborist/crew/:id` | Update crew member (role, rate, active status) |
| DELETE | `/api/arborist/crew/:id` | Remove crew member |

### Time Entries
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/time-entries` | List time entries (optional `?jobId=` filter) |
| POST | `/api/arborist/time-entries` | Create time entry |
| PATCH | `/api/arborist/time-entries/:id` | Update time entry (approve, edit hours) |
| DELETE | `/api/arborist/time-entries/:id` | Delete time entry |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/arborist/inventory` | List all inventory items for user |
| GET | `/api/arborist/inventory/low-stock` | List items below reorder point |
| POST | `/api/arborist/inventory` | Add inventory item |
| PATCH | `/api/arborist/inventory/:id` | Update item (quantity, details) |
| DELETE | `/api/arborist/inventory/:id` | Delete item |

### GarageBot Equipment (shared proxy)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/garagebot/equipment` | List all equipment |
| GET | `/api/garagebot/equipment/:id` | Equipment detail + service history |
| GET | `/api/garagebot/maintenance-alerts` | Maintenance alerts |
| POST | `/api/garagebot/equipment` | Register new equipment |
| PATCH | `/api/garagebot/equipment/:id` | Update equipment |

---

## 8. STORAGE INTERFACE (IStorage)

All CRUD operations are scoped by `userId` for data isolation. Key methods:

```typescript
// Deals
getArboristDeals(userId: number): Promise<ArboristDeal[]>
createArboristDeal(deal: InsertArboristDeal): Promise<ArboristDeal>
updateArboristDeal(id: number, data: Partial<ArboristDeal>): Promise<ArboristDeal>
deleteArboristDeal(id: number, userId: number): Promise<boolean>

// Estimates
getArboristEstimates(userId: number): Promise<ArboristEstimate[]>
createArboristEstimate(estimate: InsertArboristEstimate): Promise<ArboristEstimate>
updateArboristEstimate(id: number, data: Partial<ArboristEstimate>): Promise<ArboristEstimate>
deleteArboristEstimate(id: number, userId: number): Promise<boolean>

// Crew
getArboristCrewMembers(userId: number): Promise<ArboristCrewMember[]>
createArboristCrewMember(member: InsertArboristCrewMember): Promise<ArboristCrewMember>
updateArboristCrewMember(id: number, data: Partial<ArboristCrewMember>): Promise<ArboristCrewMember>
deleteArboristCrewMember(id: number, userId: number): Promise<boolean>

// Time Entries
getArboristTimeEntries(userId: number, jobId?: number): Promise<ArboristTimeEntry[]>
createArboristTimeEntry(entry: InsertArboristTimeEntry): Promise<ArboristTimeEntry>
updateArboristTimeEntry(id: number, data: Partial<ArboristTimeEntry>): Promise<ArboristTimeEntry>
deleteArboristTimeEntry(id: number, userId: number): Promise<boolean>

// Inventory
getArboristInventoryItems(userId: number): Promise<ArboristInventoryItem[]>
getArboristLowStockItems(userId: number): Promise<ArboristInventoryItem[]>
createArboristInventoryItem(item: InsertArboristInventoryItem): Promise<ArboristInventoryItem>
updateArboristInventoryItem(id: number, data: Partial<ArboristInventoryItem>): Promise<ArboristInventoryItem>
deleteArboristInventoryItem(id: number, userId: number): Promise<boolean>
```

---

## 9. DRIZZLE SCHEMA TYPES

```typescript
// Table definitions
export const arboristDeals = pgTable("arborist_deals", { ... })
export const arboristEstimates = pgTable("arborist_estimates", { ... })
export const arboristCrewMembers = pgTable("arborist_crew_members", { ... })
export const arboristTimeEntries = pgTable("arborist_time_entries", { ... })
export const arboristInventory = pgTable("arborist_inventory", { ... })

// Insert schemas (Zod via drizzle-zod)
export const insertArboristDealSchema = createInsertSchema(arboristDeals).omit({ id: true, createdAt: true })
export const insertArboristEstimateSchema = createInsertSchema(arboristEstimates).omit({ id: true, createdAt: true })
export const insertArboristCrewMemberSchema = createInsertSchema(arboristCrewMembers).omit({ id: true, createdAt: true })
export const insertArboristTimeEntrySchema = createInsertSchema(arboristTimeEntries).omit({ id: true, createdAt: true })
export const insertArboristInventorySchema = createInsertSchema(arboristInventory).omit({ id: true, createdAt: true })

// Select types
export type ArboristDeal = typeof arboristDeals.$inferSelect
export type ArboristEstimate = typeof arboristEstimates.$inferSelect
export type ArboristCrewMember = typeof arboristCrewMembers.$inferSelect
export type ArboristTimeEntry = typeof arboristTimeEntries.$inferSelect
export type ArboristInventoryItem = typeof arboristInventory.$inferSelect

// Insert types
export type InsertArboristDeal = z.infer<typeof insertArboristDealSchema>
export type InsertArboristEstimate = z.infer<typeof insertArboristEstimateSchema>
export type InsertArboristCrewMember = z.infer<typeof insertArboristCrewMemberSchema>
export type InsertArboristTimeEntry = z.infer<typeof insertArboristTimeEntrySchema>
export type InsertArboristInventoryItem = z.infer<typeof insertArboristInventorySchema>
```

---

## 10. ROUTING INTEGRATION

**File:** `client/src/App.tsx`

Arbora routes are intercepted before Verdara's AppLayout via `location.startsWith("/arbora")`:

```tsx
if (location.startsWith("/arbora")) {
  if (!isAuthenticated) {
    return <ArboraSignInScreen />;  // Branded navy/copper auth gate
  }
  return (
    <ArboraLayout>
      <Switch>
        <Route path="/arbora" component={ArboraDashboard} />
        <Route path="/arbora/clients" component={ArboraClients} />
        <Route path="/arbora/deals" component={ArboraDeals} />
        <Route path="/arbora/jobs" component={ArboraJobs} />
        <Route path="/arbora/estimates" component={ArboraEstimates} />
        <Route path="/arbora/invoices" component={ArboraInvoices} />
        <Route path="/arbora/calendar" component={ArboraCalendar} />
        <Route path="/arbora/crew" component={ArboraCrew} />
        <Route path="/arbora/inventory" component={ArboraInventory} />
        <Route path="/arbora/equipment" component={ArboraEquipment} />
      </Switch>
    </ArboraLayout>
  );
}
```

---

## 11. DATA RELATIONSHIPS

```
Users (userId)
  └── Arborist Clients
  │     └── Arborist Jobs (clientId FK)
  │     └── Arborist Invoices (clientId FK)
  │     └── Arborist Deals (clientId FK)
  │     └── Arborist Estimates (clientId FK)
  └── Arborist Crew Members
  │     └── Arborist Time Entries (crewMemberId FK)
  │                └── linked to Jobs (jobId FK)
  └── Arborist Inventory (standalone, userId scoped)
  └── GarageBot Equipment (external API, not in local DB)
```

---

## 12. SUBSCRIPTION REQUIREMENT

Arbora requires **Arborist Starter** tier (level 3, $49/mo) or higher:
- Arborist Starter ($49/mo): Up to 25 clients, all Arbora features
- Arborist Business ($99/mo): Unlimited clients, team features, TrustShield badge
- Arborist Enterprise ($199/mo): White-label, API access, dedicated support

All 33 API endpoints enforce `requireTier("Arborist Starter")` middleware. Frontend tier gating happens at the API response level (403 for insufficient tier).

---

## 13. FRONTEND PATTERNS

- **State Management:** TanStack React Query v5 (object form only)
- **Data Fetching:** `useQuery({ queryKey: ["/api/arborist/..."] })` with default queryFn
- **Mutations:** `useMutation` with `apiRequest()` from `@/lib/queryClient`, cache invalidation via `queryClient.invalidateQueries()`
- **Toasts:** `useToast()` from `@/hooks/use-toast`
- **Animations:** Framer Motion (`motion.div`, `AnimatePresence`)
- **Components:** Shadcn UI (Card, Button, Badge, Dialog, Select, Input, Label, Textarea, Tabs)
- **Icons:** lucide-react
- **Testing:** `data-testid` attributes on all interactive elements

---

## 14. FILES MANIFEST

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `client/src/components/arbora-layout.tsx` | Component | ~130 | Layout with sidebar, mobile nav, header |
| `client/src/pages/arbora-dashboard.tsx` | Page | ~120 | KPI dashboard with stat cards |
| `client/src/pages/arbora-clients.tsx` | Page | ~200 | Client management CRUD |
| `client/src/pages/arbora-deals.tsx` | Page | ~280 | CRM deal pipeline (kanban) |
| `client/src/pages/arbora-jobs.tsx` | Page | ~250 | Job management with status filter |
| `client/src/pages/arbora-estimates.tsx` | Page | ~300 | Estimates with dynamic line items |
| `client/src/pages/arbora-invoices.tsx` | Page | ~300 | Invoice management with line items |
| `client/src/pages/arbora-calendar.tsx` | Page | ~200 | Monthly calendar view |
| `client/src/pages/arbora-crew.tsx` | Page | ~350 | Crew + time entries management |
| `client/src/pages/arbora-inventory.tsx` | Page | ~280 | Inventory with low-stock alerts |
| `client/src/pages/arbora-equipment.tsx` | Page | ~250 | GarageBot equipment integration |
| `attached_assets/arbora-icon.png` | Asset | — | Arbora app icon (copper tree on navy) |
| `attached_assets/arbora-splash-bg.png` | Asset | — | Dashboard hero background |
