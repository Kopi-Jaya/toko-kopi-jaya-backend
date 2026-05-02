-- M-116: Add soft-delete column (deleted_at) to all core tables
-- MySQL 8.0 — run once. Safe to re-run: script checks information_schema first.
-- If re-running manually, skip any table where deleted_at already exists.

ALTER TABLE `categories`    ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `products`      ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `modifier`      ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `staff`         ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `member`        ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `outlet`        ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `discount`      ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `tax`           ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `service_charge` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
