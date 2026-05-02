# WhatsApp Store Builder

## Overview

A SaaS platform where business owners create online stores and customers checkout via WhatsApp. Built as a pnpm monorepo with TypeScript.

## Architecture

```
artifacts/
  api-server/        — Express 5 REST API (port 8080, path /api)
  store-builder/     — React + Vite frontend (port variable, path /)
lib/
  db/                — Drizzle ORM + PostgreSQL schemas
  api-spec/          — OpenAPI spec + Orval codegen config
  api-zod/           — Generated Zod validation schemas
  api-client-react/  — Generated React Query hooks + custom fetch
```

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + shadcn/ui
- **Auth**: Clerk (with Clerk proxy through Express)
- **API**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod v4 + drizzle-zod
- **API codegen**: Orval (contract-first from OpenAPI spec)
- **State**: TanStack Query (React Query)
- **Routing**: Wouter

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite libs (db, api-zod, api-client-react)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema

Tables: `stores`, `products`, `categories`, `orders`

- `stores` — one store per user (userId unique), has WhatsApp number, slug, currency, theme
- `products` — belong to a store, have price (numeric), imageUrl, category, stock, isAvailable
- `categories` — belong to a store, used for filtering products on storefront
- `orders` — belong to a store, items stored as JSONB array

## API Routes (all under /api)

- `GET/PUT /stores/me` — authenticated store management
- `POST /stores` — create a store
- `POST /stores/generate` — AI-like store config generation from description
- `GET /stores/:slug` — public store info
- `GET/POST /products` — authenticated product management
- `GET/PUT/DELETE /products/:id` — individual product CRUD
- `GET /stores/:slug/products` — public product listing
- `GET/POST /categories` — authenticated category management
- `DELETE /categories/:id` — delete category
- `GET /stores/:slug/categories` — public categories
- `GET/POST /orders` — order listing (auth) and creation (public)
- `GET /orders/:id` — order detail (auth)
- `PATCH /orders/:id/status` — update order status
- `GET /dashboard/stats` — dashboard statistics
- `GET /dashboard/recent-orders` — recent orders
- `GET /dashboard/top-products` — top selling products

## Frontend Pages

- `/` — landing page (redirects to /dashboard if signed in)
- `/sign-in`, `/sign-up` — Clerk auth
- `/onboarding` — 3-step store creation wizard (describe → configure → launch)
- `/dashboard` — stats overview, recent orders, top products
- `/products` — product grid with search/filter
- `/products/new` — add product form
- `/products/:id/edit` — edit product form
- `/orders` — order list with status filter
- `/orders/:id` — order detail with status management + WhatsApp contact
- `/settings` — store settings + category management
- `/store/:slug` — public storefront with cart + WhatsApp checkout

## WhatsApp Checkout Flow

1. Customer adds products to cart on `/store/:slug`
2. Clicks "Checkout" → fills name/phone/notes
3. App calls `POST /api/orders` to record the order
4. Redirects to `https://wa.me/{number}?text={encoded message}` with order details

## Theme

WhatsApp-green palette (primary: `hsl(142 76% 36%)`). Dark sidebar, light content area. All CSS custom properties set in `artifacts/store-builder/src/index.css`.

## Auth Pattern

- Clerk proxy runs through Express at `/api/__clerk`
- `requireAuth` middleware reads `getAuth(req).userId`
- Frontend uses `Show when="signed-in"` / `Show when="signed-out"` from `@clerk/react`
- API client uses `setAuthTokenGetter` with Clerk session token

## Important Notes

- Orval config: zod `mode: "single"` — do NOT change to split
- `api-zod/src/index.ts` exports only from `"./generated/api"` — no `./generated/types`
- `lib/db` is composite — run `pnpm run typecheck:libs` before API server typecheck
- Product `price` is stored as `numeric` in DB, must be cast to `String` on insert and `Number` on read
- Public endpoints (storefront, orders POST) don't require auth
