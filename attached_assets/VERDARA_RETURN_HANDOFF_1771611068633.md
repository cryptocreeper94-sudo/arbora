# DarkWave Trust Layer — Return Handoff to Verdara (App #28)

---

## Embeddable Ecosystem Widget

Before the per-service details, here is the **universal ecosystem widget** that Verdara (and all ecosystem apps) can embed with a single line of code:

```html
<script src="https://dwsc.io/api/ecosystem/widget.js"></script>
```

This renders a floating action button that opens a panel showing all 28+ ecosystem apps, live presale stats, and the user's SIG balance & subscription status (when authenticated via SSO). It uses Shadow DOM so it won't conflict with your app's CSS.

**Customizable base URL** (for dev/staging):
```html
<script src="https://dwsc.io/api/ecosystem/widget.js" data-api="https://your-dev-url.replit.app"></script>
```

**React Native / Expo usage:**
- Option A: Load inside a `<WebView source={{ uri: 'https://dwsc.io/ecosystem' }} />`
- Option B: Fetch the JSON API directly and render native UI:
```js
const data = await fetch('https://dwsc.io/api/ecosystem/widget-data').then(r => r.json());
// data.apps — all ecosystem apps
// data.presale — live presale stats
// data.user — authenticated user info (pass Bearer token)
// data.presaleBalance — user's SIG balance
// data.subscription — subscription status
```

---

## 1. TrustShield (Vendor Verification)

```
SERVICE NAME: TrustShield / Guardian Suite
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: Trust Layer SSO JWT -OR- API Key (x-api-key header)

ENDPOINTS:
- GET /api/guardian/security-scores/:projectId — Get verification/security score for a project/vendor
  - Input: projectId (path param) — can be Trust Layer ID or project identifier
  - Output: { id, projectId, overallScore, codeQuality, vulnerabilities, auditStatus, lastScanDate, ... }

- GET /api/guardian/security-scores — List all scored projects (filterable)
  - Input: Query params (optional): ?limit=20
  - Output: Array of security score records

- GET /api/guardian/security-scores/stats/overview — Aggregate security stats
  - Output: { totalScanned, averageScore, highRiskCount, ... }

- GET /api/guardian/certifications/:id — Get specific certification details
  - Input: certification ID (path param)
  - Output: { id, projectName, tier, status, certDate, expiryDate, blockchainHash, ... }

- GET /api/guardian/certifications — List user's certifications (requires auth)
  - Input: SSO JWT in Authorization header
  - Output: Array of certification records

- POST /api/guardian/certifications — Submit project for certification (requires auth)
  - Input: { projectName, projectUrl, category, description }
  - Output: { id, status: "pending", ... }

- GET /api/guardian/tiers — Get available certification tiers and pricing
  - Output: Array of tier objects with name, price, features

BADGE TIERS: Guardian Verified, Guardian Premium, Guardian Enterprise
RATE LIMITS: 100 requests/minute per IP
```

---

## 2. Signal (SIG) Payments

```
SERVICE NAME: Signal (SIG) — Trust Layer Native Asset
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: HMAC-SHA256 (x-blockchain-key, x-blockchain-signature, x-blockchain-timestamp headers)

ENDPOINTS:
- GET /api/presale/tiers — Get current SIG pricing tiers
  - Output: Array of tiers: [{ minUsd, maxUsd, pricePerSig, label }, ...]
  - Current: $0.001/SIG (Tier 1: $0-$50K)

- GET /api/presale/stats — Get live presale statistics (public, no auth)
  - Output: { totalRaisedUsd, totalSold, uniqueHolders, currentPrice, ... }

- POST /api/presale/checkout — Create a SIG purchase checkout (Stripe)
  - Input: { email, amountUsd } (minimum $1)
  - Output: { checkoutUrl, sessionId }
  - Note: Redirects buyer to Stripe Checkout. SIG allocated on payment success.

- POST /api/presale/crypto-checkout — Create a SIG purchase via crypto (Coinbase Commerce)
  - Input: { email, amountUsd }
  - Output: { checkoutUrl }

- GET /api/presale/my-purchases — Get authenticated user's SIG purchase history
  - Input: SSO JWT in Authorization header
  - Output: Array of { id, email, usdAmountCents, tokenAmount, status, createdAt }

WEBHOOK: Stripe webhook handles payment confirmation automatically. No external webhook needed.
RATE LIMITS: 30 requests/minute for checkout endpoints, 100/min for read endpoints
```

---

## 3. Trust Vault (Signal Wallet / On-Chain Balance)

