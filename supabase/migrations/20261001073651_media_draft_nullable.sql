-- T034: file upload precedes semantic metadata editing in T035.
-- No existing image values are changed and no semantic defaults are invented.
alter table public.product_images
  alter column role drop not null,
  alter column alt drop not null;
