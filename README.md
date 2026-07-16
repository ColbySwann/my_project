# Socktical

Performance sock storefront. React + TypeScript, built with Vite, Tailwind CSS, and
shadcn/ui, backed by Shopify's Storefront API for products, cart, and checkout.

## Stack

- **React 19 + TypeScript** via Vite
- **Tailwind CSS v4** for styling
- **shadcn/ui** (Radix primitives, "new-york" style) for base components — see
  `src/components/ui`
- **lucide-react** for icons
- **react-router-dom** for client-side routing
- **Shopify Storefront API** for product data and cart/checkout (see below)
- **Vitest + React Testing Library** for tests

Package management is done with **yarn** — don't mix in `npm install`
(a `package-lock.json` will conflict with `yarn.lock`).

## Getting started

```bash
yarn install
yarn dev
```

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
  `localStorage` and exposes `addItem` / `updateItem` / `removeItem`
- `src/types/shopify.ts` — shared TypeScript types for products and carts

## Project structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui primitives (button, card, badge, sheet, ...)
│   ├── layout/       # Header, Footer, Layout
│   └── product/      # ProductCard, etc.
├── pages/            # Route-level pages (Home, ProductListing, ProductDetail, Cart)
├── hooks/            # useCart and other hooks
├── lib/
│   ├── shopify/       # Storefront API client + queries/mutations
│   └── utils.ts       # cn() class-merging helper
└── types/             # Shared TypeScript types
```

## Testing

Tests live alongside the code they cover (`*.test.ts` / `*.test.tsx`) and run
with Vitest + React Testing Library + jsdom. Network calls to Shopify are
mocked in tests — no live store or credentials are required to run the suite.

```bash
yarn test
```

## Adding shadcn/ui components

This environment's egress policy blocks `ui.shadcn.com`, so the `shadcn` CLI's
`add` command won't work here. New components can be added by hand — copy the
component source from the [shadcn/ui docs](https://ui.shadcn.com/docs/components)
into `src/components/ui/`, matching the existing "new-york" style components
already in that folder.
