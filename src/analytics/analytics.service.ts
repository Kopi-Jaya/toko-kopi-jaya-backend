import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSalesBySource(query: QueryAnalyticsDto) {
    // Aggregate the date-bucketed view into one row per source so the
    // pie chart gets a single slice per channel (Mobile App, etc.).
    let sql = `SELECT source,
        SUM(order_count)  AS total_orders,
        SUM(total_revenue) AS total_revenue
      FROM v_sales_by_source WHERE 1=1`;
    const params: any[] = [];

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
    let sql = 'SELECT * FROM v_product_performance WHERE 1=1';
    const params: any[] = [];

    if (query.category_id) {
      sql += ' AND category_id = ?';
      params.push(query.category_id);
    }
    if (query.date_from) {
      sql += ' AND order_date >= ?';
      params.push(query.date_from);
    }
    if (query.date_to) {
      sql += ' AND order_date <= ?';
      params.push(query.date_to);
    }

    if (query.sort_by) {
      const allowed = ['total_quantity_sold', 'total_revenue', 'product_name', 'order_date'];
      if (allowed.includes(query.sort_by)) {
        sql += ` ORDER BY ${query.sort_by} DESC`;
      }
    } else {
      sql += ' ORDER BY total_quantity_sold DESC';
    }

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    return this.dataSource.query(sql, params);
  }

  async getMemberLoyalty(query: QueryAnalyticsDto) {
    let sql = 'SELECT * FROM v_member_loyalty_summary WHERE 1=1';
    const params: any[] = [];

    if (query.tier) {
      sql += ' AND tier = ?';
      params.push(query.tier);
    }

    if (query.sort_by) {
      const allowed = ['lifetime_points_earned', 'current_points', 'total_orders', 'total_spent', 'name'];
      if (allowed.includes(query.sort_by)) {
        sql += ` ORDER BY ${query.sort_by} DESC`;
      }
    } else {
      sql += ' ORDER BY lifetime_points_earned DESC';
    }

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    return this.dataSource.query(sql, params);
  }
}
