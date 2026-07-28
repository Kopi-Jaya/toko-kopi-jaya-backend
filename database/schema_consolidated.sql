-- ############################################################################
-- toko_kopi_jaya - CONSOLIDATED SCHEMA  v2
--
-- GENERATED 2026-07-28. Fresh MySQL 8.0 database matching the current NestJS
-- backend (21 TypeORM entities). Apply ONCE to an EMPTY database.
--
-- BASE = toko_kopi_jaya_FINAL.sql
-- v1 of this file used toko_kopi_jaya.sql (Jun 10) because it was newer and
-- larger. That was WRONG: it is an incomplete phpMyAdmin export carrying
-- PRIMARY KEYs for only 4 of 26 tables and ZERO foreign keys. Applying it
-- produced 21 tables with no primary key and broke every FK-dependent
-- migration. FINAL.sql, though older, is hand-written and well-formed:
-- 19/19 inline PRIMARY KEYs, 25 FOREIGN KEYs, named indexes, the CORRECT
-- BEFORE UPDATE loyalty trigger, and sp_redeem_reward.
--
-- Zaki's Laravel POS tables (users, sessions, password_reset_tokens,
-- migrations, areas, tables) are intentionally NOT included: no backend
-- entity maps them, and this Dokploy MySQL is a fresh database that only
-- our API connects to.
--
-- PART A  FINAL.sql verbatim   tables + keys + FKs + seed + views
--                              + triggers + procedure (DEFINER stripped)
-- PART B  reconciliation       columns/tables the entities need
-- PART C  view override        v_sales_by_source with outlet_id (M-129)
--
-- APPLY:
--   mysql -h <host> -P <port> -u root -p toko_kopi_jaya < schema_consolidated.sql
-- ############################################################################


-- ############################################################################
-- PART A - BASE (toko_kopi_jaya_FINAL.sql)
-- ############################################################################
-- ============================================================================
-- TOKO KOPI JAYA - CORRECTED DATABASE SCHEMA v2.0
-- Mobile CRM & Ordering System with Product-Weighted Loyalty Algorithm
-- ============================================================================
-- Author: Davis Maulana Hermanto (NIM. 2241720255)
-- Date: January 28, 2026
-- Description: Enhanced schema implementing Product-Weighted Loyalty System
--              that addresses Data Blindness and Margin Erosion
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS=0;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================================
-- DATABASE CREATION
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `toko_kopi_jaya` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `toko_kopi_jaya`;

