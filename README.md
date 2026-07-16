# Socktical

Performance sock storefront. React + TypeScript, built with Vite, Tailwind CSS, and
shadcn/ui, backed by Shopify's Storefront API for products, cart, and checkout, plus
a Spring Boot backend for customer accounts and order history.

## Stack

**Frontend** (repo root)
- **React 19 + TypeScript** via Vite
- **Tailwind CSS v4** for styling
- **shadcn/ui** (Radix primitives, "new-york" style) for base components — see
  `src/components/ui`
- **lucide-react** for icons
- **react-router-dom** for client-side routing
- **Shopify Storefront API** for product data and cart/checkout (see below)
- **Vitest + React Testing Library** for tests

**Backend** (`backend/`)
- **Java 21 + Spring Boot 4** (Maven)
- **Spring Security** as an OAuth2/OIDC *client* of Shopify's Customer Account API
  — handles customer login and order history (see below)
- **PostgreSQL** for session storage and OAuth2 token persistence
- **JUnit 5 + MockMvc + Mockito** for tests

Package management is done with **yarn** for the frontend — don't mix in
`npm install` (a `package-lock.json` will conflict with `yarn.lock`).

## Getting started

```bash
# Frontend
yarn install
yarn dev

# Backend (in another terminal) — see "Customer accounts" below for env vars
docker compose up -d postgres
cd backend
./mvnw spring-boot:run
```

The Vite dev server proxies `/api`, `/oauth2`, `/login`, and `/logout` to the
backend at `http://localhost:8080` (see `vite.config.ts`), so the backend's
session cookie stays first-party in the browser during local dev.

## Scripts

| Command              | Description                              |
| --------------------- | ----------------------------------------- |
| `yarn dev`             | Start the Vite dev server                |
| `yarn build`           | Type-check and build for production      |
| `yarn preview`         | Preview the production build locally     |
| `yarn lint`            | Run Oxlint                                |
| `yarn test`            | Run the test suite once                  |
| `yarn test:watch`      | Run tests in watch mode                  |
| `yarn test:coverage`   | Run tests with coverage report           |

## Shopify integration

Product listings, product detail, and cart/checkout are powered by Shopify's
**Storefront API** — this app never talks to Shopify's Admin API directly, so no
backend server is required. Checkout itself is handed off to Shopify's hosted
checkout via the cart's `checkoutUrl`, so payment and order processing are
handled entirely by Shopify.

1. In your Shopify admin, add a **Headless** sales channel (Sales channels →
   Headless) and create a Storefront API access token, **or** run
   `shopify app init` (via the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli))
   if you want a custom app for more control over the token's scopes.
2. Copy `.env.example` to `.env` and fill in your store domain and Storefront
   API token:

   ```bash
   cp .env.example .env
   ```

3. Restart `yarn dev` after editing `.env`.

Until credentials are configured, the homepage falls back to placeholder
product data so the UI remains usable during development.

### Where the integration lives

- `src/lib/shopify/client.ts` — low-level GraphQL fetch wrapper
- `src/lib/shopify/products.ts` — product queries + normalization
- `src/lib/shopify/cart.ts` — cart create/update/remove + normalization
- `src/hooks/use-cart.tsx` — `CartProvider`/`useCart`, persists the cart ID in
  `localStorage` and exposes `addItem` / `addItems` / `updateItem` / `removeItem`
- `src/types/shopify.ts` — shared TypeScript types for products and carts

## Customer accounts & order history (backend)

Signed-in customer accounts — login, profile, and order history for fast
reordering — are handled by the `backend/` Spring Boot app, which acts as an
OAuth2/OIDC **client** of Shopify's Customer Account API. This is separate
from the Storefront API integration above: the frontend still talks to
Shopify directly for products/cart/checkout, and only calls the backend for
account-related data.

**Why a backend at all, and why Postgres:** Shopify's Customer Account API
uses OAuth 2.0 Authorization Code + PKCE with a confidential client (a client
secret), which shouldn't live in browser JS — the backend holds it and
performs the token exchange server-side. It's a BFF (backend-for-frontend):
the browser only ever holds an `HttpOnly` session cookie, never the OAuth2
tokens themselves. Postgres persists that session (`spring-session-jdbc`)
and the customer's access/refresh tokens (`JdbcOAuth2AuthorizedClientService`)
so login survives backend restarts and access tokens refresh silently.

