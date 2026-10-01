-- T035: atomic metadata, ordering and primary selection under the caller's RLS.
-- No media is seeded and no Storage policies or objects are changed.
create function public.save_product_media(
  p_product_id uuid, p_items jsonb, p_primary_id uuid
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_product public.products%rowtype;
  v_count integer;
  v_length integer;
begin
  if not exists (select 1 from public.admin_users a
                 where a.user_id = auth.uid() and a.is_active) then
    raise exception 'Admin membership required' using errcode = '42501';
  end if;

  -- Serializes competing primary selections for this product.
  select * into v_product from public.products
    where id = p_product_id for update;
  if not found then
    raise exception 'Product not found' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid media list' using errcode = '22023';
  end if;
  v_length := jsonb_array_length(p_items);
  if v_length > 100 then
    raise exception 'Media list too large' using errcode = '22023';
  end if;
  select count(*) into v_count from public.product_images where product_id = p_product_id;
  if v_count <> v_length then
    raise exception 'Media list changed' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) as j(item)
    where jsonb_typeof(item) <> 'object'
       or jsonb_typeof(item->'id') <> 'string'
       or (item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or (item ? 'alt' and jsonb_typeof(item->'alt') not in ('string','null'))
       or (item ? 'role' and jsonb_typeof(item->'role') not in ('string','null'))
       or length(btrim(coalesce(item->>'alt', ''))) > 250
       or position('<' in coalesce(item->>'alt', '')) > 0
       or position('>' in coalesce(item->>'alt', '')) > 0
       or nullif(item->>'role', '') is not null
          and item->>'role' not in ('neutral_texture','macro','interior','application')
       or exists (select 1 from jsonb_object_keys(item) as k(key)
                  where k.key not in ('id','alt','role'))
  ) then
    raise exception 'Invalid media values' using errcode = '22023';
  end if;
  if (select count(distinct item->>'id') from jsonb_array_elements(p_items) as j(item)) <> v_length
     or exists (
       select 1 from jsonb_array_elements(p_items) as j(item)
       left join public.product_images i
         on i.id = (item->>'id')::uuid and i.product_id = p_product_id
       where i.id is null
     ) then
    raise exception 'Media does not belong to product' using errcode = '22023';
  end if;
  if p_primary_id is not null and not exists (
    select 1 from jsonb_array_elements(p_items) as j(item)
    where (item->>'id')::uuid = p_primary_id
  ) then
    raise exception 'Primary does not belong to product' using errcode = '22023';
  end if;
  if v_product.is_published and (p_primary_id is null or exists (
    select 1 from jsonb_array_elements(p_items) as j(item)
    where nullif(btrim(coalesce(item->>'alt','')), '') is null
       or nullif(item->>'role','') is null
  )) then
    raise exception 'Published media requires primary, alt and role' using errcode = '22023';
  end if;

  -- The partial unique index remains the final guard against two primary images.
  update public.product_images set is_primary = false
    where product_id = p_product_id and is_primary;
  with submitted as (
    select (item->>'id')::uuid id,
           nullif(btrim(item->>'alt'), '') alt,
           nullif(item->>'role', '') role,
           (ordinality - 1)::integer position
    from jsonb_array_elements(p_items) with ordinality as j(item, ordinality)
  )
  update public.product_images i
    set alt = submitted.alt, role = submitted.role, sort_order = submitted.position
    from submitted where i.id = submitted.id and i.product_id = p_product_id;
  if p_primary_id is not null then
    update public.product_images set is_primary = true
      where product_id = p_product_id and id = p_primary_id;
  end if;
end;
$$;

revoke all on function public.save_product_media(uuid,jsonb,uuid) from public, anon, service_role;
grant execute on function public.save_product_media(uuid,jsonb,uuid) to authenticated;
