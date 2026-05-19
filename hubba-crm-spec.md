# Hubba — Full Build Specification

> A lightweight lead management and HTML email platform serving both **Loan Fair** and **klasp**, built on your existing React + Vite / Node + Express / Supabase / Resend stack.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Brand Identity](#2-brand-identity)
3. [Tech Stack](#3-tech-stack)
4. [Data Model](#4-data-model)
5. [Feature Specifications](#5-feature-specifications)
   - 5.1 Lead Pipeline
   - 5.2 HTML Email Campaigns
   - 5.3 Referrer & Partner Tracking
   - 5.4 Contacts & CSV Import
6. [UI / Screen Map](#6-ui--screen-map)
7. [API Routes](#7-api-routes)
8. [Build Plan](#8-build-plan)
9. [Claude Code Prompting Guide](#9-claude-code-prompting-guide)

---

## 1. Product Overview

### What it is

**Hubba** is a single internal web application with three pillars:

| Pillar | Purpose |
|---|---|
| **Lead Pipeline** | Capture, track, and manage leads across both brands |
| **Email Campaigns** | Compose and broadcast HTML emails to segmented lists |
| **Referrer Tracking** | Manage referrer partners and attribute leads to them |

### What it is NOT

- Not a public-facing product (internal tooling only, for now)
- Not a replacement for AFOS or aggregator CRMs — this sits above them
- Not a full marketing automation suite — sequences/drip is out of scope for MVP

### Multi-brand model

Every core entity (leads, campaigns, referrers) belongs to a **Brand**. The top-level nav includes a brand switcher. Data is always scoped to the active brand, with a global "All Brands" view available for admins.

---

## 2. Brand Identity

### Logo

The Hubba wordmark is a chunky, hand-drawn comic-book style logotype in amber gold on a black background. It has high energy and visual weight — the UI should feel worthy of it.

- Logo files: `Logo.svg` (primary), `Logo.png` (fallback)
- Use the SVG in the app sidebar/nav — white background version: render on dark sidebar
- For light backgrounds, consider a dark version of the wordmark (if needed, recolour the SVG fill to `#1a1a1a`)

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `--hubba-amber` | `#fbb040` | Primary brand colour — CTAs, active states, highlights, badges |
| `--hubba-amber-light` | `#fdd080` | Hover states, soft highlights |
| `--hubba-amber-dark` | `#e09020` | Pressed states, borders on amber elements |
| `--hubba-black` | `#0f0f0f` | App sidebar, nav background |
| `--hubba-charcoal` | `#1e1e1e` | Card headers, dark surfaces |
| `--hubba-surface` | `#f7f5f0` | Main content area background (warm off-white, not clinical white) |
| `--hubba-surface-2` | `#edeae3` | Alternate surface, table row hover |
| `--hubba-text` | `#1a1a1a` | Primary text |
| `--hubba-text-muted` | `#6b6560` | Labels, secondary text |
| `--hubba-border` | `#d4cfc8` | Borders, dividers |
| `--hubba-success` | `#2d7a4f` | Converted / approved status |
| `--hubba-warning` | `#c47b0a` | Submitted / in-progress status |
| `--hubba-danger` | `#c0392b` | Lost / bounced / error status |

### Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / headings | **Fraunces** (Google Fonts) | 700–900 | Optical sizing on, italic for flair. Matches the Hubba logo's organic personality |
| Body / UI labels | **DM Sans** (Google Fonts) | 400, 500 | Clean, modern, humanist — warm without being casual |
| Monospace / code | **JetBrains Mono** | 400 | HTML email editor, API keys, IDs |

```html
<!-- Add to index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

```css
/* globals.css */
:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --hubba-amber: #fbb040;
  --hubba-amber-light: #fdd080;
  --hubba-amber-dark: #e09020;
  --hubba-black: #0f0f0f;
  --hubba-charcoal: #1e1e1e;
  --hubba-surface: #f7f5f0;
  --hubba-surface-2: #edeae3;
  --hubba-text: #1a1a1a;
  --hubba-text-muted: #6b6560;
  --hubba-border: #d4cfc8;
  --hubba-success: #2d7a4f;
  --hubba-warning: #c47b0a;
  --hubba-danger: #c0392b;
}

body {
  font-family: var(--font-body);
  background: var(--hubba-surface);
  color: var(--hubba-text);
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-optical-sizing: auto;
}
```

### UI Design Principles

1. **Dark sidebar, warm content area.** The left nav is `--hubba-black` with the amber logo at top. Content area uses the warm off-white `--hubba-surface` — never pure white.
2. **Amber is earned.** Use `--hubba-amber` sparingly: primary CTAs, active nav items, key stat highlights. It pops because it's not everywhere.
3. **Cards have weight.** Cards use a subtle `box-shadow` and a `1px border` in `--hubba-border`. No flat ghost cards.
4. **Status badges are colour-coded.** Lead status pills use the success/warning/danger tokens above, not generic greys.
5. **Typography has hierarchy.** Page titles in Fraunces at 28–32px. Section headers in DM Sans 600 at 14px uppercase + letter-spacing. Body at 14–15px DM Sans 400.

### Component Tokens

```css
/* Buttons */
.btn-primary {
  background: var(--hubba-amber);
  color: var(--hubba-black);
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: 6px;
  border: none;
}
.btn-primary:hover { background: var(--hubba-amber-light); }
.btn-primary:active { background: var(--hubba-amber-dark); }

/* Sidebar nav item (active) */
.nav-item.active {
  background: rgba(251, 176, 64, 0.15);
  color: var(--hubba-amber);
  border-left: 3px solid var(--hubba-amber);
}

/* Status badges */
.badge-new        { background: #e8f0fe; color: #1a56db; }
.badge-contacted  { background: #fef9c3; color: #854d0e; }
.badge-qualified  { background: #fde68a; color: #92400e; }
.badge-submitted  { background: #fed7aa; color: #9a3412; }
.badge-approved   { background: #d1fae5; color: #065f46; }
.badge-converted  { background: #a7f3d0; color: #064e3b; }
.badge-lost       { background: #fee2e2; color: #991b1b; }
```

---

## 3. Tech Stack

Mirrors the Loan Fair stack to minimise new infrastructure.

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Deployed to Vercel |
| Backend | Node.js + Express | Deployed to Render |
| Database | Supabase (PostgreSQL) | Existing account |
| ORM | Prisma | Existing pattern |
| Email sending | Resend | Existing account |
| Auth | Supabase Auth | Simple email/password for MVP |
| File storage | Supabase Storage | Email template assets |
| Automation hooks | Make.com / n8n | Optional — webhook triggers |

### Repo structure

```
hubba/
├── client/                   # React + Vite frontend
│   ├── public/
│   │   └── logo.svg          # Hubba wordmark
│   ├── src/
│   │   ├── assets/
│   │   │   └── Logo.svg
│   │   ├── components/
│   │   │   ├── layout/       # AppShell, Sidebar, TopNav
│   │   │   ├── leads/
│   │   │   ├── campaigns/
│   │   │   └── referrers/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/              # API client, auth helpers
│   │   └── globals.css       # CSS variables + base styles
│   └── vite.config.js
├── server/                   # Node + Express backend
│   ├── routes/
│   │   ├── leads.js
│   │   ├── campaigns.js
│   │   ├── referrers.js
│   │   └── email.js
│   ├── middleware/
│   ├── lib/
│   │   ├── resend.js
│   │   └── supabase.js
│   └── index.js
├── prisma/
│   └── schema.prisma
└── README.md
```

---

## 4. Data Model

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── BRANDS ──────────────────────────────────────────────────────────────────

model Brand {
  id           String   @id @default(cuid())
  name         String   // "Loan Fair" | "klasp"
  slug         String   @unique // "loan-fair" | "klasp"
  primaryColor String?  // e.g. "#356852" for Loan Fair
  logoUrl      String?
  fromName     String?  // Default sender name for campaigns
  fromEmail    String?  // Default sender email for campaigns
  createdAt    DateTime @default(now())

  leads        Lead[]
  campaigns    Campaign[]
  referrers    Referrer[]
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────

model Contact {
  id           String   @id @default(cuid())
  email        String   @unique
  firstName    String?
  lastName     String?
  phone        String?
  unsubscribed Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  leads        Lead[]
  campaignSends CampaignSend[]
  emailEvents  EmailEvent[]
}

// ─── LEADS ───────────────────────────────────────────────────────────────────

model Lead {
  id          String     @id @default(cuid())
  brandId     String
  brand       Brand      @relation(fields: [brandId], references: [id])
  contactId   String
  contact     Contact    @relation(fields: [contactId], references: [id])
  referrerId  String?
  referrer    Referrer?  @relation(fields: [referrerId], references: [id])

  status      LeadStatus @default(NEW)
  source      String?    // "web-form" | "referral" | "facebook" | "manual"
  loanType    String?    // "car" | "personal" | "mortgage"
  loanAmount  Float?
  notes       String?
  tags        String[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  activities  Activity[]
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  SUBMITTED
  APPROVED
  CONVERTED
  LOST
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

model Activity {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id])
  type      String   // "note" | "status_change" | "email_sent" | "call"
  body      String?
  meta      Json?    // e.g. { from: "NEW", to: "CONTACTED" }
  createdAt DateTime @default(now())
  createdBy String?
}

// ─── REFERRERS ────────────────────────────────────────────────────────────────

model Referrer {
  id          String   @id @default(cuid())
  brandId     String
  brand       Brand    @relation(fields: [brandId], references: [id])

  name        String
  company     String?
  email       String?
  phone       String?
  tier        String?  // "standard" | "premium" | "partner"
  utmSource   String?  // Matches utm_source on inbound webhooks
  isActive    Boolean  @default(true)
  notes       String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  leads       Lead[]
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

model Campaign {
  id          String         @id @default(cuid())
  brandId     String
  brand       Brand          @relation(fields: [brandId], references: [id])

  name        String
  subject     String
  previewText String?
  htmlBody    String
  fromName    String
  fromEmail   String
  replyTo     String?

  status      CampaignStatus @default(DRAFT)
  scheduledAt DateTime?
  sentAt      DateTime?
  segmentRules Json?         // { status: ["NEW"], tags: ["hot"] }

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  sends       CampaignSend[]
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  CANCELLED
}

// ─── CAMPAIGN SENDS ───────────────────────────────────────────────────────────

model CampaignSend {
  id          String    @id @default(cuid())
  campaignId  String
  campaign    Campaign  @relation(fields: [campaignId], references: [id])
  contactId   String
  contact     Contact   @relation(fields: [contactId], references: [id])

  resendId    String?
  status      String    @default("queued")
  sentAt      DateTime?

  emailEvents EmailEvent[]
}

// ─── EMAIL EVENTS ─────────────────────────────────────────────────────────────

model EmailEvent {
  id             String        @id @default(cuid())
  campaignSendId String?
  campaignSend   CampaignSend? @relation(fields: [campaignSendId], references: [id])
  contactId      String
  contact        Contact       @relation(fields: [contactId], references: [id])

  event          String        // "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed"
  url            String?
  occurredAt     DateTime      @default(now())
}
```

---

## 5. Feature Specifications

### 5.1 Lead Pipeline

#### Lead capture

Leads enter via:

1. **Manual entry** — form in the Hubba UI
2. **Webhook** — `POST /api/leads` from Loan Fair or klasp intake forms
3. **Lead CSV import** — bulk upload with field mapping (see Section 5.4)

Required fields: brand, contact email, status, source. All others optional.

#### Pipeline view

- **Kanban board** — columns per `LeadStatus`, drag-to-reorder (`@dnd-kit/core`)
- **List view** — sortable table with status badges, filter panel
- View toggle persists to localStorage

#### Lead detail slide-over

- Contact info, status selector (logs Activity on change)
- Loan fields, referrer, tags
- Notes input (appends to Activity log)
- Activity log (reverse chronological)
- Actions: Send email, Edit, Delete

#### Filtering & search

- Global search (name, email, phone)
- Filter panel: Brand, Status (multi), Source, Tags, Referrer, Date range, Loan type
- Saved filters per user

---

### 5.2 HTML Email Campaigns

#### Workflow

```
Draft → Preview → Test send → Confirm audience → Send / Schedule
```

#### Composer

- Monaco HTML editor + live preview iframe, side by side
- 3 starter templates (Loan Fair branded, klasp branded, plain)
- Merge tags: `{{first_name}}`, `{{brand_name}}`, `{{unsubscribe_url}}`
- Mobile preview toggle (375px iframe)

#### Audience segmentation

Rules-based (AND logic): Lead status, Tags, Source, Referrer, Date added. Preview shows recipient count.

#### Sending

- Batched dispatch via Resend (50/sec)
- `CampaignSend` record per recipient
- Resend webhook → `POST /api/webhooks/resend` → updates `EmailEvent`
- Unsubscribe link auto-injected into every email footer

#### Unsubscribe flow

Every outbound email includes a footer link in the form:
`https://app.hubba.com/unsubscribe?token=<signed-jwt>`

The JWT encodes `{ contactId, campaignId }` and is signed with `UNSUBSCRIBE_SECRET` — no auth required to visit the page, but the token must verify.

1. Contact clicks the link → lands on `/unsubscribe` (public, outside the app shell)
2. Page shows a simple branded confirmation: "You've been unsubscribed from [Brand Name] emails."
3. On load, the client calls `POST /api/contacts/unsubscribe` with the token
4. Server verifies token, sets `contact.unsubscribed = true`, inserts an `EmailEvent` with `event = "unsubscribed"`
5. Future campaign sends query excludes any contact where `unsubscribed = true`
6. Internally, the contact record in Hubba shows an **Unsubscribed** badge; operators can manually re-subscribe via a toggle on the contact detail (with a confirmation prompt)

#### Analytics per campaign

- Recipients / Delivered / Opens / Clicks / Bounces / Unsubscribes
- Open rate, click rate
- 48h timeline chart (recharts)
- Per-recipient table

---

### 5.4 Contacts & CSV Import

#### Contact record

A `Contact` is a person, independent of any lead or brand. Contacts are created automatically when a lead is created (by webhook or manual entry), but can also be imported directly.

Each contact record shows:
- Name, email, phone
- Unsubscribed status (badge + toggle for manual re-subscribe)
- All leads associated with this contact (across brands)
- Full email event history (delivered, opened, clicked, bounced)
- Campaign send history

#### Contact CSV import

Accessible from `/contacts/import` — a dedicated import screen, separate from lead import.

**Supported columns (header row required):**

| Column | Required | Notes |
|---|---|---|
| `email` | Yes | Used as unique key — existing contacts are updated, not duplicated |
| `first_name` | No | |
| `last_name` | No | |
| `phone` | No | |
| `tags` | No | Pipe-separated: `newsletter\|vip` |
| `unsubscribed` | No | `true` / `false` — honours existing opt-outs |

**Import flow:**

1. Upload CSV file (drag-and-drop or file picker)
2. Column mapping step — auto-detects headers, lets operator remap if column names differ
3. Validation preview — shows first 5 rows, flags errors (missing email, duplicate, invalid format)
4. Confirm import → server upserts contacts, returns summary: `{ created: N, updated: N, skipped: N, errors: [] }`
5. Toast notification with summary; errors downloadable as a CSV

**Lead CSV import** (existing, at `/leads/import`) follows the same pattern but additionally requires `brand` and creates both a Contact (upsert) and a Lead record per row.

---

### 5.3 Referrer & Partner Tracking

#### Referrer profiles

Name, company, email, phone, brand, tier, UTM source slug, active toggle, notes.

#### Attribution

1. **Auto (UTM)** — inbound webhook with matching `utm_source` → auto-assigns referrer
2. **Manual** — operator assigns referrer on lead detail panel

#### Referrer dashboard

Summary cards + table: Name, Company, Tier, Leads (all time / this month), Conversion rate, Last activity.

#### Referrer report email

One-click → branded HTML email summary to referrer's address via Resend.

---

## 6. UI / Screen Map

```
Hubba App Shell
├── Sidebar (black, amber logo at top)
│   ├── Brand switcher (Loan Fair | klasp | All)
│   ├── Leads
│   ├── Contacts
│   ├── Campaigns
│   ├── Referrers
│   └── Settings
│
├── /leads
│   ├── Kanban view (default)
│   ├── List view
│   └── Lead detail (slide-over panel)
│
├── /leads/import
│   ├── Upload CSV
│   ├── Column mapping
│   └── Validation preview + confirm
│
├── /contacts
│   ├── Contact list (table: name, email, brands, leads, unsubscribed badge)
│   └── Contact detail (slide-over: leads, email history, unsubscribed toggle)
│
├── /contacts/import
│   ├── Upload CSV
│   ├── Column mapping
│   └── Validation preview + confirm
│
├── /campaigns
│   ├── Campaign list
│   ├── /campaigns/new (3-step wizard)
│   │   ├── Step 1: Compose (Monaco + preview)
│   │   ├── Step 2: Audience (segment builder)
│   │   └── Step 3: Review & Send
│   └── /campaigns/:id (analytics)
│
├── /referrers
│   ├── Referrer list
│   ├── /referrers/new
│   └── /referrers/:id (detail + leads)
│
├── /settings
│   ├── Brand settings
│   └── User management
│
└── /unsubscribe  ← PUBLIC (no auth, outside app shell)
    └── Token-verified unsubscribe confirmation page
```

---

## 7. API Routes

### Leads

```
GET    /api/leads                  List with filters
POST   /api/leads                  Create / webhook ingest
GET    /api/leads/:id              Detail
PATCH  /api/leads/:id              Update
DELETE /api/leads/:id              Soft delete
POST   /api/leads/:id/activities   Add note/activity
POST   /api/leads/import           Bulk CSV import
```

### Campaigns

```
GET    /api/campaigns              List
POST   /api/campaigns              Create (draft)
GET    /api/campaigns/:id          Detail
PATCH  /api/campaigns/:id          Update
POST   /api/campaigns/:id/send     Dispatch
POST   /api/campaigns/:id/test     Test send
GET    /api/campaigns/:id/stats    Analytics
```

### Referrers

```
GET    /api/referrers              List
POST   /api/referrers              Create
GET    /api/referrers/:id          Detail
PATCH  /api/referrers/:id          Update
GET    /api/referrers/:id/leads    Attributed leads
POST   /api/referrers/:id/report   Send report email
```

### Contacts

```
GET    /api/contacts                   List contacts (search, unsubscribed filter)
GET    /api/contacts/:id               Contact detail (leads + email history)
PATCH  /api/contacts/:id               Update contact (name, phone, unsubscribed toggle)
POST   /api/contacts/import            Bulk CSV import (upsert by email)
GET    /api/contacts/import/template   Download blank CSV template
POST   /api/contacts/unsubscribe       Token-verified unsubscribe (public, no JWT auth)
```

### Webhooks

```
POST   /api/webhooks/resend            Resend event handler (delivered, opened, clicked, bounced, unsubscribed)
```

---

## 8. Build Plan

Estimated 3–4 weeks solo with Claude Code.

### Milestone 1 — Foundation (Days 1–3)

- [ ] Scaffold `hubba/` monorepo (client + server)
- [ ] Prisma schema + migration + Supabase connection
- [ ] Supabase Auth (login page, protected routes)
- [ ] Brand seed data (Loan Fair, klasp)
- [ ] App shell: black sidebar with Hubba SVG logo, amber nav, brand switcher, routes
- [ ] `globals.css` with all CSS variables and base typography

### Milestone 2 — Lead Pipeline (Days 4–9)

- [ ] Lead list view (table + filter panel)
- [ ] Lead Kanban (`@dnd-kit/core`)
- [ ] Lead detail slide-over
- [ ] Create / edit lead form
- [ ] Activity log
- [ ] Webhook ingestion endpoint
- [ ] Lead CSV import (`/leads/import` — upload, map, preview, confirm)

### Milestone 2b — Contacts (Days 9–11)

- [ ] Contact list page (table with unsubscribed badge)
- [ ] Contact detail slide-over (leads, email history, unsubscribed toggle)
- [ ] Contact CSV import (`/contacts/import` — same UX pattern as lead import)
- [ ] `/unsubscribe` public page (token-verified, branded, no auth required)
- [ ] `POST /api/contacts/unsubscribe` endpoint (verify JWT, set flag, insert EmailEvent)
- [ ] CSV template download for both contact and lead imports

### Milestone 3 — Referrer Tracking (Days 10–13)

- [ ] Referrer list + detail pages
- [ ] Create / edit referrer form
- [ ] UTM auto-attribution on webhook
- [ ] Manual referrer assignment
- [ ] Performance stats
- [ ] Referrer report email

### Milestone 4 — Email Campaigns (Days 14–20)

- [ ] Campaign list
- [ ] Monaco HTML editor + live preview
- [ ] Starter template library
- [ ] Segment builder + recipient count
- [ ] Send pipeline (batched Resend)
- [ ] Test send
- [ ] Resend webhook handler
- [ ] Campaign analytics page

### Milestone 5 — Polish & Deploy (Days 22–26)

- [ ] Global search
- [ ] Mobile-responsive audit
- [ ] Error states, loading skeletons
- [ ] Vercel + Render deployment
- [ ] End-to-end smoke test

---

## 9. Claude Code Prompting Guide

Use these prompts in order. Each is scoped to avoid context overload.

---

### Phase 1: Scaffold

```
Create a monorepo called hubba/ with:
- client/ — React + Vite, React Router v6, Tailwind CSS, Axios
- server/ — Node.js + Express, CORS, dotenv, Prisma

In client/src/globals.css, add CSS variables for the Hubba design system:
  --hubba-amber: #fbb040
  --hubba-black: #0f0f0f
  --hubba-surface: #f7f5f0
  --hubba-text: #1a1a1a
  --font-display: 'Fraunces', Georgia, serif
  --font-body: 'DM Sans', system-ui, sans-serif
  --font-mono: 'JetBrains Mono', monospace

Add Google Fonts import for Fraunces (700, 800 italic), DM Sans (400, 500, 600),
and JetBrains Mono to client/index.html.

Don't implement features yet — just scaffold and confirm it runs.
```

---

### Phase 2: Database

```
Create prisma/schema.prisma using the schema in Section 4 of the Hubba spec.
Run the migration against DATABASE_URL in .env.
Seed the database with two Brands:
  { name: "Loan Fair", slug: "loan-fair", primaryColor: "#356852", fromEmail: "hello@loanfair.com.au" }
  { name: "klasp", slug: "klasp", primaryColor: "#2D5F4F", fromEmail: "hello@klasp.com.au" }
```

---

### Phase 3: Auth

```
Add Supabase Auth to Hubba.

Server: JWT validation middleware on all /api/* routes using SUPABASE_SERVICE_KEY.
Client: /login page (email + password), useAuth hook, ProtectedRoute wrapper.
On login success, redirect to /leads.

Style the login page using Hubba brand tokens: black background, amber CTA button,
Fraunces heading "Welcome to Hubba".
```

---

### Phase 4: App Shell

```
Build the Hubba app shell in client/src:

Sidebar (left, fixed, 240px wide):
- Background: var(--hubba-black)
- Top: Hubba SVG logo (import from src/assets/Logo.svg), 36px tall, with padding
- Below logo: brand switcher dropdown (Loan Fair | klasp | All Brands)
  - stores selection in React context, persists to localStorage
- Nav links: Leads, Campaigns, Referrers, Settings
  - inactive: white/50 text
  - active: amber text, left border 3px amber, subtle amber background tint

Content area (right of sidebar):
- Background: var(--hubba-surface)
- All API calls include X-Brand-Id header from brand context
```

---

### Phase 5: Leads — List and Kanban

```
Build the leads section:

Server — GET /api/leads:
  Query params: brandId, status (array), source, referrerId, tags (array),
  search (name/email), dateFrom, dateTo, page, limit
  Returns leads with joined contact + referrer

Client — /leads page:
  - Toggle bar: "Pipeline" (kanban) | "List" (table), persisted to localStorage
  - Kanban: columns per LeadStatus enum, cards show contact name + email + source badge
    Drag with @dnd-kit/core → PATCH /api/leads/:id { status }
  - List: table with columns: Name, Email, Brand, Status badge, Source, Referrer, Created
    Sortable headers, row click opens slide-over
  - Filter panel (collapsible): Status checkboxes, Source select, Date range, Tags input

Status badge colours from brand token system (badge-new, badge-contacted, etc.)
```

---

### Phase 6: Lead Detail

```
Add a slide-over panel for lead detail (renders from the right, overlays content).

Contents:
- Header: contact full name (Fraunces font), email, phone, source badge, brand badge
- Status row: pill buttons for each LeadStatus (highlight active in amber)
  On change: PATCH /api/leads/:id { status }, auto-POST to /api/leads/:id/activities
  with type "status_change" and meta { from, to }
- Fields: Loan type, Loan amount, Referrer (dropdown), Tags (chip input)
- Notes: textarea + "Add note" button → POST /api/leads/:id/activities { type: "note", body }
- Activity log: reverse-chron list with icons per type (note, status_change, email_sent)
- Footer: "Send email" button (opens campaign compose modal), Edit, Delete
```

---

### Phase 6b: Contacts

```
Build the contacts section in Hubba:

Server:
- GET /api/contacts — list with search (name/email) + unsubscribed filter
- GET /api/contacts/:id — detail: contact fields + all leads (with brand) + email event history
- PATCH /api/contacts/:id — update name, phone; allow setting unsubscribed: true/false
  (manual re-subscribe: log an Activity on the associated lead if one exists)
- GET /api/contacts/import/template — return a CSV file with correct headers for download

Client:
- Add "Contacts" to the sidebar nav (between Leads and Campaigns)
- /contacts list: table with columns: Name, Email, Phone, Brands (pill per brand), Leads count,
  Unsubscribed badge (amber warning style if true)
  Search bar at top; "Unsubscribed only" toggle filter; "Import" button → /contacts/import
- Contact detail slide-over (same pattern as lead detail):
  Header: name, email, phone, unsubscribed badge if applicable
  Leads section: list of associated leads with brand badge + status badge
  Email history: list of EmailEvents (campaign name, event type, date)
  Footer: "Re-subscribe" button (only visible if unsubscribed = true) with confirmation prompt
```

---

### Phase 6c: CSV Import (Contacts & Leads)

```
Build a shared CSV import component and wire it to both /contacts/import and /leads/import.

Shared ImportWizard component (3 steps):

Step 1 — Upload:
  Drag-and-drop zone or file picker (accept .csv only)
  "Download template" link → GET /api/contacts/import/template or /api/leads/import/template
  On file select: parse first row client-side (PapaParse) to extract headers

Step 2 — Map columns:
  Show detected CSV headers on the left
  Show required/optional field names on the right
  Auto-map where header names match (case-insensitive)
  Operator can override mapping via dropdowns
  "Skip column" option for unrecognised columns

Step 3 — Preview & confirm:
  Show first 5 data rows with mapped values
  Highlight any validation errors (missing email, invalid email format, unrecognised boolean)
  Show estimate: "X rows ready to import, Y rows with errors"
  "Import" button (amber) → POST to /api/contacts/import or /api/leads/import
  Response: { created: N, updated: N, skipped: N, errors: [{row, message}] }
  Show summary toast; if errors > 0, offer "Download error report" (CSV of failed rows)

Server — POST /api/contacts/import:
  Accept multipart/form-data with CSV file + columnMap JSON
  Parse CSV, upsert Contact records by email
  Apply unsubscribed field if present (never override true → false without explicit flag)
  Return summary object

Server — POST /api/leads/import:
  Same as contact import, but also requires brandId column/mapping
  Upsert Contact + create Lead per row (status: NEW, source: "csv-import")
```

---



```
Add POST /api/leads webhook endpoint (no JWT auth, use X-Webhook-Secret header instead).

Accepts:
  email, firstName, lastName, phone, source, loanType, loanAmount,
  utm_source, brandId (or brandSlug)

Logic:
  1. Find Brand by brandId or brandSlug
  2. Upsert Contact by email (create if new, update name/phone if provided)
  3. Create Lead linked to Contact + Brand, status: NEW
  4. If utm_source matches any Referrer.utmSource for this Brand, set referrerId
  5. Return { success: true, leadId }

Test with curl or Postman. Wire up Loan Fair intake form to this endpoint.
```

---

### Phase 8: Referrers

```
Build the referrers section in Hubba:

Server:
- CRUD routes for /api/referrers (auth required)
- GET /api/referrers/:id/leads — leads + stats (total, converted, conversion rate)
- POST /api/referrers/:id/report — send Resend email to referrer.email:
    Subject: "Your Hubba performance report — [Brand Name]"
    Content: leads sent, conversion rate, top month, built from referrer-report template

Client:
- /referrers list: table with Name, Company, Tier badge, Leads, Conv. Rate, Last Activity
  "New Referrer" button top right (amber, Hubba style)
- /referrers/:id detail: stats cards (total leads, converted, rate), leads table below
  "Send report" button → POST + toast notification on success
- Modal for create/edit: Name, Company, Email, Phone, Tier select, UTM Source, Notes
```

---

### Phase 9: Campaigns

```
Build the campaigns section in Hubba:

Server:
- CRUD for /api/campaigns
- POST /api/campaigns/:id/send:
    Resolve contacts from segmentRules (query leads table with filters, get unique contact emails,
    exclude unsubscribed contacts)
    Create CampaignSend per contact
    Dispatch via Resend in batches of 50, replace {{first_name}} {{brand_name}} {{unsubscribe_url}}
    Update campaign status to SENDING → SENT
- POST /api/campaigns/:id/test — send to single address (no CampaignSend record)
- POST /api/webhooks/resend — handle delivered/opened/clicked/bounced/unsubscribed events
    Insert EmailEvent, mark contact unsubscribed if event = "unsubscribed"
- GET /api/campaigns/:id/stats — aggregate counts + hourly timeline for 48h post-send

Client:
- /campaigns list: cards per campaign showing name, status badge, recipient count, open rate
- /campaigns/new — 3-step wizard:
    Step 1 "Compose":
      Left: Monaco editor (@monaco-editor/react) with HTML, syntax highlight
      Right: live preview iframe (srcdoc updates on change)
      Template picker dropdown above editor (3 templates)
      Mobile preview toggle (sets iframe width to 375px)
    Step 2 "Audience":
      Segment rule builder: Status (multi-check), Tags (chip), Source (select), Referrer (select)
      Live count: "X contacts will receive this email"
    Step 3 "Review & Send":
      Summary card, from/subject fields, Send Now or Schedule (date/time picker)
      Confirm button (amber) → POST /api/campaigns/:id/send
- /campaigns/:id analytics:
    Stat cards: Sent, Delivered, Opens, Clicks, Bounces, Unsubscribes + rates
    Recharts LineChart: opens + clicks over 48h
    Table: per-contact status (who opened, clicked, bounced)
```

---

### Phase 10: Email Templates

```
Create 3 starter HTML email templates in server/lib/emailTemplates.js.
Each is a complete HTML string supporting merge tags:
  {{first_name}}, {{brand_name}}, {{unsubscribe_url}}

Templates:
1. "loan-fair" — single column, forest green header (#356852), cream body (#ecdbba)
   Header: Loan Fair logo placeholder text, tagline
   Body: content area, amber CTA button
   Footer: unsubscribe link, muted disclaimer text

2. "klasp" — single column, sage header (#2D5F4F), white body
   Header: klasp logo placeholder, Fraunces heading
   Body: content area, sage CTA button
   Footer: unsubscribe link

3. "plain" — minimal, no brand colour, works for either brand
   White background, dark text, simple footer with unsubscribe

Each should be responsive (max-width 600px, fluid on mobile).
Export as: module.exports = { templates: { 'loan-fair': '...', 'klasp': '...', plain: '...' } }
```

---

### Final: Deploy

```
Prepare Hubba for deployment:

client/ (Vercel):
  - vercel.json with rewrites to handle SPA routing
  - VITE_API_URL env var pointing to Render server URL
  - Ensure /unsubscribe route is included in React Router and NOT behind ProtectedRoute

server/ (Render):
  - Set env vars: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY,
    RESEND_API_KEY, WEBHOOK_SECRET, UNSUBSCRIBE_SECRET, CLIENT_URL (for CORS)
  - Add GET /api/health → { ok: true, version: "1.0.0" }

Post-deploy smoke test:
  1. Login → dashboard loads
  2. POST /api/leads webhook → lead appears in kanban
  3. Import a 5-row contacts CSV → verify created/updated counts
  4. Create campaign → test send to your email → click unsubscribe link → verify contact flagged
  5. Re-run campaign send → confirm unsubscribed contact excluded from recipient list
  6. Referrer report email sends
```

---

*End of Hubba specification. Build something great.*
