# StreetVault - Premium Streetwear Test Store

Premium dark-mode ecommerce test store using Next.js 14 + TypeScript + Tailwind + Stripe + SQLite.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Stripe Embedded Checkout (test mode)
- SQLite (`data/store.db`) for products, variants, inventory, orders, analytics

## Features

- Premium storefront with dark modern UI
- Transparent header with centered category nav
- Home sections: cinematic hero video, top sellers, outfit builder, trust blocks
- Dedicated category routes: `/clothes`, `/shoes`, `/hoodies`, `/pants-jeans`, `/accessories`, `/outfit-builder`
- Shop filters: search, category, size, sort
- Product page: gallery, variant selection (size/color), stock states, quantity, add to cart, buy now
- Cart with subtotal + shipping summary
- Animated add-to-cart confirmation toast
- Embedded checkout page with Stripe
- Admin dashboard:
  - revenue/profit/order metrics (paid/shipped/delivered/cancelled)
  - product create/edit/delete with transparent builder image field
  - inventory holder/location tracking per size variant
  - inventory movement logs
  - order status/fulfillment/tracking updates
  - low stock threshold + flat shipping settings

## Setup

1) Install dependencies

```bash
npm install
```

2) Create env file

```bash
cp .env.example .env.local
```

3) Add Stripe test keys to `.env.local`

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4) Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

5) Add hero video file

Place your cinematic video here:

- `public/background.mp4`

## Test Payment

1. Add items to cart.
2. Go to embedded checkout.
3. Use test card:
   - `4242 4242 4242 4242`
   - any future expiry
   - any CVC
   - any postcode
4. Confirm success redirect to `/success`.

## Data + Files

- Database file: `data/store.db`
- Core store data layer: `src/lib/store-db.ts`
- Stripe server key usage: `src/lib/stripe.ts`
- Stripe publishable key usage: `src/lib/stripe-client.ts`

## Transparent product images (important)

- Product model supports:
  - `mainImage` (main storefront image)
  - `images` (gallery)
  - `builderImage` (optional transparent PNG/WebP for outfit composition)
- Outfit builder preview uses `builderImage` first, then falls back to `mainImage`, then first gallery image.
- Background removal is **not** automatically done by this app.
  - For best builder quality, upload already-isolated transparent PNG/WebP assets.
  - Automatic background removal can be integrated later via a real external service/model.

## Important

- Test mode only.
- Currency AUD.
- Never expose `STRIPE_SECRET_KEY` on frontend.

## Deploy on Render

This repo now includes `render.yaml` with a persistent disk mount for SQLite at `/opt/render/project/src/data` so `data/store.db` remains durable across deploys/restarts.

1. Push your repo to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Set required environment variables in Render:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `APP_URL` (your Render public URL)
   - `JWT_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
4. Deploy.
5. Update Stripe webhook endpoint to:
   - `https://<your-render-domain>/api/stripe/webhook`
6. Run a full test order in Stripe test mode and verify:
   - order is created once
   - stock deducts correctly
   - confirmation/shipping/delivered emails still behave correctly
