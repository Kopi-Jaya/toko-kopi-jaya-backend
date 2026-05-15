-- M-129: Add outlet_id to v_sales_by_source so analytics can be filtered per branch.
-- v_product_performance and v_member_loyalty_summary are handled via direct SQL
-- in the service when outlet_id is provided — no view change needed for those.

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
