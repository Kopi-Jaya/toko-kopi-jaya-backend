-- ============================================================
-- sync_zaki_schema.sql
-- Syncs toko_kopi_jaya to match the shared server schema.
-- All statements use IF NOT EXISTS / IF EXISTS so they are
-- safe to run multiple times.
-- ============================================================

-- products: Zaki added stock tracking
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT 0 AFTER is_available;

-- orders: Zaki added dine-in support + waiter assignment
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS table_id    BIGINT UNSIGNED NULL AFTER outlet_id,
  ADD COLUMN IF NOT EXISTS pax         INT NULL         AFTER table_id,
  ADD COLUMN IF NOT EXISTS waiter_id   BIGINT UNSIGNED NULL AFTER pax;

-- orders: fix staff_id to match entity (nullable — mobile orders have no staff)
ALTER TABLE orders
  MODIFY COLUMN staff_id BIGINT UNSIGNED NULL;

-- order_items: Zaki added per-item notes
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS notes VARCHAR(255) NULL AFTER points_earned_per_item;

-- payment: Zaki added cash-handling columns
ALTER TABLE payment
  ADD COLUMN IF NOT EXISTS amount_paid   DECIMAL(12,2) NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS change_amount DECIMAL(12,2) NULL AFTER amount_paid;

-- product_modifier: Zaki added audit timestamps
ALTER TABLE product_modifier
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL AFTER modifier_id,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

SELECT 'Migration complete.' AS status;
