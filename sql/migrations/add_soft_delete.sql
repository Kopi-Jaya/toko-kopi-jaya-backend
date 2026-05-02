-- M-116: Add soft-delete column (deleted_at) to all core tables
-- Run once against the production database on Dokploy.
-- Safe to run multiple times — each statement uses IF NOT EXISTS / checks first.

ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `modifier`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `staff`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `member`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `outlet`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `discount`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `tax`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `service_charge`
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL DEFAULT NULL;
