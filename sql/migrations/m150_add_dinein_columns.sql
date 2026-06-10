-- M-150: Add dine-in columns to orders and order_items
-- These columns exist in the base SQL schema (toko_kopi_jaya.sql) but were
-- never applied to production. Added so a partner project can use this DB.

ALTER TABLE `orders`
  ADD COLUMN `table_id`  BIGINT UNSIGNED DEFAULT NULL AFTER `outlet_id`,
  ADD COLUMN `pax`       INT DEFAULT NULL              AFTER `table_id`,
  ADD COLUMN `waiter_id` BIGINT UNSIGNED DEFAULT NULL  AFTER `pax`;

ALTER TABLE `order_items`
  ADD COLUMN `notes` VARCHAR(255) DEFAULT NULL AFTER `created_at`;
