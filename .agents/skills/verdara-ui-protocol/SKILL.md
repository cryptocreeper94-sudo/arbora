---
name: verdara-ui-protocol
description: Verdara outdoor recreation super-app UI and layout build protocol. Use when building or modifying any Verdara screens, components, or visual elements. Covers color palette, glassmorphism, bento grids, animations, responsive layout, and component standards.
---

# Verdara UI & Layout Build Protocol

## Brand Identity
- **App Name:** Verdara (verdara.io)
- **Parent Company:** DarkWave Studios
- **Positioning:** Premium AI-powered outdoor recreation super-app
- **Explicitly Excludes:** Team sports (baseball, football, golf, tennis, indoor fitness)

## Color Palette (Earthy Outdoor Theme - No Deviations)

```css
/* Primary Colors */
--emerald-green: #10b981;    /* Primary CTA, active states */
--slate-blue: #64748b;       /* Secondary elements, text */
--warm-amber: #f59e0b;       /* Accents, highlights, warnings */

/* Supporting Colors */
--forest-dark: #065f46;      /* Dark mode backgrounds */
--sky-light: #e0f2fe;        /* Light backgrounds */
--earth-brown: #78350f;      /* Tertiary accents */
```

**FORBIDDEN Colors:** Do NOT use cyan (#06b6d4) or lavender (#a78bfa) — those are Trust Layer colors, not Verdara.

## Glassmorphism UI

### Glass Card
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### Glass Navigation
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(30px);
border-bottom: 1px solid rgba(255, 255, 255, 0.1);
```

## Bento Grid Layout
- CSS Grid with varying column spans
- Mix of 1x1, 1x2, 2x1, 2x2 card sizes
- Asymmetric layouts for visual interest
- Responsive: 1 col mobile, 2-3 col tablet, 4 col desktop

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
  <div className="md:col-span-2 md:row-span-2">{/* Large */}</div>
  <div className="md:col-span-1 md:row-span-1">{/* Small */}</div>
  <div className="md:col-span-1 md:row-span-2">{/* Tall */}</div>
</div>
```

## Animation Requirements
- **Target:** 60fps — use `transform` and `opacity` only
- **Library:** Framer Motion for complex animations
- **Page transitions:** slide + fade (400ms)
- **Card hover:** scale(1.02) + shadow increase
- **Button press:** scale(0.98)
- **Loading:** Skeleton loaders with shimmer effect
- **Hero:** Parallax scrolling (0.5x speed)

## Mobile-First Layout
- Bottom tab navigation on mobile (5 tabs max)
- Sidebar navigation on desktop
- Touch targets minimum 44x44px
- Swipe gestures for cards/carousels
- Pull-to-refresh on feed screens

## Responsive Breakpoints
```
sm: 640px   /* Small phones */
md: 768px   /* Large phones / small tablets */
lg: 1024px  /* Tablets / small laptops */
xl: 1280px  /* Laptops */
2xl: 1536px /* Desktops */
```

### Layout Shifts
- Mobile (< 768px): Bottom tab nav, single column, stacked cards
- Tablet (768-1024px): Sidebar nav, 2-column grids
- Desktop (> 1024px): Sidebar nav, 3-4 column bento grids, expanded cards

## Image Requirements (CRITICAL)
- EVERY card MUST have a photorealistic image
- NO gray placeholder boxes
- NO "image coming soon" states
- NO solid color backgrounds as substitutes
- Use stock images or generated images for all cards
- Hero sections: Stunning landscape photography
- Activity cards: Action shots of each activity
- Trail cards: Real trail photography
- Species: High-resolution nature closeups
- Marketplace: Professional product photography

## 6 Phase 1 Screens

### Screen 1: Homepage/Landing
- Hero with parallax background (forest/mountain)
- Glassmorphic search bar with AI identification CTA
- Bento grid of 8-12 activity categories with photos
- Featured trails carousel (horizontal scroll, snap)
- Animated stats counter (users, trails, species)
- Weather widget placeholder
- Bottom nav (mobile) / Sidebar (desktop)

### Screen 2: AI Identification Interface
- Camera upload zone (drag-drop + file picker)
- Image preview with crop/rotate
- "Analyzing..." animated progress state
- Glassmorphic results card (species name, confidence %, description accordion, similar species carousel)
- Save to Collection + Share CTAs

### Screen 3: Trail Discovery
- Map view (static image placeholder)
- Filter sidebar/drawer (difficulty, distance slider, activity type, features)
- Trail cards in bento grid (hero image, gradient overlay, stats, difficulty badge, bookmark)
- Sorting dropdown

### Screen 4: Trip Planner
- Multi-stop route builder with drag-drop waypoints
- Date/time pickers, duration estimates
- Gear checklist accordion (8 categories, 45 items)
- Weather forecast widget (7-day)
- Campground booking section with site cards
- Share trip button

### Screen 5: Wood Marketplace
- Search bar with filters
- TrustShield vendor badges (4 levels: Basic/green, Verified/blue, Premium/gold, Elite/platinum)
- Product cards (wood photos, species, grade, dimensions, price/bf, seller trust score)
- Trust Score tooltip (0-1000)
- Escrow payment badge

### Screen 6: User Dashboard
- Profile header (avatar, name, membership tier)
- Activity feed timeline
- Stats cards in bento grid (trails chart, species pie chart, conservation $, equipment)
- Saved collections accordion
- Settings button

## TrustShield Verification Levels
1. **Basic** — Green checkmark
2. **Verified** — Blue shield
3. **Premium** — Gold star
4. **Elite** — Platinum crown

## Trust Score Algorithm (display only)
- Transaction history: 40%
- Review ratings: 25%
- Dispute resolution: 20%
- Account age/activity: 10%
- Verification level: 5%

## Subscription Tiers
- **Free Explorer** — Basic maps, 10 AI IDs/month, ads
- **Outdoor Explorer** — $19.99/yr — Unlimited AI, offline maps, ad-free
- **Craftsman Pro** — $29.99/yr — + marketplace, basic biz tools
- **Arborist Pro** — $49-$199/mo — Full business management

## Key Integration Notes
- **GarageBot:** Motorized/power equipment ONLY (chainsaws, ATVs, e-bikes, boats). NOT firearms, climbing gear, non-electric bikes, tents.
- **DarkWave Weather:** Internal custom widget, not third-party API
- **TrustShield:** ALL marketplace monetary transactions
- **Campground API:** Brother-in-law's nationwide network, direct booking

## Custom Components to Build
1. GlassCard (reusable glassmorphism wrapper)
2. BentoGrid (responsive grid container)
3. ActivityCategoryCard (image + icon + label)
4. TrailCard (complex card with stats)
5. SpeciesResultCard (AI identification output)
6. TrustBadge (TrustShield verification levels)
7. WeatherWidget (DarkWave placeholder)
8. MapPlaceholder (static image for now)
9. ImageUploadZone (drag-drop with preview)
10. GearChecklistItem (checkbox + edit + delete)
