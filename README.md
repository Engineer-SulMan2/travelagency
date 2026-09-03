# Travel Agency — Phase 1 through 5

Auth, database schema, role-based dashboards, flight/hotel/package
search + booking flows, sub-agent management with markup/commission,
and unified booking management + invoices + reports for a
multi-tenant travel agency platform (Agency Admins + Sub-Agents).

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS
- PostgreSQL + Prisma
- Auth.js (NextAuth v5) — Credentials provider, JWT sessions
- TanStack Query + Zustand
- Recharts (reports chart)

## Roles

- `SUPER_ADMIN` — platform owner
- `AGENCY_ADMIN` — owns an agency, manages sub-agents, sees `/admin/*`
- `SUB_AGENT` — sells under an agency, sees `/agent/*`

`middleware.ts` redirects each role to the right area and blocks sub-agents from `/admin/*`.

## Setup

```bash
npm install

cp .env.example .env
# fill in DATABASE_URL and AUTH_SECRET

npx prisma migrate dev --name init
npm run prisma:seed   # demo super admin / agency admin / sub-agent + 2 demo packages

npm run dev
```





## What's built, phase by phase

**Phase 1 — Auth + Database**
- `Agency` / `User` models, roles, hierarchy (`User.parentId`)
- Auth.js Credentials provider, JWT sessions, role-based middleware
- `/login`, `/register` (creates a new Agency + its Agency Admin)
- Basic role-aware dashboard shell (`components/dashboard-shell.tsx`)

**Phase 2 — Flight search + mock booking**
- `src/lib/mock-flights.ts` + `/api/flights/search` — deterministic mock "GDS" results
- `src/stores/booking-store.ts` + `src/components/flights/*` — search → passengers → review → confirm
- `src/lib/actions/create-booking.ts` — applies the agent's markup, writes `Booking` + `Passenger`
- `/agent/flights`, `/admin/flights`