```
SERVICE NAME: Trust Vault — Signal Blockchain Wallet
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: HMAC-SHA256 (x-blockchain-key, x-blockchain-signature, x-blockchain-timestamp)

  HMAC Auth Headers:
    x-blockchain-key: Your TRUSTLAYER_API_KEY
    x-blockchain-signature: HMAC-SHA256(TRUSTLAYER_API_SECRET, key + timestamp + body)
    x-blockchain-timestamp: Unix timestamp (must be within 5 minutes)

ENDPOINTS:
- GET /api/signal/balance/:trustLayerId — Get on-chain SIG balance
  - Input: trustLayerId (path param, format: tl-xxxx-xxxx)
  - Output: { trustLayerId, balance, balanceFormatted, chainAddress }
  - Note: No auth required for public balance lookup

- POST /api/signal/transfer — Transfer SIG between Trust Layer identities
  - Input: { fromTrustLayerId, toTrustLayerId, amount }
  - Output: { success, txHash, blockHeight, from, to, amount }
  - Auth: HMAC-SHA256 required

- POST /api/signal/gate — Check if a user meets a minimum SIG balance (token gating)
  - Input: { trustLayerId, requiredAmount }
  - Output: { allowed: boolean, balance, requiredAmount, reason }
  - Auth: HMAC-SHA256 required

- GET /api/wallet/backup/exists — Check if user has wallet backup (requires SSO)
  - Output: { exists: boolean }

- GET /api/wallet/external — List user's linked external wallets (requires SSO)
  - Output: Array of { id, address, chain, label }

RATE LIMITS: 60 requests/minute per key
```

---

## 4. GarageBot API

```
SERVICE NAME: GarageBot
API BASE URL: https://garagebot.io (separate Replit app — contact for API access)
AUTHENTICATION METHOD: Trust Layer SSO JWT

STATUS: GarageBot is a standalone ecosystem app. Integration is via ecosystem SSO.
Verdara should deep-link users to GarageBot and use the ecosystem widget for cross-app navigation.

CURRENT INTEGRATION PATH:
- Users authenticate via Trust Layer SSO (shared JWT_SECRET)
- Deep link: https://garagebot.io (will auto-authenticate via SSO)
- Equipment data sync: Contact GarageBot team for API key provisioning

ECOSYSTEM WIDGET INTEGRATION:
- GarageBot appears in the ecosystem widget automatically
- Users can navigate to it from any ecosystem app

ADDITIONAL NOTES:
Equipment API endpoints are being standardized across the ecosystem.
For now, use the ecosystem widget for cross-app navigation and contact
the GarageBot team directly for read/write API access.
```

---

## 5. DW-STAMP (Blockchain Certifications)

```
SERVICE NAME: DW-STAMP — Dual-Chain Blockchain Stamping
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: API Key (x-api-key header)

  To get an API key: Contact Trust Layer admin or use the owner admin portal.

ENDPOINTS:
- POST /api/stamp/dual — Issue a new blockchain stamp (DarkWave chain + optional Solana)
  - Input: {
      data: "any string or object to hash",
      appId: "verdara",
      appName: "Verdara",
      category: "trail_completion" | "species_id" | "achievement" | custom,
      metadata: { trailName, location, userId, ... },
      chains: ["darkwave"] or ["darkwave", "solana"]
    }
  - Output: {
      dataHash: "0x...",
      stampId: "uuid",
      darkwave: { success, txHash, blockHeight },
      solana: { success, txSignature } (if requested),
      allSuccessful: boolean
    }
  - Auth: x-api-key header required

- GET /api/stamp/:stampId — Get stamp details by ID
  - Input: stampId (path param)
  - Output: Full stamp record including chain confirmations, metadata, timestamps

- GET /api/stamps/app/:appId — List all stamps for an app
  - Input: appId (path param, e.g., "verdara")
  - Output: Array of stamp records for that app

- GET /api/stamp/verify/:voidId — Verify a stamp by its void/verification ID
  - Input: voidId (path param)
  - Output: Stamp details with verification status

- PATCH /api/stamp/:stampId/solana — Attach client-side Solana tx signature
  - Input: { txSignature: "solana_tx_sig" }
  - Output: Updated stamp record

SUPPORTED ACTIVITY TYPES: Verdara can define custom categories. Suggested:
  - trail_completion, species_identification, campground_stay,
  - foraging_find, wildlife_sighting, conservation_action

RATE LIMITS: 30 stamps/minute per API key
```

---

## 6. TLID Identity (.tlid Domains)

```
SERVICE NAME: TLID — Trust Layer Identity Domains
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: Public endpoints (no auth for lookups), SSO for registration

ENDPOINTS:
- GET /api/domains/search/:name — Search/resolve a .tlid domain name
  - Input: name (path param, e.g., "verdara" resolves verdara.tlid)
  - Output: { available: boolean, domain: { name, tld, owner, trustLayerId, registeredAt, ... } }

- GET /api/domains/stats — Get TLID registration statistics
  - Output: { totalRegistered, recentCount, ... }

- GET /api/domains/recent — Get recently registered .tlid domains
  - Output: Array of recent domain records

DATA RETURNED: name, tld (.tlid), owner Trust Layer ID, registration date, target URL

REVERSE LOOKUP: Use /api/domains/search with the Trust Layer ID to find associated .tlid names.

RATE LIMITS: 100 requests/minute
```

---

## 7. Credits System (Trust Layer Credits)

