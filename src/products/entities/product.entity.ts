import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Reedem } from '../../redeem/entities/reedem.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  product_id: number;

  @Column({ type: 'bigint', unsigned: true })
  category_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  base_price: number;

  @Column({ type: 'text', nullable: true })
  img_url: string | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  earning_points: number;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  order_items: OrderItem[];

  @OneToOne(() => Reedem, (reedem) => reedem.product)
  reedem: Reedem;
}
