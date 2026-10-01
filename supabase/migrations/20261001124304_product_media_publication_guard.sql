-- T035 backstop: publication requires one complete primary and complete linked media.
-- Existing published rows are not backfilled or changed.
create function public.product_media_publication_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_primary integer;
  v_incomplete integer;
begin
  if not new.is_published then return new; end if;
  if tg_op = 'UPDATE' and old.is_published then return new; end if;
  select count(*) filter (where is_primary),
         count(*) filter (where role is null or alt is null)
    into v_primary, v_incomplete
    from public.product_images where product_id = new.id;
  if v_primary <> 1 then
    raise exception 'Primary image required for publication' using errcode = '23514';
  end if;
  if v_incomplete <> 0 then
    raise exception 'Image metadata required for publication' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger products_media_before_publish
  before insert or update of is_published on public.products
  for each row execute function public.product_media_publication_guard();

revoke all on function public.product_media_publication_guard() from public, anon, authenticated, service_role;
