-- M-197 / BUG-2026-003 — recalculate member.tier whenever points are earned.
--
-- PROBLEM
-- `member.tier` was only ever recalculated in LoyaltyService.adjustPoints, i.e.
-- the admin manual-adjust path. Points earned from an order are credited by
-- `trg_credit_points_after_payment`, which updated current_points and
-- lifetime_points_earned but never touched `tier` — so **buying things could
-- never promote a member.** Live evidence before this change:
--   Bagus Pratama  lifetime 300  tier Bronze   (Silver threshold is 200)
--   Rizky Ananda   lifetime 337  tier Bronze   (should be Silver)
-- Tier was effectively whatever the seed happened to set.
--
-- WHY IN THE TRIGGER
-- Three separate code paths move an order to `paid` (payment.service cash,
-- payment.service QRIS confirm, orders.service status update). Putting the rule
-- in the trigger covers all three at one chokepoint and cannot drift, which
-- matches the existing project decision to keep loyalty logic in the database
-- "for consistency regardless of API entry point".
--
-- THRESHOLDS — single source of truth, must match loyalty.service.ts
-- TIER_THRESHOLDS: Bronze 0 / Silver 200 / Gold 1000 / Platinum 5000
--
-- NO DOWNGRADE
-- Tiers never fall. lifetime_points_earned only ever increases, so the computed
-- tier cannot drop on its own — but seeded data contains members sitting ABOVE
-- their earned tier (Nadia: lifetime 2678, tier Platinum, threshold 5000). A
-- naive recalculation would demote her on her next purchase. The FIELD() rank
-- comparison below only ever moves a member up.
--
-- SAFETY NOTES
--  * This is a BEFORE UPDATE trigger on `orders` and must stay that way: a
--    row-level trigger cannot UPDATE its own table (DEFECT-003 / error 1442),
--    which is why points_earned is written with `SET NEW.points_earned`.
--    Updating `member` from here is fine — it is a different table.
--  * @new_lifetime is computed BEFORE the UPDATE so the CASE cannot depend on
--    MySQL's left-to-right SET evaluation order.
--  * Everything below the tier block is byte-identical to the previous trigger
--    body; only the tier logic is new.

DROP TRIGGER IF EXISTS trg_credit_points_after_payment;

DELIMITER $$

CREATE TRIGGER trg_credit_points_after_payment
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.member_id IS NOT NULL THEN

        SET @total_points = (
            SELECT COALESCE(SUM(total_points_for_line), 0)
            FROM order_items
            WHERE order_id = NEW.order_id
        );

        SET NEW.points_earned = @total_points;

        -- Lifetime total after this credit, resolved up front.
        SET @new_lifetime = (
            SELECT lifetime_points_earned FROM member WHERE member_id = NEW.member_id
        ) + @total_points;

        -- Tier the new lifetime total earns.
        SET @earned_tier = CASE
            WHEN @new_lifetime >= 5000 THEN 'Platinum'
            WHEN @new_lifetime >= 1000 THEN 'Gold'
            WHEN @new_lifetime >= 200  THEN 'Silver'
            ELSE 'Bronze'
        END;

        -- Promote only. FIELD() gives each tier an ordinal so the comparison is
        -- explicit rather than relying on the ENUM's declaration order.
        SET @current_rank = (
            SELECT FIELD(tier, 'Bronze', 'Silver', 'Gold', 'Platinum')
            FROM member WHERE member_id = NEW.member_id
        );
        SET @earned_rank = FIELD(@earned_tier, 'Bronze', 'Silver', 'Gold', 'Platinum');

        UPDATE member
        SET
            current_points = current_points + @total_points,
            lifetime_points_earned = @new_lifetime,
            tier = IF(@earned_rank > @current_rank, @earned_tier, tier)
        WHERE member_id = NEW.member_id;

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

-- ─── One-off reconciliation of members already owed a promotion ──────────────
-- Promote only; never demote. This corrects Bagus (300 -> Silver) and Rizky
-- (337 -> Silver). Nadia is deliberately LEFT at Platinum despite only having
-- 2678 lifetime points: demoting seeded data would contradict the no-downgrade
-- rule and could invalidate figures already pasted into the thesis.
UPDATE member
SET tier = CASE
        WHEN lifetime_points_earned >= 5000 THEN 'Platinum'
        WHEN lifetime_points_earned >= 1000 THEN 'Gold'
        WHEN lifetime_points_earned >= 200  THEN 'Silver'
        ELSE 'Bronze'
    END
WHERE FIELD(
        CASE
            WHEN lifetime_points_earned >= 5000 THEN 'Platinum'
            WHEN lifetime_points_earned >= 1000 THEN 'Gold'
            WHEN lifetime_points_earned >= 200  THEN 'Silver'
            ELSE 'Bronze'
        END, 'Bronze', 'Silver', 'Gold', 'Platinum')
      > FIELD(tier, 'Bronze', 'Silver', 'Gold', 'Platinum');
