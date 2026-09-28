-- T014: Preview public catalog reads only. Admin membership and mutations are T017.
-- T012/T013 already enabled RLS on all four tables; do not create admin policies here.

-- Grants form the operation boundary; RLS below restricts visible rows.
revoke all on table public.categories, public.products, public.product_images
  from public, anon, authenticated;
grant select on table public.categories, public.products, public.product_images
  to anon, authenticated;

create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (is_published = true);

create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    catalog_kind = 'REAL'
    and is_published = true
    and archived_at is null
    and exists (
      select 1 from public.categories as category
      where category.id = category_id
        and category.is_published = true
    )
  );

create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products as product
      where product.id = product_id
        and product.catalog_kind = 'REAL'
        and product.is_published = true
        and product.archived_at is null
        and exists (
          select 1 from public.categories as category
          where category.id = product.category_id
            and category.is_published = true
        )
    )
  );

-- Orders remain private until an active-admin membership policy is introduced
-- in T017. Keep T013 column-level privileges without an UPDATE policy.
revoke all on table public.order_requests from public, anon, authenticated;
grant update (status, internal_note) on table public.order_requests
  to authenticated;