```
SERVICE NAME: Trust Layer Credits
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: Trust Layer SSO JWT (Authorization: Bearer <token>)

ENDPOINTS:
- GET /api/credits/balance — Get user's credit balance
  - Input: SSO JWT in Authorization header
  - Output: {
      balance: number,
      bonusCredits: number,
      lifetimeEarned: number,
      lifetimeSpent: number,
      dailyUsage: number
    }

- GET /api/credits/packages — Get available credit packages (public, no auth)
  - Output: { packages: [{ id, name, credits, bonusCredits, priceUsd, ... }] }

- GET /api/credits/transactions — Get credit transaction history
  - Input: SSO JWT + optional ?limit=50 query param
  - Output: { transactions: [{ id, type, amount, description, createdAt, ... }] }

- POST /api/credits/purchase — Purchase credits via Stripe
  - Input: { packageId: "package_id" }
  - Output: { checkoutUrl, sessionId }
  - Note: Redirects to Stripe Checkout. Credits added on payment success.

CREDIT COST PER AI IDENTIFICATION:
  - Verdara sets the credit cost per AI identification on their side
  - Deduction is handled by calling the credits service when an AI action is performed
  - Suggested: 1-5 credits per species/plant identification

TOP-UP FLOW: User is redirected to Stripe Checkout via /api/credits/purchase. Credits auto-credited after payment.

RATE LIMITS: 100 requests/minute
```

---

## 8. VedaSolus (Wellness Hub)

```
SERVICE NAME: VedaSolus
API BASE URL: Contact VedaSolus team (separate ecosystem app)
AUTHENTICATION METHOD: Trust Layer SSO JWT

STATUS: VedaSolus is a standalone ecosystem app within the DarkWave Trust Layer.
Integration follows the same SSO pattern.

CURRENT INTEGRATION PATH:
- Users authenticate via Trust Layer SSO (shared JWT_SECRET)
- Deep link format: https://vedasolus.io/plant/:plantId (when available)
- Cross-reference via Trust Layer ID

ECOSYSTEM WIDGET INTEGRATION:
- VedaSolus appears in the ecosystem widget automatically
- Users can navigate to it from the floating ecosystem panel

ADDITIONAL NOTES:
VedaSolus plant/wellness API is under active development.
Contact the VedaSolus team for early API access.
For now, use deep-linking and the ecosystem widget for cross-app navigation.
```

---

## Ecosystem Widget Data API (For All Services)

```
SERVICE NAME: Ecosystem Widget Data
API BASE URL: https://dwsc.io
AUTHENTICATION METHOD: Optional — SSO JWT for personalized data, or unauthenticated for public data

ENDPOINTS:
- GET /api/ecosystem/widget-data — Get all ecosystem apps + presale + user data
  - Input: Optional Authorization: Bearer <sso_token> for user-specific data
  - Output: {
      apps: [{ id, name, description, url, category, verified, status, icon }],
      presale: { totalRaisedUsd, totalSold, uniqueHolders, currentPrice },
      user: { id, email, displayName } (null if not authenticated),
      subscription: { plan, status, ... } (null if not authenticated),
      presaleBalance: { totalSig, totalSpent } (null if not authenticated)
    }

- GET /api/ecosystem/widget.js — Self-contained embeddable JavaScript widget
  - Content-Type: application/javascript
  - Embed: <script src="https://dwsc.io/api/ecosystem/widget.js"></script>

- GET /api/ecosystem/apps — List all 28+ ecosystem applications
  - Output: Array of app objects

- GET /api/ecosystem/connection — Health check / gateway info
  - Output: { name, version, baseUrl, status, ... }

CORS: Full CORS support (Access-Control-Allow-Origin: *) for cross-domain embedding
```

---

## Shared Infrastructure

### SSO Authentication
- **Method**: JWT (HS256) with shared `JWT_SECRET`
- **Issuer**: `iss: "trust-layer-sso"`
- **Payload**: `{ userId, trustLayerId, iss, exp }`
- **Trust Layer ID format**: `tl-xxxx-xxxx`
- **Token passed in**: `Authorization: Bearer <jwt_token>`

### HMAC Authentication (for Trust Vault / blockchain operations)
- **Headers required**:
  - `x-blockchain-key`: Your `TRUSTLAYER_API_KEY`
  - `x-blockchain-signature`: HMAC-SHA256 of `(key + timestamp + requestBody)` using `TRUSTLAYER_API_SECRET`
  - `x-blockchain-timestamp`: Current Unix timestamp in seconds (must be within 5 minutes)

### API Key Authentication (for DW-STAMP)
- **Header**: `x-api-key: <your_api_key>`
- **Provisioning**: Contact Trust Layer admin

---

## Contact
**Service**: DarkWave Trust Layer (DWTL)
**Primary Domain**: dwsc.io / tlid.io
**Stack**: React 18 + Express + PostgreSQL on Replit
**SSO**: Trust Layer JWT (HS256, shared JWT_SECRET)
**Native Asset**: Signal (SIG) — $0.001/SIG presale price
**Ecosystem Widget**: `<script src="https://dwsc.io/api/ecosystem/widget.js"></script>`
