-- T017: active membership is the sole admin authorization condition.
-- No Auth user, membership seed, Storage policy, or production data is created.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated, service_role;
grant select on table public.admin_users to authenticated;

-- A session may inspect its own membership, including an inactive one, but
-- cannot create or change membership through the Data API.
create policy admin_users_read_own on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Keep T014 guest visibility; authenticated users without active membership
-- still see only the same published catalog as anon.
revoke insert, update, delete on table public.categories, public.products,
  public.product_images from public, anon, authenticated;
grant insert, update on table public.categories, public.products to authenticated;
grant insert, update, delete on table public.product_images to authenticated;

create policy categories_admin_read on public.categories
  for select to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy categories_admin_insert on public.categories
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy categories_admin_update on public.categories
  for update to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ))
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));

create policy products_admin_read on public.products
  for select to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy products_admin_insert on public.products
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy products_admin_update on public.products
  for update to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ))
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));

create policy product_images_admin_read on public.product_images
  for select to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy product_images_admin_insert on public.product_images
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy product_images_admin_update on public.product_images
  for update to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ))
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy product_images_admin_delete on public.product_images
  for delete to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));

-- The T013 column privilege and immutable-snapshot trigger remain the order
-- write boundary. SELECT is required for authorized UPDATE under RLS.
revoke all on table public.order_requests from public, anon, authenticated;
grant select on table public.order_requests to authenticated;
grant update (status, internal_note) on table public.order_requests to authenticated;

create policy order_requests_admin_read on public.order_requests
  for select to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy order_requests_admin_update on public.order_requests
  for update to authenticated
  using (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ))
  with check (exists (
    select 1 from public.admin_users as membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
