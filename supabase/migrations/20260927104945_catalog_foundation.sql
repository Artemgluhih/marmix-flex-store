-- T012: catalog schema only. No owner data, storage objects, or test fixtures.
-- Public access remains denied until the dedicated RLS task (T014).

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_name_present check (name = btrim(name) and name <> ''),
  constraint categories_sort_order_nonnegative check (sort_order >= 0)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  catalog_kind text not null default 'REAL',
  series text,
  description text,
  seo_title text,
  seo_description text,
  price_minor bigint,
  currency text not null default 'RUB',
  price_unit text,
  sale_unit text,
  min_quantity integer,
  quantity_step integer,
  area_per_sale_unit_m2 numeric(14, 4),
  source_price_range text,
  availability_status text,
  width_mm integer,
  height_mm integer,
  thickness_mm integer,
  specifications jsonb not null default '{}'::jsonb,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_catalog_kind_valid check (catalog_kind in ('REAL', 'TEST_ONLY')),
  constraint products_sku_origin check (
    (catalog_kind = 'REAL' and sku ~ '^MF-[A-Z0-9]+-[0-9]{4,}$') or
    (catalog_kind = 'TEST_ONLY' and sku ~ '^TEST_ONLY-[A-Za-z0-9][A-Za-z0-9_-]*$')
  ),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_name_present check (name = btrim(name) and name <> ''),
  constraint products_series_nonblank check (series is null or (series = btrim(series) and series <> '')),
  constraint products_price_positive check (price_minor is null or price_minor > 0),
  constraint products_currency_rub check (currency = 'RUB'),
  constraint products_price_unit_valid check (price_unit is null or price_unit in ('м²', 'шт./упаковка')),
  constraint products_sale_unit_valid check (sale_unit is null or sale_unit in ('sheet', 'шт./упаковка')),
  constraint products_unit_pair_valid check (
    price_unit is null or sale_unit is null or
    (price_unit = 'м²' and sale_unit = 'sheet') or
    (price_unit = 'шт./упаковка' and sale_unit = 'шт./упаковка')
  ),
  constraint products_min_quantity_positive check (min_quantity is null or min_quantity > 0),
  constraint products_quantity_step_positive check (quantity_step is null or quantity_step > 0),
  constraint products_area_positive check (area_per_sale_unit_m2 is null or area_per_sale_unit_m2 > 0),
  constraint products_area_only_for_sheets check (
    area_per_sale_unit_m2 is null or
    (price_unit is not null and sale_unit is not null and price_unit = 'м²' and sale_unit = 'sheet')
  ),
  constraint products_range_nonblank check (source_price_range is null or btrim(source_price_range) <> ''),
  constraint products_availability_valid check (
    availability_status is null or availability_status in ('in_stock', 'on_order')
  ),
  constraint products_width_positive check (width_mm is null or width_mm > 0),
  constraint products_height_positive check (height_mm is null or height_mm > 0),
  constraint products_thickness_positive check (thickness_mm is null or thickness_mm > 0),
  constraint products_specs_object check (jsonb_typeof(specifications) = 'object'),
  constraint products_sort_order_nonnegative check (sort_order >= 0),
  constraint products_archived_unpublished check (archived_at is null or not is_published)
);

comment on column public.products.catalog_kind is
  'REAL owner catalog or explicitly marked TEST_ONLY Preview fixture. Public reads must filter REAL; identity is immutable.';
comment on column public.products.price_minor is
  'Exact confirmed price in RUB kopecks per price_unit; NULL until an exact applicable price is known.';
comment on column public.products.source_price_range is
  'Source/display evidence only; never a fixed price or a basis for order totals.';
comment on column public.products.area_per_sale_unit_m2 is
  'Exact square metres per sold sheet when confirmed; NULL for unresolved flexible-board format and accessories.';
comment on column public.products.specifications is
  'Additional approved display specifications only; identity and commerce have dedicated columns.';

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  storage_path text not null unique,
  role text not null,
  alt text not null,
  width integer not null,
  height integer not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_path_valid check (
    storage_path = btrim(storage_path) and storage_path <> '' and
    left(storage_path, 1) <> '/' and position('..' in storage_path) = 0
  ),
  constraint product_images_role_valid check (role in ('neutral_texture', 'macro', 'interior', 'application')),
  constraint product_images_alt_present check (btrim(alt) <> ''),
  constraint product_images_width_positive check (width > 0),
  constraint product_images_height_positive check (height > 0),
  constraint product_images_sort_order_nonnegative check (sort_order >= 0)
);

-- CHECK instead of PostgreSQL ENUM keeps later owner-approved roles migratable.
-- A TEST_ONLY image is identified through its TEST_ONLY product; no image rows are seeded here.
create unique index product_images_one_primary_per_product
  on public.product_images (product_id) where is_primary;
create index product_images_product_sort_idx
  on public.product_images (product_id, sort_order, id);
create index categories_published_sort_idx
  on public.categories (sort_order, id) where is_published;
create index products_category_sort_idx
  on public.products (category_id, sort_order, id);
create index products_public_category_sort_idx
  on public.products (category_id, sort_order, id)
  where catalog_kind = 'REAL' and is_published and archived_at is null;
create index products_public_sort_idx
  on public.products (sort_order, id)
  where catalog_kind = 'REAL' and is_published and archived_at is null;

create function public.catalog_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.catalog_keep_product_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.sku is distinct from old.sku or new.catalog_kind is distinct from old.catalog_kind then
    raise exception using errcode = '23514', message = 'SKU and catalog kind are immutable';
  end if;
  return new;
end;
$$;

create trigger categories_touch_updated_at before update on public.categories
  for each row execute function public.catalog_touch_updated_at();
create trigger products_keep_identity before update on public.products
  for each row execute function public.catalog_keep_product_identity();
create trigger products_touch_updated_at before update on public.products
  for each row execute function public.catalog_touch_updated_at();
create trigger product_images_touch_updated_at before update on public.product_images
  for each row execute function public.catalog_touch_updated_at();

revoke all on function public.catalog_touch_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.catalog_keep_product_identity() from public, anon, authenticated, service_role;

-- T014 will grant scoped access and create policies. Neither API role can read
-- newly created catalog tables between T012 and T014, regardless of project defaults.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
revoke all on table public.categories, public.products, public.product_images
  from public, anon, authenticated, service_role;
