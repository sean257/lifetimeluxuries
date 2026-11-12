# Lifetime Luxuries — build brief

E-commerce site for **Lifetime Luxuries**, a Harare-based seller of men's luxury watches and accessories. Customers browse and build a bag; checkout sends the order to the owner on **WhatsApp** (no online payment in v1). The owner manages products, photos, orders and sales from a private **owner dashboard**.

Developer: Sean Chikobvu. Client: Lifetime Luxuries (owner is the only admin user).

## What's in this folder

| Path | What it is |
|---|---|
| `design/storefront-light.html` | **The UI source of truth.** Approved clickable prototype (shop + bag + WhatsApp checkout + owner dashboard). Open it in a browser. Port it faithfully. |
| `design/storefront-with-dark-mode.html` | Earlier variant with dark mode. Reference only; v1 is light-only. |
| `design/tokens.css` | Colour and type tokens. Use these exact values. |
| `public/brand/logo-original.jpg` | Client logo (photo of foil print). Ask the client for a vector/transparent PNG before launch. |
| `public/brand/logo-mark.svg` | Crown-and-diamond mark used in the header and as the image placeholder. |
| `supabase/migrations/20261030000000_init.sql` | Full database: tables, RLS, storage bucket + policies, `place_order()` RPC, stock trigger, `daily_sales` view. **Tested.** Do not rewrite it; add new migrations for changes. |
| `supabase/seed.sql` | 14 placeholder products from the prototype (no photos). |
| `.env.example` | Environment variables the app needs. |

## Stack (decided)

- **Next.js 15, App Router, TypeScript, strict mode**
- **Tailwind CSS v4**, with the tokens in `design/tokens.css` mapped into the theme (`--color-rose`, etc.). No component library; build the components to match the prototype.
- **Supabase**: Postgres + Auth (email/password) + Storage. Use `@supabase/ssr` for server and browser clients.
- **Zod** for validating every form and server action input.
- **browser-image-compression** (or canvas) for client-side photo compression before upload.
- Fonts via `next/font/google`: Cormorant Garamond (400/500/600), Jost (300/400/500), Pinyon Script (400).
- Deploy on **Vercel**. Package manager: pnpm.

## Design rules (from the prototype)

- Light only. Porcelain background `--bg`, white `--surface` panels, product photos sit on `--tile`.
- Rose gold `--rose` is the only accent: primary buttons, the wordmark, eyebrows, active bar in charts. Don't add other accent colours.
- Pinyon Script is for the wordmark "Lifetime" and the one hero word *lifetime* only. Headings and product names use Cormorant Garamond. Everything else uses Jost.
- Buttons: 2px radius, uppercase, 0.12em tracking. Chips/pills are fully rounded. No drop shadows except the bag drawer.
- Prices are whole US dollars: `$1,450`. Use `tabular-nums` for all figures.
- Copy tone: short, plain, direct. Buttons say what happens ("Send order on WhatsApp", "Save number"). Errors say what to fix.
- Mobile-first. Everything must work at 375px wide. Respect `prefers-reduced-motion`.
- Product with no photos shows `logo-mark.svg` centred on `--tile`.
- Status colours (admin only): New `--info`, Confirmed `--warn`, Paid `--ok`, Delivered `--muted`, Cancelled `--bad`. Shown as a dot + label pill.

## Routes

### Public shop
| Route | Content |
|---|---|
| `/` | Header (mark + wordmark, Watches, Accessories, Bag), hero with the featured product (`is_featured`), trust strip (3 points from prototype), full collection grid with All/Watches/Accessories chips and price sort. |
| `/watches`, `/accessories` | Same grid, filtered. |
| `/product/[slug]` | Product page: photo gallery (main + thumbnails, swipe on mobile), name, subtitle, price, description, specs table, stock note ("Only 2 left" when ≤2, "Sold out" at 0), quantity, Add to bag, "Ask about this on WhatsApp" link. In the grid, clicking a card can open this as a modal (intercepting route) like the prototype, but the URL must work on its own for sharing. |
| Bag drawer | Global client component. Lines with qty +/−, remove, name/phone/delivery/notes form, subtotal, delivery ("Calculated after you order", no amounts), total excluding delivery, "Send order on WhatsApp". Bag persists in `localStorage` (product id + qty only; prices are always re-read from the server). |
| Order sent screen | Shown in the drawer after `place_order` succeeds: order ref, "Open WhatsApp" button (wa.me link with the prefilled message), the message shown as selectable text with a Copy button, and the shop's number as fallback. |

SEO: per-product `generateMetadata` (title, description, Open Graph image = main photo), `sitemap.xml`, `robots.txt` that disallows `/admin`, Product JSON-LD on product pages. Revalidate shop pages when the admin saves (`revalidatePath`).

### Owner dashboard (private)
| Route | Content |
|---|---|
| `/admin/login` | Email + password. No sign-up link. "Forgot password" sends a Supabase reset email. |
| `/admin` | Overview: 4 KPIs (revenue 30 days from Paid+Delivered, orders 30 days excl. cancelled, "Needs a reply" = New count with Confirmed count underneath, average order), 14-day sales bar chart (from `daily_sales`), best sellers 30 days. |
| `/admin/orders` | Table with status filter chips + counts, newest first. Each row: ref, date/time, customer, tap-to-WhatsApp phone link, items, delivery, total, status dropdown. Row opens `/admin/orders/[ref]` with full detail and an internal `admin_notes` field. |
| `/admin/products` | List with photo thumbnail, name, category, price, stock, published toggle, availability pill. Search + category filter. "Add product" button. Drag or up/down to reorder (`sort_order`). |
| `/admin/products/new`, `/admin/products/[id]` | Product editor (see below). |
| `/admin/settings` | WhatsApp number (validated `^[0-9]{10,15}$`), delivery options (label, active, order). No fees: the delivery fee is agreed with the customer on WhatsApp after the order (all `delivery_options.fee` = 0, see migration `20261113000000`). |