### Setup

1. In your Shopify admin, go to **Sales channels → Headless** and set up the
   **Customer Account API**. That screen gives you the client ID, client
   secret, the exact issuer URI (for OIDC discovery), the callback URI to
   register, and the GraphQL API URL.
2. Register `http://localhost:8080/login/oauth2/code/shopify` as a callback
   URI for local dev.
3. Copy `backend/.env.example`, fill in the values, and export them into your
   shell (Spring Boot doesn't load `.env` files itself):

   ```bash
   cd backend
   cp .env.example .env
   set -a && source .env && set +a
   ```

4. `docker compose up -d postgres` (or point `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`
   at any Postgres instance), then `./mvnw spring-boot:run`.

Running `./mvnw test` never needs any of this — it runs under a `test` Spring
profile that omits Shopify's OAuth2 registration entirely (so no live network
call happens at test-context startup) and only needs a local Postgres for the
session/token schema. Without credentials configured, `/api/**` still boots
fine and correctly 401s; there just isn't a login flow to reach yet, and the
frontend's `/account` page shows a sign-in prompt.

### Where it lives

- `backend/src/main/java/.../config/SecurityConfig.java` — CORS, CSRF,
  session-based auth, and the conditional `oauth2Login` wiring
- `backend/src/main/java/.../config/OAuth2ClientPersistenceConfig.java` —
  Postgres-backed session/token persistence + refresh
- `backend/src/main/java/.../shopify/ShopifyCustomerAccountClient.java` —
  GraphQL client for order history (best-effort against Shopify's public
  docs — verify field names against your store's live schema explorer if
  orders come back empty)
- `backend/src/main/java/.../web/AccountController.java`,
  `OrderController.java` — `GET /api/me`, `GET /api/orders`
- `src/pages/Account.tsx` — sign-in prompt / profile / order history +
  one-click "Reorder" (bulk-adds an order's variant IDs back into the
  Storefront API cart via `useCart().addItems`)

## Project structure

```
src/                   # Frontend (Vite + React)
├── components/
│   ├── ui/             # shadcn/ui primitives (button, card, badge, sheet, ...)
│   ├── layout/          # Header, Footer, Layout
│   └── product/         # ProductCard, etc.
├── pages/               # Route-level pages (Home, ProductListing, ProductDetail, Cart, Account)
├── hooks/                # useCart and other hooks
├── lib/
│   ├── shopify/           # Storefront API client + queries/mutations
│   ├── backend/            # Client for this repo's Spring Boot backend
│   └── utils.ts             # cn() class-merging helper
└── types/                    # Shared TypeScript types

backend/                # Backend (Spring Boot)
└── src/main/java/com/socktical/backend/
    ├── config/          # Security + OAuth2 client persistence config
    ├── shopify/          # Shopify Customer Account API GraphQL client
    └── web/               # REST controllers + DTOs
```

## Testing

**Frontend** — tests live alongside the code they cover (`*.test.ts` /
`*.test.tsx`) and run with Vitest + React Testing Library + jsdom. Network
calls to Shopify are mocked — no live store or credentials required.

```bash
yarn test
```

**Backend** — JUnit 5 + MockMvc + Mockito, run via Maven. Needs a local
Postgres reachable at `jdbc:postgresql://localhost:5432/socktical_test`
(`docker compose up -d postgres` and create that database, or point
`backend/src/test/resources/application-test.yml` at your own). No Shopify
credentials needed — the `test` profile skips that config entirely.

```bash
cd backend
./mvnw test
```

## Adding shadcn/ui components

This environment's egress policy blocks `ui.shadcn.com`, so the `shadcn` CLI's
`add` command won't work here. New components can be added by hand — copy the
component source from the [shadcn/ui docs](https://ui.shadcn.com/docs/components)
into `src/components/ui/`, matching the existing "new-york" style components
already in that folder.
