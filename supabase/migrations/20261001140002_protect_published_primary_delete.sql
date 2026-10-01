-- T036: a direct authenticated Data API DELETE cannot remove the primary
-- image of a published product. The UI guard alone is not authoritative.
create function public.protect_published_primary_delete()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_published boolean;
begin
  if not old.is_primary then return old; end if;
  select p.is_published into v_published
    from public.products p where p.id = old.product_id for update;
  if v_published then
    raise exception 'Published primary image cannot be removed'
      using errcode = '23514';
  end if;
  return old;
end;
$$;

create trigger product_images_before_delete
  before delete on public.product_images
  for each row execute function public.protect_published_primary_delete();

revoke all on function public.protect_published_primary_delete()
  from public, anon, authenticated, service_role;
