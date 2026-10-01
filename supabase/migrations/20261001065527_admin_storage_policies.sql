-- T033: Preview product-media capability for an active authenticated admin.
-- Public object delivery is provided by the existing public bucket, not by
-- an anon metadata policy. No object is uploaded by this migration.
-- T034 generates a unique key; product existence is checked by its app flow.

create policy product_media_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-media'
    and cardinality(storage.foldername(name)) = 2
    and (storage.foldername(name))[1] = 'products'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9_-]{8,128}\.(jpg|jpeg|png|webp|avif)$'
    and exists (
      select 1 from public.admin_users membership
      where membership.user_id = (select auth.uid()) and membership.is_active
    )
  );

create policy product_media_admin_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-media'
    and cardinality(storage.foldername(name)) = 2
    and (storage.foldername(name))[1] = 'products'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9_-]{8,128}\.(jpg|jpeg|png|webp|avif)$'
    and exists (
      select 1 from public.admin_users membership
      where membership.user_id = (select auth.uid()) and membership.is_active
    )
  );

create policy product_media_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-media'
    and cardinality(storage.foldername(name)) = 2
    and (storage.foldername(name))[1] = 'products'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9_-]{8,128}\.(jpg|jpeg|png|webp|avif)$'
    and exists (
      select 1 from public.admin_users membership
      where membership.user_id = (select auth.uid()) and membership.is_active
    )
  );

-- Deliberately no UPDATE policy: Storage upsert must not replace an object.
