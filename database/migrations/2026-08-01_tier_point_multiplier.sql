-- Tier-based point multiplier + tier-exclusive rewards.
--
-- THESIS BASIS
-- Chapter VII "Suggestions" (Fifth) and Chapter II §2.2.2 already document this as a
-- planned enhancement to the Product-Weighted Loyalty Algorithm, grounded in Drèze &
-- Nunes (2008): accelerated point-earning for higher tiers, paired with a small number
-- of tier-exclusive rewards. This migration is the actual implementation.
--
-- MULTIPLIER
-- Points Earned = Base Points × Tier Multiplier
-- Bronze 1.00 / Silver 1.10 / Gold 1.25 / Platinum 1.50 — must match
-- TIER_MULTIPLIERS in backend/src/loyalty/loyalty.service.ts.
--
-- WHY THE MEMBER'S TIER IS READ FIRST, BEFORE @new_lifetime
-- The multiplier must use the tier the member holds BEFORE this purchase — a purchase
-- that promotes a member from Silver to Gold earns at the Silver rate, not the Gold
-- rate it just unlocked. `@member_tier` is therefore resolved in the same first step
-- as the old trigger's @total_points, before any promotion logic runs.
--
-- Everything else (BEFORE UPDATE requirement, FIELD() promote-only rank comparison,
-- points_history insert) is unchanged from the M-197 trigger — see that migration's
-- header comment for why those constraints exist.

DROP TRIGGER IF EXISTS trg_credit_points_after_payment;

DELIMITER $$

CREATE TRIGGER trg_credit_points_after_payment
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.member_id IS NOT NULL THEN

        SET @member_tier = (
            SELECT tier FROM member WHERE member_id = NEW.member_id
        );

        SET @multiplier = CASE @member_tier
            WHEN 'Bronze'   THEN 1.00
            WHEN 'Silver'   THEN 1.10
            WHEN 'Gold'     THEN 1.25
            WHEN 'Platinum' THEN 1.50
            ELSE 1.00
        END;

        SET @base_points = (
            SELECT COALESCE(SUM(total_points_for_line), 0)
            FROM order_items
            WHERE order_id = NEW.order_id
        );

        -- FLOOR: points_earned/current_points/lifetime_points_earned are all
        -- INT UNSIGNED — a fractional multiplier result must not be stored.
        SET @total_points = FLOOR(@base_points * @multiplier);

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
        SET @current_rank = FIELD(@member_tier, 'Bronze', 'Silver', 'Gold', 'Platinum');
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

-- ─── Tier-exclusive rewards ───────────────────────────────────────────────────
-- NULL = no restriction (every existing reward keeps working exactly as before).
-- Davis flags specific rewards as tier-restricted afterward through the admin UI;
-- no rewards are pre-designated by this migration.
ALTER TABLE `reedem`
  ADD COLUMN `min_tier` ENUM('Bronze','Silver','Gold','Platinum') NULL DEFAULT NULL
  COMMENT 'NULL = redeemable by any tier. Otherwise the minimum member tier required.'
  AFTER `point_cost`;
