# Necessary Treasures

A handmade storefront built with Next.js, Drizzle ORM, and PostgreSQL. Visit `/admin` to manage the workshop.

## Owner quick start

- **Dashboard:** `/admin`. Demo password: `handmade2026`. **Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` to unique secret values before launch.**
- **Products:** Add/edit photos, descriptions, pricing, quantities, personalization and publishing in Products. Set quantity to `0` to show a sold piece with a custom-order invitation.
- **Custom requests & orders:** Manage statuses and tracking numbers in the dashboard. Orders placed online are **reservation requests**, not paid purchases, until a payment provider is connected.
- **Shows, reviews, gallery:** Add them from the corresponding dashboard tabs. Sample reviews are visibly labeled until real ones are added.
- **Home hero photo:** Replace `public/images/hero-workshop.jpg` with your own photograph using the same filename. Product photos can be uploaded in the dashboard. The editable sample catalog is defined in `src/lib/catalog.ts`.
- **Logo and loader:** The custom monogram is shared in `src/components/Site.tsx` (`Logo` and loader). Its colors and scale are controlled by `src/app/globals.css`.
- **Brand colors:** Update CSS variables at the top of `src/app/globals.css`.

## Environment setup

Required: `DATABASE_URL`.

Recommended before launch:

- `ADMIN_PASSWORD` — a strong private dashboard password.
- `ADMIN_SESSION_SECRET` — a separate long random secret for the signed session cookie.
- `NEXT_PUBLIC_SITE_URL` — your final HTTPS domain for SEO links and sitemap.
- `RESEND_API_KEY`, `EMAIL_FROM` — optional Resend transactional email credentials, with a verified sender domain.
- `OWNER_EMAIL` — maker inbox for custom requests and general messages.
- `SALES_EMAIL` — sales inbox for orders and order questions; falls back to `OWNER_EMAIL`.

The site saves all messages, orders, signups, and custom requests to PostgreSQL even when email is not configured. Email delivery activates automatically when the Resend settings above are available.

## Payments and fulfillment

The checkout intentionally **does not accept or store card details**. It creates an order reservation, emails the customer and maker when email is enabled, and prompts the owner to confirm shipping, taxes, and collect payment through their existing merchant processor. To take live online payments, integrate your processor’s hosted checkout within `src/app/api/store/route.ts` after creating the order, then redirect from `CheckoutPage` in `src/components/Site.tsx` to the hosted payment URL. Confirm payment with a verified webhook before marking orders `Paid`. Configure shipping and tax rates with your processor or a rate service. Never put secret processor credentials in client code.

## Database

Apply schema changes with `npx drizzle-kit push`. The first-time catalog can be loaded from the dashboard’s Overview or Products tab. Database tables live in `src/db/schema.ts`.

## Notes

Craft-show QR codes can point to `/hello`. Replace sample reviews and placeholder social URLs before publishing. Photo placeholders are remotely hosted by Pexels; replace them with original owner photography when available. The site is responsive and honors reduced-motion preferences.