**Phase 3 — Sub-agent management + markup/commission**
- `User.defaultMarkupPct` (markup %) and `User.commissionPct` (sub-agent's cut of the markup)
- `Agency.defaultMarkupPct` — pre-fills new sub-agent forms
- `src/lib/actions/sub-agents.ts` — create/edit/suspend sub-agents, set agency default markup
- `/admin/sub-agents`, `/admin/markup`

**Phase 4 — Hotels + Packages**
- `src/lib/mock-hotels.ts` + `/api/hotels/search`, `HotelBooking`/`HotelGuest` models
- `src/stores/hotel-booking-store.ts` + `src/components/hotels/*` — search → guests → review → confirm
- `/agent/hotels`, `/admin/hotels`
- `Package`/`PackageBooking` models — a curated catalog (not mock-generated); `agencyId: null` = platform-wide package
- `src/lib/actions/packages.ts` (admin CRUD), `/admin/packages/manage`
- `/agent/packages`, `/admin/packages` — browse + book inline (travel date, traveler count, lead traveler)
- `CommissionEntry` (Phase 3) generalized to a `productType` + three nullable FKs so flight/hotel/package commission all land in **one ledger**

**Phase 5 — Booking management, invoices, reports**
- `src/lib/bookings-query.ts` — normalizes flight/hotel/package bookings into one list
- `src/lib/actions/cancel-booking.ts` — unified, authorization-checked cancel
- `/agent/bookings`, `/admin/bookings` — filterable table, cancel action, invoice link
- `/invoice/[type]/[id]` — printable invoice ("Print / Save as PDF" via the browser; swap in `@react-pdf/renderer` later for server-generated/emailed PDFs)
- `src/lib/reports-query.ts` + `/admin/reports` — KPI cards, per-product breakdown, 14-day bookings chart

## Phase 8 — Polish, mobile responsive, testing

- **Mobile navigation**: `dashboard-shell.tsx` now shows a hamburger menu + slide-over drawer below the `md` breakpoint instead of a fixed sidebar; the drawer closes on navigation or backdrop tap
- **Loading states**: `loading.tsx` skeletons for both dashboard route groups (shown automatically by Next.js while a page's data is fetching)
- **Error handling**: `not-found.tsx` (404) and `error.tsx` (global error boundary with a "Try again" button) at the app root
- **Landing page**: `/` now shows a real marketing page (hero, feature grid, sign in / create agency CTAs) for logged-out visitors instead of a hard redirect to `/login`; logged-in visitors still redirect straight to their dashboard
- **Pricing logic extracted and tested**: `src/lib/pricing.ts` — `computeMarkup`, `computeCommissionSplit`, `computeBookingPricing` are now pure functions with no DB dependency, used by all three `create-*-booking` actions (previously this math was duplicated three times inline)
- **Unit tests** (Vitest): `npm test` runs 25 tests covering pricing math, mock flight/hotel search (determinism, sorting, bounds, cabin/city price relationships), and the ISO-8601 duration parser used by the Amadeus/Duffel providers
- Richer page metadata (title template, OpenGraph tags, theme color)

Run `npm test` to execute the test suite, or `npm run test:watch` while developing.

## Still ahead

Nothing from the original 8-phase plan — this covers Phase 1 through 8. Natural next steps beyond the original scope: end-to-end tests (Playwright) for the booking flows, a component/visual regression pass, and rate limiting on the public `/register` and `/api/*` routes before a real production launch.

## Folder structure (high level)

```
src/
  app/
    (auth)/login, register
    (dashboard)/admin/*      # sub-agents, flights, hotels, packages, bookings, reports, markup
    (dashboard)/agent/*      # flights, hotels, packages, bookings
    api/auth/[...nextauth], api/flights/search, api/hotels/search
    invoice/[type]/[id]      # printable invoice, outside the dashboard shell
  components/
    dashboard-shell.tsx, providers.tsx
    flights/, hotels/, packages/, bookings/, invoice/, reports/, sub-agents/, markup/
  lib/
    auth.ts, prisma.ts, utils.ts, airports.ts, cities.ts
    mock-flights.ts, mock-hotels.ts
    bookings-query.ts, reports-query.ts
    actions/ (register, create-booking, create-hotel-booking, create-package-booking,
               sub-agents, packages, cancel-booking)
  stores/ (booking-store.ts, hotel-booking-store.ts)
  types/ (flight, hotel, package, sub-agent, booking-summary, next-auth)
  middleware.ts
prisma/
  schema.prisma
  seed.ts
```

## Migration

Every schema change so far has been additive. From a fresh clone:

```bash
npx prisma migrate dev --name init
```

If you're pulling this update into an existing Phase 1–3 database instead, run:

```bash
npx prisma migrate dev --name add-hotels-packages-reports
```

## Phase 6 — Payment Gateway + Wallet

- `WalletTransaction` model — append-only ledger (`CREDIT`/`DEBIT`, a reason, a `balanceAfter` snapshot); `User.walletBalance` is kept in sync in the same DB transaction via `src/lib/wallet.ts`'s `recordWalletTransaction()`
- `src/lib/mock-payment-gateway.ts` — simulates Card/JazzCash/EasyPaisa processing (swap for real Stripe/JazzCash/EasyPaisa SDK calls later; only the `PaymentResult` shape matters to the rest of the app)
- `src/lib/actions/wallet.ts` — `topUpWallet` (self-service, via the mock gateway) and `adjustWallet` (agency admin manual credit/debit, e.g. for cash settlements)
- **Booking flow now actually spends the wallet**: `create-booking.ts` / `create-hotel-booking.ts` / `create-package-booking.ts` all check the wallet balance covers the booking's **net cost** before creating it, debit that net cost, and credit the sub-agent's commission — all in one `prisma.$transaction`. Insufficient balance blocks the booking with a clear message.
- Cancelling a booking (`cancel-booking.ts`) now refunds the net cost and claws back any commission already paid, in the same transaction as the status change.
- `/agent/wallet`, `/admin/wallet` — balance, top-up form, transaction history; admin additionally gets a sub-agent wallet adjustment tool

## Phase 7 — Real GDS/API integration

- `src/lib/flights/provider.ts` — factory that picks `mock` / `amadeus` / `duffel` based on `FLIGHT_PROVIDER` + credentials in `.env`, and **falls back to mock automatically** if the live call throws
- `src/lib/flights/amadeus.ts` — real Amadeus Self-Service flight-offers search (OAuth2 client-credentials flow, token cached in memory)
- `src/lib/flights/duffel.ts` — real Duffel offer-requests search
- `src/lib/hotels/provider.ts` + `src/lib/hotels/amadeus.ts` — same pattern for hotels (Amadeus hotels-by-city → hotel-offers), with `src/lib/hotels/city-codes.ts` mapping our city names to IATA city codes
- `/api/flights/search` and `/api/hotels/search` now call these factories instead of the mock generators directly
- **No code changes needed to go live** — just set `FLIGHT_PROVIDER` / `HOTEL_PROVIDER` and the relevant API keys in `.env` (see `.env.example`). Leave them unset and the app runs exactly as before, on mock data.

Run `npx prisma migrate dev --name add-wallet` to apply the new table after pulling this update. The seed script now also gives the demo Agency Admin and Sub-Agent starting wallet balances (PKR 1,000,000 and PKR 200,000) so bookings work immediately.

## Booking types — Flights, Hotels, Packages, Visa

The sidebar's **Bookings** section (collapsible, same style for every role) covers every product the platform sells:

- **Flights** — `/agent/flights`, `/admin/flights` (mock or real GDS, see Phase 7)
- **Hotels** — `/agent/hotels`, `/admin/hotels` (mock or real GDS, see Phase 7)
- **Holiday Packages** — `/agent/packages`, `/admin/packages` — generic curated packages (`Package.category = HOLIDAY`)
- **Tour Bookings** — `/agent/tours`, `/admin/tours` (`Package.category = TOUR`)
- **Umrah Bookings** — `/agent/umrah`, `/admin/umrah` (`Package.category = UMRAH`)
- **Group Bookings** — `/agent/group`, `/admin/group` (`Package.category = GROUP`)
- **Visa Bookings** — `/agent/visa`, `/admin/visa` — a separate `VisaBooking` model (no catalog; fee is looked up per country + visa type from `src/lib/visa-fees.ts`, then priced live in the form)
- **All Bookings** (admin) / **My Bookings** (agent) — the unified management list from Phase 5, now includes visa bookings too

Tour/Umrah/Group all reuse the same `Package`/`PackageBooking` tables and booking flow — they're the same product shape (title, destination, duration, inclusions, price per traveler), just split by `category` for a cleaner sidebar and separate catalogs. Admins add packages to any of the four categories from **Manage packages** (`/admin/packages/manage`).

`CommissionEntry` (the unified commission ledger from Phase 4) now has a fourth nullable FK (`visaBookingId`) alongside flight/hotel/package, so visa bookings show up in `/admin/reports` and the wallet ledger exactly like everything else.

Run `npx prisma migrate dev --name add-visa-and-package-categories` to apply the new table/column after pulling this update. The seed script now also creates two Umrah packages and one Group tour package (in addition to the existing two Tour packages).
