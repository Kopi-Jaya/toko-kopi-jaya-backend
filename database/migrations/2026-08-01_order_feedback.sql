-- Phase D (Collaborative CRM): post-order feedback/rating.
-- Confirmed via full codebase search: zero feedback/rating/review infrastructure
-- existed anywhere before this — genuinely new schema, not a rename of dormant plumbing.

CREATE TABLE IF NOT EXISTS `order_feedback` (
  `feedback_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'One rating per order — enforced by the UNIQUE key below',
  `member_id` BIGINT UNSIGNED NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL COMMENT '1 (worst) to 5 (best)',
  `comment` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  UNIQUE KEY `unique_order_feedback` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `member`(`member_id`) ON DELETE CASCADE,
  INDEX `idx_order_feedback_member` (`member_id`),
  INDEX `idx_order_feedback_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
