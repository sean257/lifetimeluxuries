-- Lifetime Luxuries: initial schema
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Covers: catalogue, product photos, orders, settings, admin access,
-- row-level security, the product-images storage bucket, and the
-- public place_order() function the shop calls at checkout.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------
create type public.product_category as enum ('watch', 'accessory');
create type public.order_status as enum ('new', 'confirmed', 'paid', 'delivered', 'cancelled');

-- ---------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------
-- Admin access
-- Only users listed here can use the dashboard. Public sign-up must
-- be switched off in Supabase Auth settings. Add the owner with:
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = 'owner@example.com';
-- ---------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------
-- Settings (single row) and delivery options
-- ---------------------------------------------------------------
create table public.settings (
  id               boolean primary key default true check (id),
  whatsapp_number  text not null default '263770000000'
                   check (whatsapp_number ~ '^[0-9]{10,15}$'),  -- international format, no "+"
  currency         text not null default 'USD',
  updated_at       timestamptz not null default now()
);
insert into public.settings default values;

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

create table public.delivery_options (
  code       text primary key check (code ~ '^[a-z0-9_]+$'),
  label      text not null,
  fee        numeric(10,2) not null default 0 check (fee >= 0),
  sort_order int not null default 0,
  is_active  boolean not null default true
);
insert into public.delivery_options (code, label, fee, sort_order) values
  ('collect', 'Collect in Harare',        0, 1),
  ('harare',  'Delivery in Harare',      10, 2),
  ('other',   'Courier to another city', 25, 3);

-- ---------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null check (char_length(name) between 1 and 120),
  category      public.product_category not null,
  subtitle      text,                         -- short line under the name, e.g. "Rose gold · moonphase"
  description   text,
  specs         jsonb not null default '[]'::jsonb
                check (jsonb_typeof(specs) = 'array'),  -- [{"label":"Case","value":"40 mm, steel"}, ...]
  price         numeric(10,2) not null check (price >= 0),
  stock         int not null default 0 check (stock >= 0),
  badge         text,                         -- "New", "Best seller", "Featured" (optional)
  is_featured   boolean not null default false,  -- shown in the home page hero
  is_published  boolean not null default true,   -- false = hidden from the shop
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_listing_idx on public.products (is_published, category, sort_order);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Photos live in the "product-images" storage bucket; this table
-- holds their paths and order. position 0 is the main photo.
create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null unique,         -- e.g. "<product_id>/<uuid>.webp"
  alt           text,
  position      int not null default 0,
  width         int,
  height        int,
  created_at    timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------
create sequence public.order_ref_seq start 1001;

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  ref             text not null unique default ('LL-' || nextval('public.order_ref_seq')),
  customer_name   text not null check (char_length(customer_name) between 1 and 120),
  customer_phone  text not null check (customer_phone ~ '^[0-9]{9,15}$'),  -- normalised, e.g. 263771234567
  delivery_code   text not null references public.delivery_options (code),
  delivery_label  text not null,             -- snapshot at time of order
  delivery_fee    numeric(10,2) not null,
  subtotal        numeric(10,2) not null,
  total           numeric(10,2) not null,
  notes           text check (char_length(notes) <= 1000),
  status          public.order_status not null default 'new',
  admin_notes     text,
  stock_applied   boolean not null default false,  -- internal: stock already deducted for this order
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,               -- snapshot
  unit_price    numeric(10,2) not null,      -- snapshot
  qty           int not null check (qty between 1 and 20),
  unique (order_id, product_id)
);
create index order_items_order_idx on public.order_items (order_id);

-- Stock rule: stock is deducted when an order first reaches Paid or
-- Delivered, and put back if that order is later Cancelled.
-- New/Confirmed orders do not touch stock.
create or replace function public.apply_order_stock()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if new.status in ('paid', 'delivered') and not old.stock_applied then
    update public.products p
       set stock = greatest(p.stock - oi.qty, 0)
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
    new.stock_applied := true;
  elsif new.status = 'cancelled' and old.stock_applied then
    update public.products p
       set stock = p.stock + oi.qty
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
    new.stock_applied := false;
  end if;
  return new;
end $$;

create trigger orders_apply_stock
  before update of status on public.orders
  for each row when (old.status is distinct from new.status)
  execute function public.apply_order_stock();

