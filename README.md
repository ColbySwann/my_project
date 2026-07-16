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
- **Java 21 + Spring Boot 4** (Gradle)
- **Spring Security** as an OAuth2/OIDC *client* of Shopify's Customer Account API
  — handles customer login and order history (see below)
- **PostgreSQL** for session storage and OAuth2 token persistence
- **JUnit 5 + MockMvc + Mockito** for tests

Package management is done with **yarn** for the frontend — don't mix in
`npm install` (a `package-lock.json` will conflict with `yarn.lock`). The
whole repo is one Gradle build (root `build.gradle` + `backend/build.gradle`
subproject) — `./gradlew build` from the repo root runs both frontend and
backend tests and produces a single Spring Boot jar with the built frontend
bundled inside it (see "Building & running as a single server" below).

## Getting started

There are two ways to run this locally — pick based on what you're doing:

**Iterating on the frontend (hot reload, fastest feedback):**

```bash
yarn install
yarn dev

# Backend, in another terminal — see "Customer accounts" below for env vars
docker compose up -d postgres
cd backend
../gradlew bootRun
```

The Vite dev server proxies `/api`, `/oauth2`, `/login`, and `/logout` to the
backend at `http://localhost:8080` (see `vite.config.ts`), so the backend's
session cookie stays first-party in the browser during local dev.

**Running it the way it'll actually deploy (one jar, one port):**

```bash
docker compose up -d postgres
./gradlew build
java -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar
```

Now `http://localhost:8080` serves everything — the storefront, `/account`,
and `/api/**` — from one process. See "Building & running as a single
server" below for how that's wired.

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

| Command                       | Description                                              |
| ------------------------------ | --------------------------------------------------------- |
| `./gradlew test`                | Run backend tests only                                    |
| `./gradlew check`               | Run frontend *and* backend tests                          |
| `./gradlew build`               | `check` + produce `backend/build/libs/backend-*.jar` (with the frontend bundled inside) |
| `./gradlew :backend:bootRun`    | Run the backend alone (no frontend bundling) — use this for the two-process dev workflow above |
| `java -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar` | Run the built single-server jar    |

## Building & running as a single server

`./gradlew build` from the repo root does all of this in one command:

1. `frontendTest` (root `build.gradle`) — `yarn test`
2. `:backend:test` — the JUnit suite
3. `frontendBuild` (root `build.gradle`) — `yarn build`, producing `dist/`
4. `:backend:bootJar` — copies `dist/` into the jar's `static/` folder and
   packages the whole Spring Boot app, frontend included

The result, `backend/build/libs/backend-0.0.1-SNAPSHOT.jar`, is a normal
executable Spring Boot jar (`java -jar ...`) that serves the storefront,
`/account`, and `/api/**` all from one process on one port. A few things
had to change to make that work cleanly:

- **`SecurityConfig`** now only requires authentication for `/api/**` —
  everything else (the storefront pages) is public, same as a real
  ecommerce site. Previously *everything* required auth, which made sense
  when the frontend was a separate app the backend never served.
