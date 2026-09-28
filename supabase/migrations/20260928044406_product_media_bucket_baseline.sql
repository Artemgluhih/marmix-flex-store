-- T015: public delivery for approved product media. This migration does not
-- grant Storage mutations or upload any objects. Admin policies come later.
-- Only owner-approved, non-confidential media may ever enter a public bucket.
-- Future Admin paths are generated under products/<product-id>/<file-key>.<ext>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  12582912, -- 12 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
);
