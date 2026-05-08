-- DEFECT-008: Rewrite products.img_url that point at the internal Docker
-- hostname (toko-kopi-jaya-api.local) to the public Traefik hostname.
-- MySQL 8.0 — safe to re-run. Only rows that still match the bad prefix
-- are touched, so a second invocation is a no-op.
--
-- Background: uploadImage() in products.controller.ts used to derive the
-- public host from req.headers['x-forwarded-host'] || req.headers.host.
-- Traefik doesn't inject x-forwarded-host for this app, so the fallback
-- resolved to the in-network container hostname and was persisted into
-- the DB. The controller has been switched to PUBLIC_API_URL going
-- forward; this script repairs the historical rows.

UPDATE `products`
SET `img_url` = REPLACE(
  `img_url`,
  'http://toko-kopi-jaya-api.local/',
  'https://toko-kopi-jaya-api-4w8wou-571f57-15-235-165-81.traefik.me/'
)
WHERE `img_url` LIKE 'http://toko-kopi-jaya-api.local/%';
