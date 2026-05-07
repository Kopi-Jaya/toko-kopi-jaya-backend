-- M-125: Multi-outlet admin scoping + per-outlet menus
-- MySQL 8.0 — apply once. Two changes:
--   1. Extend `staff.role` enum to include 'super_admin'.
--   2. Create `outlet_products` junction so each outlet can activate a subset
--      of the global product catalog with optional price overrides.
--
-- Backfill at the bottom seeds an outlet_products row for every (outlet,
-- product) pair so existing menu behavior is preserved on the day this ships
-- (every outlet sells everything until an admin curates).

-- 1. Extend the staff.role enum.
ALTER TABLE `staff`
  MODIFY COLUMN `role` ENUM(
    'super_admin',
    'admin',
    'cashier',
    'manager',
    'barista'
  ) NOT NULL;

-- 2. outlet_products junction.
CREATE TABLE IF NOT EXISTS `outlet_products` (
  `outlet_product_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `outlet_id`         BIGINT UNSIGNED NOT NULL,
  `product_id`        BIGINT UNSIGNED NOT NULL,
  `price_override`    DECIMAL(12, 2)  NULL DEFAULT NULL,
  `is_available`      TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`        DATETIME(6)     NULL     DEFAULT NULL,
  PRIMARY KEY (`outlet_product_id`),
  UNIQUE KEY `uq_outlet_product` (`outlet_id`, `product_id`),
  KEY `idx_outlet_id`  (`outlet_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_outlet_products_outlet`
    FOREIGN KEY (`outlet_id`)  REFERENCES `outlet`(`outlet_id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_outlet_products_product`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Backfill: every active outlet × every product → default activation.
--    Skips pairs that already exist (idempotent).
INSERT IGNORE INTO `outlet_products` (`outlet_id`, `product_id`, `price_override`, `is_available`)
SELECT o.outlet_id, p.product_id, NULL, 1
FROM `outlet` o
CROSS JOIN `products` p
WHERE o.deleted_at IS NULL
  AND p.deleted_at IS NULL;

-- Manual follow-up (do this once after running the migration):
--   UPDATE `staff` SET `role` = 'super_admin' WHERE `username` = '<your-owner-account>';
