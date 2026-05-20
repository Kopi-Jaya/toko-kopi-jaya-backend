import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSalesBySource(query: QueryAnalyticsDto) {
    let sql = `SELECT source,
        SUM(order_count)  AS total_orders,
        SUM(total_revenue) AS total_revenue
      FROM v_sales_by_source WHERE 1=1`;
    const params: any[] = [];

    if (query.outlet_id) {
      sql += ' AND outlet_id = ?';
      params.push(query.outlet_id);
    }
    if (query.date_from) {
      sql += ' AND sale_date >= ?';
      params.push(query.date_from);
    }
    if (query.date_to) {
      sql += ' AND sale_date <= ?';
      params.push(query.date_to);
    }

    sql += ' GROUP BY source ORDER BY total_revenue DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    return this.dataSource.query(sql, params);
  }

  async getProductPerformance(query: QueryAnalyticsDto) {
    const params: any[] = [];
    let sql: string;

    if (query.outlet_id) {
      // Direct join so we can filter by outlet
      sql = `SELECT p.product_id, p.name,
          SUM(oi.quantity) AS total_quantity_sold,
          SUM(oi.quantity * oi.price_at_purchase) AS total_revenue
        FROM products p
        JOIN order_items oi ON p.product_id = oi.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.outlet_id = ?`;
      params.push(query.outlet_id);
      if (query.date_from) { sql += ' AND DATE(o.created_at) >= ?'; params.push(query.date_from); }
      if (query.date_to)   { sql += ' AND DATE(o.created_at) <= ?'; params.push(query.date_to); }
      sql += ' GROUP BY p.product_id ORDER BY total_quantity_sold DESC';
    } else {
      sql = 'SELECT * FROM v_product_performance WHERE 1=1';
      if (query.category_id) { sql += ' AND category_id = ?'; params.push(query.category_id); }
      if (query.date_from)   { sql += ' AND order_date >= ?'; params.push(query.date_from); }
      if (query.date_to)     { sql += ' AND order_date <= ?'; params.push(query.date_to); }
      const allowed = ['total_quantity_sold', 'total_revenue', 'product_name', 'order_date'];
      sql += query.sort_by && allowed.includes(query.sort_by)
        ? ` ORDER BY ${query.sort_by} DESC`
        : ' ORDER BY total_quantity_sold DESC';
    }

    if (query.limit) { sql += ' LIMIT ?'; params.push(query.limit); }
    return this.dataSource.query(sql, params);
  }

  async getProductOutlets() {
    const rows = await this.dataSource.query(`
      SELECT op.product_id,
             GROUP_CONCAT(o.name ORDER BY o.name SEPARATOR ', ') AS outlet_names
      FROM outlet_products op
      JOIN outlet o ON op.outlet_id = o.outlet_id
      WHERE op.deleted_at IS NULL
      GROUP BY op.product_id
    `);
    return rows.map((r: { product_id: number; outlet_names: string }) => ({
      product_id: Number(r.product_id),
      outlet_names: r.outlet_names ? r.outlet_names.split(', ') : [],
    }));
  }

  async getMemberLoyalty(query: QueryAnalyticsDto) {
    const params: any[] = [];
    let sql: string;

    if (query.outlet_id) {
      // Members who have ordered at this specific outlet
      sql = `SELECT m.member_id, m.name, m.tier,
          m.lifetime_points_earned, m.current_points,
          COUNT(DISTINCT o.order_id) AS total_orders
        FROM member m
        JOIN orders o ON m.member_id = o.member_id
        WHERE o.outlet_id = ?`;
      params.push(query.outlet_id);
      if (query.tier) { sql += ' AND m.tier = ?'; params.push(query.tier); }
      sql += ' GROUP BY m.member_id ORDER BY m.lifetime_points_earned DESC';
    } else {
      sql = 'SELECT * FROM v_member_loyalty_summary WHERE 1=1';
      if (query.tier) { sql += ' AND tier = ?'; params.push(query.tier); }
      const allowed = ['lifetime_points_earned', 'current_points', 'total_orders', 'total_spent', 'name'];
      sql += query.sort_by && allowed.includes(query.sort_by)
        ? ` ORDER BY ${query.sort_by} DESC`
        : ' ORDER BY lifetime_points_earned DESC';
    }

    if (query.limit) { sql += ' LIMIT ?'; params.push(query.limit); }
    return this.dataSource.query(sql, params);
  }
}
