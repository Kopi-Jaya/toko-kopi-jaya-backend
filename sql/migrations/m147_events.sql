-- M-147: Events feature — per-outlet events, promos, banners
-- Run once on live MySQL after deploying the backend code.

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

-- Seed a couple of demo events
INSERT INTO `events` (`outlet_id`, `title`, `description`, `tag`, `start_date`, `end_date`, `is_active`) VALUES
(NULL, 'Happy Hour', 'Diskon 20% setiap hari pukul 14.00 – 17.00', 'TERBATAS', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1),
(NULL, 'Member Reward', 'Kumpulkan poin setiap transaksi & tukarkan hadiah menarik', 'EKSKLUSIF', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 1),
(NULL, 'Buy 2 Get 1', 'Berlaku untuk semua minuman es setiap hari Jumat', 'JANGAN LEWAT', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1);
