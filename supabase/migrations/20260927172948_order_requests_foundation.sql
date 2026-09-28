-- T013: one immutable request row; no API, order items, seed or RLS policies.

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  idempotency_key uuid not null unique,
  request_hash bytea not null,
  name text not null,
  phone text not null,
  city text,
  email text,
  comment text,
  consent_at timestamptz not null,
  items_snapshot jsonb not null,
  total_minor bigint not null,
  currency text not null default 'RUB',
  internal_note text,
  constraint order_requests_status_valid check (
    status in ('new', 'in_progress', 'completed', 'cancelled')
  ),
  constraint order_requests_hash_length check (octet_length(request_hash) between 32 and 64),
  constraint order_requests_name_valid check (
    name = btrim(name) and name <> '' and char_length(name) <= 120
  ),
  constraint order_requests_phone_valid check (
    phone = btrim(phone) and phone <> '' and char_length(phone) <= 40
  ),
  constraint order_requests_city_valid check (
    city is null or (city = btrim(city) and city <> '' and char_length(city) <= 160)
  ),
  constraint order_requests_email_valid check (
    email is null or (email = btrim(email) and email <> '' and char_length(email) <= 254)
  ),
  constraint order_requests_comment_length check (comment is null or char_length(comment) <= 2000),
  constraint order_requests_note_length check (internal_note is null or char_length(internal_note) <= 2000),
  constraint order_requests_snapshot_nonempty_array check (
    case when jsonb_typeof(items_snapshot) = 'array'
      then jsonb_array_length(items_snapshot) > 0
      else false
    end
  ),
  constraint order_requests_total_nonnegative check (total_minor >= 0),
  constraint order_requests_currency_rub check (currency = 'RUB')
);

comment on column public.order_requests.items_snapshot is
  'Server-verified immutable product/SKU, quantity/unit, fixed price, line total and manager display snapshot. Detailed payload validation belongs to the Order API.';
comment on column public.order_requests.request_hash is
  'Opaque digest of a normalized request; never store raw contact or payload text in this column.';
comment on column public.order_requests.consent_at is
  'Timestamp of an explicit form action, not legal wording or a legal document identifier.';
comment on column public.order_requests.internal_note is
  'Private admin-only operational note; never include in a public response or analytics.';

create index order_requests_status_created_at_idx
  on public.order_requests (status, created_at desc, id);

create function public.order_requests_protect_snapshot() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- This also protects newly added columns unless they are expressly allowed here.
  if (to_jsonb(new) - 'status' - 'internal_note' - 'updated_at')
     is distinct from (to_jsonb(old) - 'status' - 'internal_note' - 'updated_at') then
    raise exception using errcode = '23514', message = 'Order request snapshot is immutable';
  end if;

  -- Ignore any caller-supplied updated_at: only the database records updates.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger order_requests_protect_snapshot_before_update
  before update on public.order_requests
  for each row execute function public.order_requests_protect_snapshot();
revoke all on function public.order_requests_protect_snapshot()
  from public, anon, authenticated, service_role;

-- Policies and authenticated SELECT are T014. The future server-only insert
-- uses service_role; browser clients never receive that credential.
alter table public.order_requests enable row level security;
revoke all on table public.order_requests from public, anon, authenticated, service_role;
grant update (status, internal_note) on table public.order_requests to authenticated;
grant select, insert on table public.order_requests to service_role;
