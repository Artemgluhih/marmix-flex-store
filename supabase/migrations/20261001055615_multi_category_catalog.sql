-- T032A: Preview-only many-to-many category membership. No catalog seed.
-- Execute atomically. The assertions abort before dropping the legacy column.
create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_product_idx on public.product_categories (category_id, product_id);

insert into public.product_categories (product_id, category_id)
select id, category_id from public.products where category_id is not null
on conflict (product_id, category_id) do nothing;

do $$
begin
  if exists (
    select 1 from public.products p where p.category_id is not null
    and not exists (select 1 from public.product_categories pc
                    where pc.product_id = p.id and pc.category_id = p.category_id)
  ) or (select count(*) from public.products where category_id is not null)
       <> (select count(*) from public.product_categories)
    or exists (select 1 from public.product_categories pc
               left join public.products p on p.id = pc.product_id
               left join public.categories c on c.id = pc.category_id
               where p.id is null or c.id is null) then
    raise exception 'Legacy category backfill integrity failed';
  end if;
end;
$$;

-- No public product/image row depends on a user category after this migration.
drop policy products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (catalog_kind = 'REAL' and is_published and archived_at is null);

drop policy product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p where p.id = product_id
      and p.catalog_kind = 'REAL' and p.is_published and p.archived_at is null
  ));

alter table public.product_categories enable row level security;
revoke all on public.product_categories from public, anon, authenticated, service_role;
grant select on public.product_categories to anon, authenticated;
grant insert, delete on public.product_categories to authenticated;

create policy product_categories_public_read on public.product_categories
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                where p.id = product_id and p.catalog_kind = 'REAL'
                  and p.is_published and p.archived_at is null)
         and exists (select 1 from public.categories c
                     where c.id = category_id and c.is_published));

create policy product_categories_admin_read on public.product_categories
  for select to authenticated using (exists (
    select 1 from public.admin_users membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy product_categories_admin_insert on public.product_categories
  for insert to authenticated with check (exists (
    select 1 from public.admin_users membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));
create policy product_categories_admin_delete on public.product_categories
  for delete to authenticated using (exists (
    select 1 from public.admin_users membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));

grant delete on public.categories to authenticated;
create policy categories_admin_delete on public.categories
  for delete to authenticated using (exists (
    select 1 from public.admin_users membership
    where membership.user_id = (select auth.uid()) and membership.is_active
  ));

-- SECURITY INVOKER keeps the caller's JWT, grants and RLS; a failed operation
-- rolls back the entire function call, including the initial product insert.
create function public.create_product_with_categories(
  p_name text, p_sku text, p_slug text, p_series text,
  p_price_minor bigint, p_price_unit text, p_sale_unit text,
  p_min_quantity integer, p_quantity_step integer, p_category_ids uuid[]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_ids uuid[];
begin
  if not exists (select 1 from public.admin_users a
                 where a.user_id = auth.uid() and a.is_active) then
    raise exception 'Admin membership required' using errcode = '42501';
  end if;
  v_ids := array(select distinct x from unnest(coalesce(p_category_ids, '{}'::uuid[])) x);
  if array_position(v_ids, null) is not null or cardinality(v_ids) > 100 or
     (select count(*) from public.categories where id = any(v_ids)) <> cardinality(v_ids) then
    raise exception 'Invalid categories' using errcode = '22023';
  end if;
  insert into public.products
    (name, sku, slug, series, price_minor, price_unit, sale_unit, min_quantity,
     quantity_step, catalog_kind, is_published, archived_at)
  values (p_name, p_sku, p_slug, p_series, p_price_minor, p_price_unit,
          p_sale_unit, p_min_quantity, p_quantity_step, 'REAL', false, null)
  returning id into v_id;
  insert into public.product_categories(product_id, category_id)
  select v_id, unnest(v_ids);
  return v_id;
end;
$$;

create function public.set_product_categories(p_product_id uuid, p_category_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
declare v_ids uuid[];
begin
  if not exists (select 1 from public.admin_users a
                 where a.user_id = auth.uid() and a.is_active) or
     not exists (select 1 from public.products p where p.id = p_product_id) then
    raise exception 'Product or admin membership unavailable' using errcode = '42501';
  end if;
  v_ids := array(select distinct x from unnest(coalesce(p_category_ids, '{}'::uuid[])) x);
  if array_position(v_ids, null) is not null or cardinality(v_ids) > 100 or
     (select count(*) from public.categories where id = any(v_ids)) <> cardinality(v_ids) then
    raise exception 'Invalid categories' using errcode = '22023';
  end if;
  delete from public.product_categories pc
  where pc.product_id = p_product_id and not (pc.category_id = any(v_ids));
  insert into public.product_categories(product_id, category_id)
  select p_product_id, x from unnest(v_ids) x
  where not exists (select 1 from public.product_categories pc
                    where pc.product_id = p_product_id and pc.category_id = x);
end;
$$;

revoke all on function public.create_product_with_categories(text,text,text,text,bigint,text,text,integer,integer,uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.set_product_categories(uuid,uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.create_product_with_categories(text,text,text,text,bigint,text,text,integer,integer,uuid[]) to authenticated;
grant execute on function public.set_product_categories(uuid,uuid[]) to authenticated;

drop index public.products_category_sort_idx;
drop index public.products_public_category_sort_idx;
alter table public.products drop column category_id;