-- ============================================================================
-- CORE PRODUCT CATALOG TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: categories
-- Purpose: Organize products into logical groups (Coffee, Food, Merch, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE `categories` (
  `category_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  INDEX `idx_category_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: products
-- Purpose: Central product catalog with LOYALTY EARNING POINTS
-- KEY FEATURE: Each product has 'earning_points' for Product-Weighted Algorithm
-- ----------------------------------------------------------------------------
CREATE TABLE `products` (
  `product_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `base_price` DECIMAL(12,2) NOT NULL,
  `img_url` TEXT,
  
  -- ★ LOYALTY SYSTEM CORE ★
  -- Defines how many points customers earn when purchasing THIS specific item
  `earning_points` INT UNSIGNED DEFAULT 0 COMMENT 'Points earned per unit purchase (Product-Weighted Algorithm)',
  
  `is_available` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`product_id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE RESTRICT,
  INDEX `idx_product_category` (`category_id`),
  INDEX `idx_product_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CUSTOMER & MEMBERSHIP TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: member
-- Purpose: Registered users with LOYALTY POINT BALANCE
-- KEY FEATURE: Stores current_points and tier status
-- ----------------------------------------------------------------------------
CREATE TABLE `member` (
  `member_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE,
  `phone_number` VARCHAR(20) UNIQUE,
  `birthday` DATE,
  `fav_menu` VARCHAR(100),
  `password` VARCHAR(255) NOT NULL,
  
  -- ★ LOYALTY SYSTEM BALANCE ★
  `current_points` INT UNSIGNED DEFAULT 0 COMMENT 'Real-time loyalty point balance',
  `lifetime_points_earned` INT UNSIGNED DEFAULT 0 COMMENT 'Historical total for analytics',
  `tier` ENUM('Bronze', 'Silver', 'Gold', 'Platinum') DEFAULT 'Bronze' COMMENT 'Membership tier',
  
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`member_id`),
  INDEX `idx_member_email` (`email`),
  INDEX `idx_member_phone` (`phone_number`),
  INDEX `idx_member_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: customer
-- Purpose: ANONYMOUS walk-in customers (non-registered)
-- Relationship: Separate from 'member' to distinguish loyalty-eligible users
-- ----------------------------------------------------------------------------
CREATE TABLE `customer` (
  `customer_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OUTLET & STAFF MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: outlet
-- Purpose: Physical store locations with geolocation for Click & Collect
-- ----------------------------------------------------------------------------
CREATE TABLE `outlet` (
  `outlet_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `address` TEXT,
  `latitude` DECIMAL(10,7),
  `longitude` DECIMAL(10,7),
  `phone` VARCHAR(20),
  `status` ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`outlet_id`),
  INDEX `idx_outlet_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: staff
-- Purpose: Employee accounts for POS and admin access
-- ----------------------------------------------------------------------------
CREATE TABLE `staff` (
  `staff_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `role` ENUM('admin', 'cashier', 'manager', 'barista') NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `outlet_id` BIGINT UNSIGNED,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`),
  FOREIGN KEY (`outlet_id`) REFERENCES `outlet`(`outlet_id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_username` (`username`),
  INDEX `idx_staff_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ORDER MANAGEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: orders
-- Purpose: Central transaction record with MULTI-SOURCE tracking
-- KEY FEATURE: Distinguishes Mobile App vs. Aggregator vs. POS orders
-- ----------------------------------------------------------------------------
CREATE TABLE `orders` (
  `order_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- Customer Identification (NULLABLE for anonymous customers)
  `member_id` BIGINT UNSIGNED NULL COMMENT 'Registered member (loyalty eligible)',
  `customer_id` BIGINT UNSIGNED NULL COMMENT 'Anonymous walk-in customer',
  
  -- Operational References
  `staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Staff who processed the order',
  `outlet_id` BIGINT UNSIGNED NOT NULL COMMENT 'Fulfillment location',
  
  -- ★ CRITICAL: SOURCE TRACKING (solves "Data Blindness") ★
  `source` ENUM(
    'Mobile App',           -- Direct orders from Flutter app
    'POS - In-Store',       -- Walk-in dine-in/takeaway
    'POS - GoFood',         -- Aggregator (synced via POS API)
    'POS - GrabFood',       -- Aggregator (synced via POS API)
    'POS - ShopeeFood',     -- Aggregator (synced via POS API)
    'Admin Dashboard',      -- Manual entry
    'Kiosk'                 -- Self-service kiosk
  ) NOT NULL DEFAULT 'POS - In-Store',
  
  `order_type` ENUM('dine-in', 'takeaway', 'click-collect') DEFAULT 'takeaway',
  `table_number` VARCHAR(10),
  
  -- ★ CLICK & COLLECT STATUS ★
  `status` ENUM(
    'pending',              -- Order created, awaiting payment
    'paid',                 -- Payment confirmed
    'preparing',            -- Kitchen/barista working on order
    'ready_for_pickup',     -- Order complete, awaiting customer
    'completed',            -- Customer picked up order
    'cancelled'             -- Order cancelled
  ) DEFAULT 'pending',
  
  `pickup_code` VARCHAR(10) UNIQUE COMMENT 'Unique code for click-collect verification',
  
  -- Financial Breakdown
  `subtotal` DECIMAL(12,2) NOT NULL,
  `tax_id` BIGINT UNSIGNED,
  `service_charge_id` BIGINT UNSIGNED,
  `discount_id` BIGINT UNSIGNED,
  `discount_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_final` DECIMAL(12,2) NOT NULL,
  
  -- ★ LOYALTY INTEGRATION ★
  `points_earned` INT UNSIGNED DEFAULT 0 COMMENT 'Total points earned from this order (Product-Weighted sum)',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `paid_at` TIMESTAMP NULL,
  `ready_at` TIMESTAMP NULL COMMENT 'When order became ready for pickup',
  `completed_at` TIMESTAMP NULL,
  
  PRIMARY KEY (`order_id`),
  FOREIGN KEY (`member_id`) REFERENCES `member`(`member_id`) ON DELETE SET NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE SET NULL,
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`outlet_id`) REFERENCES `outlet`(`outlet_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`tax_id`) REFERENCES `tax`(`tax_id`) ON DELETE SET NULL,
  FOREIGN KEY (`service_charge_id`) REFERENCES `service_charge`(`service_charge_id`) ON DELETE SET NULL,
  FOREIGN KEY (`discount_id`) REFERENCES `discount`(`discount_id`) ON DELETE SET NULL,
  
  INDEX `idx_order_member` (`member_id`),
  INDEX `idx_order_source` (`source`),
  INDEX `idx_order_status` (`status`),
  INDEX `idx_order_created` (`created_at`),
  INDEX `idx_pickup_code` (`pickup_code`)
  -- Business Rule (enforced at application layer):
  -- Either member_id OR customer_id must be set, never both, never neither.
  -- CHECK constraint removed: MySQL 8.0.21+ disallows CHECK on FK SET NULL columns.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: order_items
-- Purpose: Individual line items within an order
-- KEY FEATURE: Stores points_earned_per_item for granular tracking
-- ----------------------------------------------------------------------------
CREATE TABLE `order_items` (
  `order_item_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `price_at_purchase` DECIMAL(12,2) NOT NULL COMMENT 'Snapshot of price (prevents retroactive changes)',
  
  -- ★ PRODUCT-WEIGHTED LOYALTY TRACKING ★
  `points_earned_per_item` INT UNSIGNED DEFAULT 0 COMMENT 'Snapshot of product.earning_points at purchase time',
  `total_points_for_line` INT UNSIGNED GENERATED ALWAYS AS (`quantity` * `points_earned_per_item`) STORED,
  
  `parent_item_id` BIGINT UNSIGNED NULL COMMENT 'For bundled products or combo meals',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`order_item_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`parent_item_id`) REFERENCES `order_items`(`order_item_id`) ON DELETE CASCADE,
  
  INDEX `idx_order_items_order` (`order_id`),
  INDEX `idx_order_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PRODUCT CUSTOMIZATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: modifier
-- Purpose: Product add-ons (extra shot, oat milk, extra cheese, etc.)
-- group_name groups related modifiers (e.g. 'Ukuran', 'Susu')
-- selection_type controls whether the customer picks one or many from the group
-- ----------------------------------------------------------------------------
CREATE TABLE `modifier` (
  `modifier_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `group_name` VARCHAR(100) NULL,
  `selection_type` ENUM('single','multiple') NOT NULL DEFAULT 'single',
  `extra_price` DECIMAL(12,2) DEFAULT 0.00,
  `type` ENUM('add', 'remove') NOT NULL DEFAULT 'add',
  `is_active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`modifier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: product_modifier
-- Purpose: Pivot — which modifiers are available for which products
-- ----------------------------------------------------------------------------
CREATE TABLE `product_modifier` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `modifier_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_modifier_product_id_modifier_id_unique` (`product_id`,`modifier_id`),
  CONSTRAINT `product_modifier_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_modifier_modifier_id_foreign` FOREIGN KEY (`modifier_id`) REFERENCES `modifier` (`modifier_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: order_item_modifier
-- Purpose: Junction table linking order items to their customizations
-- ----------------------------------------------------------------------------
CREATE TABLE `order_item_modifier` (
  `order_item_modifier_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `modifier_id` BIGINT UNSIGNED NOT NULL,
  `price_added` DECIMAL(12,2) DEFAULT 0.00,
  PRIMARY KEY (`order_item_modifier_id`),
  FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`order_item_id`) ON DELETE CASCADE,
  FOREIGN KEY (`modifier_id`) REFERENCES `modifier`(`modifier_id`) ON DELETE RESTRICT,
  INDEX `idx_modifier_order_item` (`order_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PAYMENT PROCESSING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: payment
-- Purpose: Payment transaction records with gateway integration
-- KEY FEATURE: Tracks Midtrans/Xendit sandbox webhooks
-- ----------------------------------------------------------------------------
CREATE TABLE `payment` (
  `payment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  
  -- Payment Method (all external - no internal wallet)
  `payment_method` ENUM(
    'QRIS',                     -- QR Code payment (primary for mobile app)
    'GoPay',                    -- External e-wallet
    'OVO',                      -- External e-wallet
    'Dana',                     -- External e-wallet
    'ShopeePay',                -- External e-wallet
    'Cash',                     -- In-store only
    'Debit Card',               -- Card payment
    'Credit Card',              -- Card payment
    'Bank Transfer'             -- Virtual account
  ) NOT NULL,
  
  -- Gateway Integration (Midtrans/Xendit)
  `payment_gateway` VARCHAR(50) COMMENT 'midtrans, xendit, manual',
  `transaction_id` VARCHAR(100) UNIQUE COMMENT 'Gateway transaction reference',
  `payment_url` TEXT COMMENT 'URL for payment page (QRIS, etc.)',
  `payment_response` JSON COMMENT 'Full webhook/callback response from gateway',
  
  -- Status Tracking
  `status` ENUM('pending', 'success', 'failed', 'expired', 'refunded') DEFAULT 'pending',
  `amount` DECIMAL(12,2) NOT NULL,
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `paid_at` TIMESTAMP NULL,
  `expired_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`payment_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  
  INDEX `idx_payment_order` (`order_id`),
  INDEX `idx_payment_status` (`status`),
  INDEX `idx_payment_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- LOYALTY SYSTEM TABLES (★ CORE THESIS FEATURE ★)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: reedem (Redemption Catalog)
-- Purpose: Defines which products are available for POINT REDEMPTION
-- KEY FEATURE: Separates "earning" from "burning" logic
-- ----------------------------------------------------------------------------
CREATE TABLE `reedem` (
  `reedem_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  
  -- ★ REDEMPTION COST ★
  `point_cost` INT UNSIGNED NOT NULL COMMENT 'Points required to redeem this item (Burn Mechanism)',
  
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Admin can toggle redemption availability',
  `stock_limit` INT UNSIGNED NULL COMMENT 'Optional: limit redemption quantity',
  `redemption_count` INT UNSIGNED DEFAULT 0 COMMENT 'Track popularity',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`reedem_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE,
  
  UNIQUE KEY `unique_redeemable_product` (`product_id`),
  INDEX `idx_reedem_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: points_history (Transaction Ledger)
-- Purpose: IMMUTABLE audit log of all point movements
-- KEY FEATURE: Enables point balance reconciliation and fraud detection
-- ----------------------------------------------------------------------------
CREATE TABLE `points_history` (
  `points_history_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NULL COMMENT 'Reference to order if points earned/redeemed via purchase',
  
  -- Transaction Details
  `points_change` INT NOT NULL COMMENT 'Positive for earn, negative for burn/expiry',
  `transaction_type` ENUM(
    'earned',               -- Points earned from purchase
    'redeemed',             -- Points spent on reward
    'expired',              -- Points expired due to inactivity
    'adjusted',             -- Manual correction by admin
    'refunded',             -- Points returned due to order cancellation
    'bonus'                 -- Promotional points (e.g., birthday bonus)
  ) NOT NULL,
  
  `description` VARCHAR(255) COMMENT 'Human-readable transaction note',
  `balance_before` INT UNSIGNED NOT NULL COMMENT 'Snapshot of points before transaction',
  `balance_after` INT UNSIGNED NOT NULL COMMENT 'Snapshot of points after transaction',
  
  `created_by` BIGINT UNSIGNED NULL COMMENT 'Staff ID if manually adjusted',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`points_history_id`),
  FOREIGN KEY (`member_id`) REFERENCES `member`(`member_id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL,
  
  INDEX `idx_points_history_member` (`member_id`),
  INDEX `idx_points_history_type` (`transaction_type`),
  INDEX `idx_points_history_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PRICING & DISCOUNT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: tax
-- Purpose: Tax configuration (PPN, local taxes)
-- ----------------------------------------------------------------------------
CREATE TABLE `tax` (
  `tax_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('nominal', 'percentage') NOT NULL DEFAULT 'percentage',
  `value` DECIMAL(12,2) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: service_charge
-- Purpose: Service charge configuration (e.g., 5% for dine-in)
-- ----------------------------------------------------------------------------
CREATE TABLE `service_charge` (
  `service_charge_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('nominal', 'percentage') NOT NULL DEFAULT 'percentage',
  `value` DECIMAL(12,2) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`service_charge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: discount
-- Purpose: Promotional discounts (promo codes, vouchers)
-- ----------------------------------------------------------------------------
CREATE TABLE `discount` (
  `discount_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) UNIQUE COMMENT 'Promo code (e.g., NEWUSER10)',
  `type` ENUM('nominal', 'percentage') NOT NULL,
  `value` DECIMAL(12,2) NOT NULL,
  `min_purchase` DECIMAL(12,2) DEFAULT 0.00,
  `max_discount` DECIMAL(12,2) NULL COMMENT 'Cap for percentage discounts',
  `usage_limit` INT UNSIGNED NULL COMMENT 'Total usage limit',
  `usage_count` INT UNSIGNED DEFAULT 0,
  `valid_from` TIMESTAMP NULL,
  `valid_until` TIMESTAMP NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`discount_id`),
  UNIQUE KEY `unique_discount_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OPERATIONAL TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: shift
-- Purpose: Track cashier cash drawer reconciliation
-- ----------------------------------------------------------------------------
CREATE TABLE `shift` (
  `shift_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` BIGINT UNSIGNED NOT NULL,
  `outlet_id` BIGINT UNSIGNED NOT NULL,
  `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `end_time` TIMESTAMP NULL,
  `cash_in_hand` DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Starting cash',
  `total_cash_received` DECIMAL(12,2) DEFAULT 0.00,
  `total_cash_out` DECIMAL(12,2) DEFAULT 0.00,
  `final_cash` DECIMAL(12,2) DEFAULT 0.00,
  `discrepancy` DECIMAL(12,2) GENERATED ALWAYS AS (
    `cash_in_hand` + `total_cash_received` - `total_cash_out` - `final_cash`
  ) STORED,
  PRIMARY KEY (`shift_id`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`outlet_id`) REFERENCES `outlet`(`outlet_id`) ON DELETE RESTRICT,
  INDEX `idx_shift_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: favorite
-- Purpose: Track outlet-level featured/favorite products (per-outlet quick picks)
-- ----------------------------------------------------------------------------
CREATE TABLE `favorite` (
  `favorite_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `outlet_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  FOREIGN KEY (`outlet_id`) REFERENCES `outlet`(`outlet_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_outlet_favorite` (`outlet_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample category
INSERT INTO `categories` (`name`, `description`) VALUES
('Coffee', 'Hot and cold coffee beverages'),
('Food', 'Pastries and light meals'),
('Merchandise', 'Branded merchandise and accessories');

-- Insert sample products with EARNING POINTS
INSERT INTO `products` (`category_id`, `name`, `description`, `base_price`, `earning_points`) VALUES
(1, 'Kopi Jaya Signature', 'House blend coffee', 25000.00, 25),  -- High margin = high points
(1, 'Cappuccino', 'Classic cappuccino', 30000.00, 30),
(2, 'Croissant', 'Butter croissant', 15000.00, 10),              -- Lower points for food
(3, 'Tote Bag', 'Branded tote bag', 50000.00, 50);

-- Insert redeemable rewards
INSERT INTO `reedem` (`product_id`, `point_cost`, `is_active`) VALUES
(1, 100, TRUE),  -- Free Kopi Jaya Signature for 100 points
(2, 120, TRUE),  -- Free Cappuccino for 120 points
(3, 50, TRUE);   -- Free Croissant for 50 points

-- Insert sample outlet
INSERT INTO `outlet` (`name`, `address`, `latitude`, `longitude`, `phone`, `status`) VALUES
('Toko Kopi Jaya - Sukun',     'Jl. Shodanco Supriyadi, Kel. Sukun, Kec. Sukun, Kota Malang 65147',     -7.9920686, 112.6208302, NULL, 'active'),
('Toko Kopi Jaya - Kepundung', 'Jl. Kepundung No. 32, Bareng, Kec. Klojen, Kota Malang 65100',         -7.9758960, 112.6145377, NULL, 'active'),
('Toko Kopi Jaya - Ijen',      'Jl. Buring, Oro-Oro Dowo, Kec. Klojen, Kota Malang 65115',             -7.9695022, 112.6241142, NULL, 'active');

-- Insert sample staff
INSERT INTO `staff` (`name`, `role`, `username`, `password`, `outlet_id`) VALUES
('Admin User', 'admin', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),  -- password: "password"
('Cashier User', 'cashier', 'cashier01', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Insert sample tax (PPN 11%)
INSERT INTO `tax` (`name`, `type`, `value`) VALUES
('PPN 11%', 'percentage', 11.00);

-- Insert sample member (for testing)
INSERT INTO `member` (`name`, `email`, `phone_number`, `password`, `current_points`, `tier`) VALUES
('Davis Hermanto', 'davis@example.com', '081234567890', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 150, 'Silver');

SET FOREIGN_KEY_CHECKS=1;
COMMIT;

-- ============================================================================
-- VIEWS FOR BUSINESS INTELLIGENCE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: v_member_loyalty_summary
-- Purpose: Quick overview of member loyalty status
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_member_loyalty_summary` AS
SELECT 
  m.member_id,
  m.name,
  m.email,
  m.current_points,
  m.lifetime_points_earned,
  m.tier,
  COUNT(DISTINCT o.order_id) AS total_orders,
  COALESCE(SUM(o.total_final), 0) AS total_spent,
  COALESCE(SUM(o.points_earned), 0) AS total_points_from_orders,
  MAX(o.created_at) AS last_order_date
FROM `member` m
LEFT JOIN `orders` o ON m.member_id = o.member_id
GROUP BY m.member_id;

-- ----------------------------------------------------------------------------
-- View: v_sales_by_source
-- Purpose: Analyze revenue by order source (Mobile App vs. Aggregators)
-- Usage: Addresses "Data Blindness" problem
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_sales_by_source` AS
SELECT 
  o.source,
  DATE(o.created_at) AS sale_date,
  COUNT(o.order_id) AS order_count,
  SUM(o.total_final) AS total_revenue,
  AVG(o.total_final) AS avg_order_value,
  SUM(CASE WHEN o.member_id IS NOT NULL THEN 1 ELSE 0 END) AS registered_member_orders,
  SUM(o.points_earned) AS total_points_issued
FROM `orders` o
WHERE o.status IN ('completed', 'paid')
GROUP BY o.source, DATE(o.created_at)
ORDER BY sale_date DESC, total_revenue DESC;

-- ----------------------------------------------------------------------------
-- View: v_product_performance
-- Purpose: Track product popularity and loyalty effectiveness
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_product_performance` AS
SELECT 
  p.product_id,
  p.name,
  p.earning_points,
  p.base_price,
  COUNT(oi.order_item_id) AS times_purchased,
  SUM(oi.quantity) AS total_quantity_sold,
  SUM(oi.quantity * oi.price_at_purchase) AS total_revenue,
  SUM(oi.total_points_for_line) AS total_points_issued
FROM `products` p
LEFT JOIN `order_items` oi ON p.product_id = oi.product_id
GROUP BY p.product_id
ORDER BY total_revenue DESC;

-- ============================================================================
-- TRIGGERS FOR LOYALTY AUTOMATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: after_order_item_insert
-- Purpose: Automatically calculate points_earned_per_item from product catalog
-- ----------------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER `trg_set_earning_points_on_order_item`
BEFORE INSERT ON `order_items`
FOR EACH ROW
BEGIN
  -- Snapshot the earning_points from the product catalog
  SET NEW.points_earned_per_item = (
    SELECT earning_points 
    FROM products 
    WHERE product_id = NEW.product_id
  );
END$$

DELIMITER ;

-- ----------------------------------------------------------------------------
-- Trigger: after_order_paid_update_points
-- Purpose: Credit points to member when order is paid
-- ----------------------------------------------------------------------------
DELIMITER $$

-- NOTE: must be BEFORE UPDATE, not AFTER. We mutate NEW.points_earned
-- in-place rather than running `UPDATE orders SET points_earned = ...`,
-- because a row-level trigger cannot UPDATE the table that fired it
-- (MySQL: "Can't update table 'orders' in stored function/trigger ...").
CREATE TRIGGER `trg_credit_points_after_payment`
BEFORE UPDATE ON `orders`
FOR EACH ROW
BEGIN
  -- Only execute when status changes to 'paid' and member exists
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.member_id IS NOT NULL THEN

    -- Calculate total points for the order
    SET @total_points = (
      SELECT COALESCE(SUM(total_points_for_line), 0)
      FROM order_items
      WHERE order_id = NEW.order_id
    );

    -- BEFORE UPDATE: set the value directly on NEW. This replaces the
    -- previous self-`UPDATE orders` which MySQL refuses to run.
    SET NEW.points_earned = @total_points;

    -- Credit points to member's balance
    UPDATE member
    SET 
      current_points = current_points + @total_points,
      lifetime_points_earned = lifetime_points_earned + @total_points
    WHERE member_id = NEW.member_id;
    
    -- Log the transaction in points_history
    INSERT INTO points_history (
      member_id, 
      order_id, 
      points_change, 
      transaction_type, 
      description,
      balance_before,
      balance_after
    )
    SELECT 
      NEW.member_id,
      NEW.order_id,
      @total_points,
      'earned',
      CONCAT('Points earned from Order #', NEW.order_id),
      current_points - @total_points,
      current_points
    FROM member 
    WHERE member_id = NEW.member_id;
    
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURES FOR BUSINESS LOGIC
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure: sp_redeem_reward
-- Purpose: Handle point redemption with validation and inventory tracking
-- Usage: CALL sp_redeem_reward(member_id, reedem_id, outlet_id, staff_id);
-- ----------------------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE `sp_redeem_reward`(
  IN p_member_id BIGINT UNSIGNED,
  IN p_reedem_id BIGINT UNSIGNED,
  IN p_outlet_id BIGINT UNSIGNED,
  IN p_staff_id BIGINT UNSIGNED,
  OUT p_result VARCHAR(255)
)
BEGIN
  DECLARE v_point_cost INT UNSIGNED;
  DECLARE v_current_points INT UNSIGNED;
  DECLARE v_product_id BIGINT UNSIGNED;
  DECLARE v_product_price DECIMAL(12,2);
  DECLARE v_new_order_id BIGINT UNSIGNED;
  
  -- Start transaction
  START TRANSACTION;
  
  -- Get redemption details
  SELECT point_cost, product_id 
  INTO v_point_cost, v_product_id
  FROM reedem 
  WHERE reedem_id = p_reedem_id AND is_active = TRUE;
  
  -- Check if redemption exists
  IF v_point_cost IS NULL THEN
    SET p_result = 'ERROR: Invalid or inactive redemption item';
    ROLLBACK;
  ELSE
    -- Get member's current points
    SELECT current_points INTO v_current_points
    FROM member 
    WHERE member_id = p_member_id;
    
    -- Validate sufficient balance
    IF v_current_points < v_point_cost THEN
      SET p_result = CONCAT('ERROR: Insufficient points. Required: ', v_point_cost, ', Available: ', v_current_points);
      ROLLBACK;
    ELSE
      -- Get product price
      SELECT base_price INTO v_product_price
      FROM products 
      WHERE product_id = v_product_id;
      
      -- Create order with Rp 0 total (redemption order)
      INSERT INTO orders (
        member_id, staff_id, outlet_id, source, order_type, status,
        subtotal, total_final, points_earned
      ) VALUES (
        p_member_id, p_staff_id, p_outlet_id, 'Mobile App', 'click-collect', 'paid',
        0.00, 0.00, 0
      );
      
      SET v_new_order_id = LAST_INSERT_ID();
      
      -- Add order item (with snapshot price but charged as Rp 0)
      INSERT INTO order_items (
        order_id, product_id, quantity, price_at_purchase, points_earned_per_item
      ) VALUES (
        v_new_order_id, v_product_id, 1, v_product_price, 0
      );
      
      -- Deduct points from member
      UPDATE member 
      SET current_points = current_points - v_point_cost
      WHERE member_id = p_member_id;
      
      -- Log the redemption
      INSERT INTO points_history (
        member_id, order_id, points_change, transaction_type, description,
        balance_before, balance_after
      )
      SELECT 
        p_member_id,
        v_new_order_id,
        -v_point_cost,
        'redeemed',
        CONCAT('Redeemed reward: Order #', v_new_order_id),
        current_points + v_point_cost,
        current_points
      FROM member 
      WHERE member_id = p_member_id;
      
      -- Update redemption count
      UPDATE reedem 
      SET redemption_count = redemption_count + 1
      WHERE reedem_id = p_reedem_id;
      
      COMMIT;
      SET p_result = CONCAT('SUCCESS: Order #', v_new_order_id, ' created. Points deducted: ', v_point_cost);
    END IF;
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_orders_member_status_created` ON `orders`(`member_id`, `status`, `created_at`);
CREATE INDEX `idx_points_history_member_created` ON `points_history`(`member_id`, `created_at`);
CREATE INDEX `idx_order_items_product_created` ON `order_items`(`product_id`, `created_at`);

-- ============================================================================
-- DOCUMENTATION COMPLETE
-- ============================================================================
-- This schema implements the Product-Weighted Loyalty Algorithm as described
-- in the thesis methodology. Key features:
--
-- 1. EARNING MECHANISM: 
--    - Products have 'earning_points' (not flat % of price)
--    - Admin can strategically weight high-margin items
--
-- 2. BURNING MECHANISM:
--    - Separate 'reedem' catalog with point_cost
--    - Creates Rp 0 orders to maintain inventory accuracy
--
-- 3. DATA OWNERSHIP:
--    - 'source' ENUM tracks Mobile App vs. Aggregators
--    - Solves "Data Blindness" problem
--
-- 4. CLICK & COLLECT:
--    - Status enum with 'ready_for_pickup'
--    - pickup_code for verification
--
-- 5. AUDIT TRAIL:
--    - points_history provides immutable ledger
--    - All point movements are logged
--
-- Database is now ready for NestJS backend implementation.
-- ============================================================================


-- ############################################################################
-- PART B - RECONCILIATION PATCH
-- Brings FINAL.sql up to the current 21 entities. Verified column-by-column.
-- ############################################################################

-- B1. Soft delete (M-116) - @DeleteDateColumn on these entities.
ALTER TABLE `categories` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `products` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `modifier` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `staff` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `member` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `outlet` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `discount` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `tax` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `service_charge` ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;

-- B2. outlet.logo_url - written by OutletsService.uploadLogo(). No migration
--     in the repo ever created it; recovered from the entity definition.
ALTER TABLE `outlet` ADD COLUMN `logo_url` VARCHAR(500) NULL DEFAULT NULL AFTER `phone`;

-- B3. products.stock - mapped by the Product entity.
ALTER TABLE `products` ADD COLUMN `stock` INT NOT NULL DEFAULT 0;

-- B4. payment cash-handling columns - mapped by the Payment entity.
ALTER TABLE `payment`
  ADD COLUMN `amount_paid`   DECIMAL(12,2) NULL DEFAULT NULL,
  ADD COLUMN `change_amount` DECIMAL(12,2) NULL DEFAULT NULL;

-- B5. orders dine-in columns (M-150).
ALTER TABLE `orders`
  ADD COLUMN `table_id`  BIGINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `pax`       INT             NULL DEFAULT NULL,
  ADD COLUMN `waiter_id` BIGINT UNSIGNED NULL DEFAULT NULL;

-- B6. order_items.notes (M-150).
ALTER TABLE `order_items` ADD COLUMN `notes` VARCHAR(255) NULL DEFAULT NULL;

-- B7. staff.role - extend enum with 'super_admin' (M-125).
ALTER TABLE `staff`
  MODIFY COLUMN `role` ENUM('super_admin','admin','cashier','manager','barista') NOT NULL;

-- B8. outlet_products junction (M-125). Backfill runs AFTER B1 because it
--     filters on deleted_at - order matters.
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

INSERT IGNORE INTO `outlet_products` (`outlet_id`, `product_id`, `price_override`, `is_available`)
SELECT o.outlet_id, p.product_id, NULL, 1
FROM `outlet` o
CROSS JOIN `products` p
WHERE o.deleted_at IS NULL
  AND p.deleted_at IS NULL;

-- B9. events table + demo rows (M-147).
CREATE TABLE IF NOT EXISTS `events` (
  `event_id`    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `outlet_id`   BIGINT UNSIGNED NULL     DEFAULT NULL COMMENT 'NULL = visible at all outlets (global)',
  `title`       VARCHAR(200)    NOT NULL,
  `description` TEXT            NULL,
  `img_url`     VARCHAR(500)    NULL,
  `tag`         VARCHAR(50)     NULL     COMMENT 'Short label chip, e.g. TERBATAS / EKSKLUSIF',
  `start_date`  DATE            NOT NULL,
  `end_date`    DATE            NOT NULL,
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME        NULL,
  PRIMARY KEY (`event_id`),
  CONSTRAINT `fk_events_outlet`
    FOREIGN KEY (`outlet_id`) REFERENCES `outlet` (`outlet_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `events` (`outlet_id`, `title`, `description`, `tag`, `start_date`, `end_date`, `is_active`) VALUES
(NULL, 'Happy Hour', 'Diskon 20% setiap hari pukul 14.00 – 17.00', 'TERBATAS', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1),
(NULL, 'Member Reward', 'Kumpulkan poin setiap transaksi & tukarkan hadiah menarik', 'EKSKLUSIF', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 1),
(NULL, 'Buy 2 Get 1', 'Berlaku untuk semua minuman es setiap hari Jumat', 'JANGAN LEWAT', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1);


-- ############################################################################
-- PART C - VIEW OVERRIDE
-- FINAL.sql's v_sales_by_source predates M-129 and lacks outlet_id, which the
-- analytics service filters on. Replace it with the M-129 definition.
-- ############################################################################

CREATE OR REPLACE VIEW `v_sales_by_source` AS
SELECT
  o.outlet_id,
  o.source,
  DATE(o.created_at) AS sale_date,
  COUNT(o.order_id) AS order_count,
  SUM(o.total_final) AS total_revenue,
  AVG(o.total_final) AS avg_order_value,
  SUM(CASE WHEN o.member_id IS NOT NULL THEN 1 ELSE 0 END) AS registered_member_orders,
  SUM(o.points_earned) AS total_points_issued
FROM `orders` o
WHERE o.status IN ('completed', 'paid')
GROUP BY o.outlet_id, o.source, DATE(o.created_at)
ORDER BY sale_date DESC, total_revenue DESC;

SELECT 'Consolidated schema v2 applied.' AS status;