Admin layout: left sidebar on desktop, bottom tab bar on mobile (the owner will mostly use his phone). Header shows his email and a Sign out button.

## Product editor (owner manages everything)

Fields: name, slug (auto from name, editable, unique), category, subtitle, description, price, stock, badge (None / New / Best seller / custom text), featured (only one product featured at a time; turning it on turns it off elsewhere), published, specs (repeatable label/value rows, add/remove/reorder).

**Photos:**
1. Owner picks or drops up to 8 images (JPEG/PNG/WebP/HEIC if the browser can decode it).
2. In the browser, each is resized so the long edge is at most 1600px, converted to WebP at quality ~0.82, EXIF stripped. Show progress.
3. Upload to bucket `product-images` at `<product_id>/<uuid>.webp` with the signed-in admin's session (storage RLS allows admins only).
4. Insert a `product_images` row with `storage_path`, `width`, `height`, `position`.
5. Thumbnails can be dragged to reorder; first = main photo. Each has alt text (default: product name) and a delete button that removes both the storage object and the row.
6. Deleting a product deletes its storage folder too (rows cascade; storage objects must be removed in the server action).

Render photos with `next/image` and `remotePatterns` for the Supabase storage host. Use the public URL from `storage.from('product-images').getPublicUrl(path)`.

## Checkout flow (WhatsApp)

1. Customer fills name, phone, delivery, notes in the bag.
2. A **server action** validates with Zod, checks a honeypot field, applies a simple rate limit (e.g. 5 orders per IP per 10 minutes; in-memory is fine for v1, Upstash later), then calls `supabase.rpc('place_order', {...})` with the anon key.
3. `place_order` re-prices everything from the database, checks stock, normalises the phone (`077…` → `26377…`), creates the order with status **new** and a ref like `LL-1001`, and returns the order + the shop's WhatsApp number. Its error messages are written for customers; show them as-is.
4. The app builds the message below and shows the "Order sent" screen. Clear the bag.

Message format (keep exactly; the owner will recognise it):
```
Hello Lifetime Luxuries, I'd like to place an order.

Order LL-1001
1 × Regent Chronograph 42 — $1,450
1 × Rose Gold Cufflinks — $120

Subtotal: $1,570
Delivery: Delivery in Harare
Total: $1,570 (excl. delivery)

Name: Tendai Moyo
Phone: 077 211 8430
Notes: Gate code 44
```
Link: `https://wa.me/<whatsapp_number>?text=<encodeURIComponent(message)>`.

Note: an order is logged as **New** when the customer taps the button, even if they never press send in WhatsApp. That's expected; the owner cancels stale ones.

## Stock rule (already in the database)

Stock is deducted when an order first moves to **Paid** or **Delivered**, and restored if that order is later **Cancelled**. New and Confirmed orders don't touch stock. `place_order` refuses quantities above current stock. Don't reimplement this in the app.

## Security (non-negotiable)

- **Supabase Auth: turn off public sign-ups.** The owner's account is created in the Supabase dashboard and added to `admin_users` (see README). Nobody else can become an admin from the app.
- `middleware.ts` refreshes the session and redirects any `/admin/*` request (except `/admin/login`) to login when there's no session. **Also** check `is_admin()` server-side in the admin layout and in every admin server action, and return 404 for signed-in non-admins. RLS is the final guard: without an admin session, the database returns no orders.
- Never send order data to the browser on public pages. Admin pages are dynamic (`export const dynamic = 'force-dynamic'`) and never cached.
- `SUPABASE_SERVICE_ROLE_KEY` is not needed for v1. If you add it, use it only in server code, never with a `NEXT_PUBLIC_` prefix.
- Add `X-Robots-Tag: noindex` to `/admin`.
- Validate every input with Zod on the server, even if the client validated it.

## Build order (stop and show Sean after each phase)

1. **Scaffold**: Next.js + Tailwind tokens + fonts + Supabase clients + env. Header, footer, layout matching the prototype. ✅ when `pnpm build` passes and the home page matches the prototype's header and hero.
2. **Shop, read-only**: home, category pages, product page/modal, reading from Supabase (run the migration + seed first). Placeholder mark when no photos.
3. **Bag + WhatsApp checkout**: drawer, localStorage bag, server action → `place_order`, order sent screen, exact message format.
4. **Admin auth**: login, middleware, admin layout, sign out, password reset.
5. **Orders**: overview KPIs + chart + best sellers, orders table, status changes, order detail with admin notes.
6. **Products + photos**: list, editor, specs rows, photo upload/compress/reorder/delete, publish/feature toggles, revalidation of shop pages.
7. **Settings**: WhatsApp number, delivery options.
8. **Polish**: SEO (metadata, sitemap, JSON-LD), 404 page, loading/empty/error states for every list, accessibility pass (focus states, labels, keyboard on drawer/modal, Escape closes), Lighthouse ≥ 90 on mobile for home and product pages.

Testing: Vitest for the message builder, phone formatting and Zod schemas. Playwright for one end-to-end path: add to bag → place order → admin sees it as New → mark Paid → stock drops.

## Out of scope for v1 (don't build unless asked)

Online card/EcoCash payments, customer accounts, reviews, discount codes, multiple admin roles, multi-currency, email notifications. Leave clean seams for payments (the `status` flow already has Paid).