- **`SpaFallbackController`** makes client-side routes (`/account`,
  `/products/aloha-runner`, ...) survive a hard refresh or direct link.
  Spring's static file handler only knows about real files (`index.html`,
  `assets/*.js`); anything else 404s first, and this controller (which
  implements `ErrorController`) catches that and forwards non-`/api` 404s to
  `index.html` so React Router can take over client-side. It resets the
  response to `200` (a servlet forward doesn't do that on its own) and has
  a guard against forwarding to itself if `index.html` is ever missing
  (e.g. if you run the jar without ever having built the frontend).
- **CORS** stays configured (for the two-process dev workflow) but is moot
  once frontend and backend are the same origin — harmless either way.

This bundling logic is deliberately hooked onto `:backend:bootJar` directly
rather than the main Java source set's resources, so plain `./gradlew
:backend:test` / `:backend:compileJava` never need the frontend built at
all — only packaging the final jar does.

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
   at any Postgres instance), then `../gradlew bootRun` (from `backend/`, or
   `./gradlew :backend:bootRun` from the repo root).

Running `./gradlew :backend:test` never needs any of this — it runs under a `test` Spring
profile that omits Shopify's OAuth2 registration entirely (so no live network
call happens at test-context startup) and only needs a local Postgres for the
session/token schema. Without credentials configured, `/api/**` still boots
fine and correctly 401s; there just isn't a login flow to reach yet, and the
frontend's `/account` page shows a sign-in prompt.

### Local dev without real Shopify credentials (Keycloak)

If you just want to exercise the login flow itself — redirect, callback,
session cookie, `GET /api/me` — without a real Shopify store, a `local`
Spring profile points the same `shopify` OAuth2 client registration at a
local [Keycloak](https://www.keycloak.org/) instance instead, seeded with a
test user via `backend/keycloak/realm-export.json`:

```bash
docker compose --profile keycloak up -d
SPRING_PROFILES_ACTIVE=local ./gradlew :backend:bootRun
```

Then visit `http://localhost:8080/oauth2/authorization/shopify` (or click
"Sign in with Shopify" on the frontend's `/account` page while it's proxied
to this backend) and sign in with the seeded user: **jane / jane**.

This only stands in for *login* — `GET /api/orders` still calls Shopify's
real Customer Account GraphQL API, which a Keycloak-issued token can't
authenticate against, so that endpoint will still fail under this profile.
It's for validating the OAuth2/session/CORS/CSRF machinery in isolation, not
a full Shopify mock. See the comments in `application-local.yml` for details.

> This repo's sandboxed dev environment couldn't run Docker's daemon, so the
> full login round-trip (Keycloak realm import → redirect → callback →
> session) hasn't been exercised end-to-end here — only that `application-local.yml`'s
> properties resolve correctly and correctly trigger OIDC discovery against
> `http://localhost:8081/realms/socktical` (confirmed via the expected
> "connection refused" when nothing's listening there yet). Worth a quick
> manual smoke test on a machine with Docker before relying on it.

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
- `backend/src/main/java/.../web/SpaFallbackController.java` — lets client-side
  routes survive a hard refresh once the frontend is bundled in (see
  "Building & running as a single server" above)
- `backend/src/main/resources/application-local.yml`,
  `backend/keycloak/realm-export.json` — the local Keycloak stand-in above
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

backend/                # Backend (Spring Boot, Gradle subproject)
├── build.gradle         # Deps + the bootJar-bundles-the-frontend wiring
└── src/main/java/com/socktical/backend/
    ├── config/          # Security + OAuth2 client persistence config
    ├── shopify/          # Shopify Customer Account API GraphQL client
    └── web/               # REST controllers, DTOs, SpaFallbackController

build.gradle             # Root: frontend test/build tasks (see above)
settings.gradle           # Includes the `backend` subproject
```

## Testing

**Frontend** — tests live alongside the code they cover (`*.test.ts` /
`*.test.tsx`) and run with Vitest + React Testing Library + jsdom. Network
calls to Shopify are mocked — no live store or credentials required.

```bash
yarn test
```

**Backend** — JUnit 5 + MockMvc + Mockito, run via Gradle. Needs a local
Postgres reachable at `jdbc:postgresql://localhost:5432/socktical_test`
(`docker compose up -d postgres` and create that database, or point
`backend/src/test/resources/application-test.yml` at your own). No Shopify
credentials needed — the `test` profile skips that config entirely.

```bash
./gradlew :backend:test
```

**Both at once** — `./gradlew check` (or `build`, which includes it) from
the repo root runs the frontend suite and the backend suite together.

## Adding shadcn/ui components

This environment's egress policy blocks `ui.shadcn.com`, so the `shadcn` CLI's
`add` command won't work here. New components can be added by hand — copy the
component source from the [shadcn/ui docs](https://ui.shadcn.com/docs/components)
into `src/components/ui/`, matching the existing "new-york" style components
already in that folder.
