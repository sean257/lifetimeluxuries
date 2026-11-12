# Lifetime Luxuries: setup steps

This folder is everything Claude Code needs to build the site: the approved design, the build brief (`CLAUDE.md`), and a tested database setup. Do these steps once, then hand over to Claude Code.

## 1. Create the Supabase project
1. Go to supabase.com, create a project (region closest to Zimbabwe, e.g. a European region). Save the database password.
2. **Authentication → Sign In / Providers**: keep Email on, and **turn off "Allow new users to sign up"**. This stops anyone creating an account on the dashboard.
3. **SQL Editor**: open `supabase/migrations/20261030000000_init.sql`, paste it all, Run.
4. SQL Editor again: paste `supabase/seed.sql`, Run. This adds the 14 demo products.

## 2. Create the owner's login
1. **Authentication → Users → Add user → Create new user**. Use the owner's email and a strong password, tick "Auto confirm".
2. SQL Editor, run (with his email):
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'owner@example.com';
   ```
3. Set his WhatsApp number (or do it later in the dashboard):
   ```sql
   update public.settings set whatsapp_number = '2637XXXXXXXX';
   ```

## 3. Connect the app
1. Copy `.env.example` to `.env.local`.
2. Fill in the URL and anon key from **Project Settings → API**.

## 4. Start Claude Code
1. Open this folder in Claude Code.
2. Paste the text from `KICKOFF_PROMPT.md`.
3. It builds in 8 phases and stops after each one for you to check.

## 5. Going live
- Push to GitHub, import into Vercel, add the same environment variables, and set `NEXT_PUBLIC_SITE_URL` to the real domain.
- In Supabase **Authentication → URL Configuration**, set the Site URL to the real domain (needed for password-reset emails).

## Before launch, get from the client
- Logo as a vector (SVG/AI/PDF) or a transparent PNG. The current file is a photo of the foil print.
- Real product list: names, prices, stock, specs, and photos (he can upload photos himself in the dashboard).
- WhatsApp business number.
- Delivery fees, and whether courier to other cities is offered.
- Domain name, if he has one.

## 6. Developing (for Sean)

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # production build (also type-checks and lints)
pnpm test           # Vitest: message format, phone numbers, schemas, KPIs
pnpm test:e2e       # Playwright, using installed Google Chrome
```

`pnpm test:e2e` runs read-only shop checks on mobile and desktop. The full path
(add to bag → order → admin sees New → mark Paid → stock drops → Cancelled restores it)
**writes to the database**, so it only runs when you give it an admin login.
Point it at a dev/staging Supabase project, not the live shop:

```bash
E2E_ADMIN_EMAIL=owner@example.com E2E_ADMIN_PASSWORD='…' pnpm test:e2e
```

Supabase settings the app relies on:
- **Authentication → Sign In / Providers:** "Allow new users to sign up" **off**.
- **Authentication → URL Configuration:** Site URL = your domain; add `https://<domain>/auth/confirm` (and `http://localhost:3000/auth/confirm`) to Redirect URLs.
- **Authentication → Emails → Reset Password** (recommended, so reset links work on any device):
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password`