-- ---------------------------------------------------------------
-- place_order(): the only way the public creates an order.
-- Prices, delivery fee and totals are read from the database, never
-- trusted from the browser. Returns everything needed to build the
-- WhatsApp message.
-- p_items: [{"product_id":"<uuid>","qty":1}, ...]
-- ---------------------------------------------------------------
create or replace function public.place_order(
  p_customer_name  text,
  p_customer_phone text,
  p_delivery_code  text,
  p_notes          text,
  p_items          jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_delivery  public.delivery_options%rowtype;
  v_phone     text;
  v_name      text := btrim(coalesce(p_customer_name, ''));
  v_notes     text := nullif(btrim(coalesce(p_notes, '')), '');
  v_missing   int;
  v_short     text;
  v_subtotal  numeric(10,2);
  v_order     public.orders%rowtype;
  v_items     jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'An order can hold up to 20 different items.' using errcode = 'P0001';
  end if;
  if v_name = '' then
    raise exception 'Add your name so we know who the order is for.' using errcode = 'P0001';
  end if;

  v_phone := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  if v_phone like '0%' then
    v_phone := '263' || substr(v_phone, 2);   -- local Zimbabwe format -> international
  end if;
  if v_phone !~ '^[0-9]{9,15}$' then
    raise exception 'Add a phone number we can reach you on, for example 077 123 4567.' using errcode = 'P0001';
  end if;

  select * into v_delivery from public.delivery_options
   where code = p_delivery_code and is_active;
  if not found then
    raise exception 'Choose a delivery option.' using errcode = 'P0001';
  end if;

  with req as (
    select (e ->> 'product_id')::uuid as product_id,
           sum((e ->> 'qty')::int)    as qty
      from jsonb_array_elements(p_items) e
     group by 1
  )
  select count(*) filter (where p.id is null),
         string_agg(p.name, ', ') filter (where p.id is not null and (r.qty < 1 or r.qty > p.stock)),
         coalesce(sum(p.price * r.qty) filter (where p.id is not null), 0)
    into v_missing, v_short, v_subtotal
    from req r
    left join public.products p on p.id = r.product_id and p.is_published;

  if v_missing > 0 then
    raise exception 'Something in your bag is no longer available. Remove it and try again.' using errcode = 'P0001';
  end if;
  if v_short is not null then
    raise exception 'Not enough stock for: %. Lower the quantity and try again.', v_short using errcode = 'P0001';
  end if;

  insert into public.orders
    (customer_name, customer_phone, delivery_code, delivery_label, delivery_fee, subtotal, total, notes)
  values
    (left(v_name, 120), v_phone, v_delivery.code, v_delivery.label, v_delivery.fee,
     v_subtotal, v_subtotal + v_delivery.fee, left(v_notes, 1000))
  returning * into v_order;

  with req as (
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'qty')::int) as qty
      from jsonb_array_elements(p_items) e group by 1
  )
  insert into public.order_items (order_id, product_id, product_name, unit_price, qty)
  select v_order.id, p.id, p.name, p.price, r.qty
    from req r join public.products p on p.id = r.product_id;

  select jsonb_agg(jsonb_build_object(
           'name', product_name, 'qty', qty, 'unit_price', unit_price,
           'line_total', unit_price * qty) order by product_name)
    into v_items
    from public.order_items where order_id = v_order.id;

  return jsonb_build_object(
    'ref',            v_order.ref,
    'customer_name',  v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'delivery_label', v_order.delivery_label,
    'delivery_fee',   v_order.delivery_fee,
    'subtotal',       v_order.subtotal,
    'total',          v_order.total,
    'notes',          v_order.notes,
    'items',          v_items,
    'whatsapp_number', (select whatsapp_number from public.settings limit 1)
  );
end $$;

revoke all on function public.place_order(text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, jsonb) to anon, authenticated;

revoke all on function public.apply_order_stock() from public;

-- ---------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------
alter table public.admin_users      enable row level security;
alter table public.settings         enable row level security;
alter table public.delivery_options enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- admin_users: an admin can see the list; nobody can change it from the app
create policy "admins read admin list" on public.admin_users
  for select to authenticated using (public.is_admin());

-- settings & delivery options: shop reads, admins edit
create policy "anyone reads settings" on public.settings
  for select using (true);
create policy "admins update settings" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads delivery options" on public.delivery_options
  for select using (is_active or public.is_admin());
create policy "admins manage delivery options" on public.delivery_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- products: shop sees published ones, admins see and manage all
create policy "anyone reads published products" on public.products
  for select using (is_published or public.is_admin());
create policy "admins manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads photos of published products" on public.product_images
  for select using (exists (
    select 1 from public.products p
     where p.id = product_id and (p.is_published or public.is_admin())));
create policy "admins manage product photos" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders: admins only. The public creates orders through place_order().
create policy "admins manage orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order items" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- Storage: product photos
-- Public bucket = anyone can view a photo by URL. Only admins can
-- upload, replace or delete. 5 MB cap; the dashboard compresses
-- photos to WebP (~1600px) before upload, so real files are far smaller.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "admins upload product photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admins update product photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admins delete product photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admins list product photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------
-- Dashboard helpers (admin only)
-- ---------------------------------------------------------------
create or replace view public.daily_sales
with (security_invoker = true) as
select (created_at at time zone 'Africa/Harare')::date as day,
       count(*)                                         as orders,
       sum(total)                                       as value
  from public.orders
 where status <> 'cancelled'
 group by 1;
