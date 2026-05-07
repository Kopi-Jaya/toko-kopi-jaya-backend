import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Outlet } from './outlet.entity';
import { Product } from '../../products/entities/product.entity';

/// M-125 junction: which products each outlet sells, with optional per-outlet
/// price override and availability flag.
///
/// `products` remains a global master catalog. To activate a product at an
/// outlet, insert a row here. To deactivate it (without deleting from the
/// catalog), set `is_available=false` or soft-delete this row. Price falls
/// back to `products.base_price` when `price_override` is NULL.
///
/// Unique on (outlet_id, product_id) — one activation row per pair.
@Entity('outlet_products')
@Unique('uq_outlet_product', ['outlet_id', 'product_id'])
export class OutletProduct {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  outlet_product_id: number;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  outlet_id: number;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  /// Per-outlet price override. NULL means use products.base_price.
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price_override: number | null;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @ManyToOne(() => Outlet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outlet_id' })
  outlet: Outlet;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
