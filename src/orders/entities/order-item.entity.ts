import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderItemModifier } from './order-item-modifier.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  order_item_id: number;

  @Column({ type: 'bigint', unsigned: true })
  order_id: number;

  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price_at_purchase: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  points_earned_per_item: number;

  @Column({
    type: 'int',
    unsigned: true,
    insert: false,
    update: false,
    select: true,
  })
  total_points_for_line: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parent_item_id: number | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Order, (order) => order.order_items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.order_items)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => OrderItem, (item) => item.children)
  @JoinColumn({ name: 'parent_item_id' })
  parent_item: OrderItem;

  @OneToMany(() => OrderItem, (item) => item.parent_item)
  children: OrderItem[];

  @OneToMany(() => OrderItemModifier, (oim) => oim.order_item)
  modifiers: OrderItemModifier[];
}
