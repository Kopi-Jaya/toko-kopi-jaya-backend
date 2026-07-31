import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { MemberTier } from '../../common/enums';

@Entity('reedem')
export class Reedem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  reedem_id: number;

  @Column({ type: 'bigint', unsigned: true, unique: true })
  product_id: number;

  @Column({ type: 'int', unsigned: true })
  point_cost: number;

  @Column({ type: 'enum', enum: MemberTier, nullable: true, default: null })
  min_tier: MemberTier | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', unsigned: true, nullable: true })
  stock_limit: number | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  redemption_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Product, (product) => product.reedem)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
