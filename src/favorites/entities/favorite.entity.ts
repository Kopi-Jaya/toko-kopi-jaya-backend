import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Outlet } from '../../outlets/entities/outlet.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('favorite')
@Unique(['outlet_id', 'product_id'])
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  favorite_id: number;

  @Column({ type: 'bigint', unsigned: true })
  outlet_id: number;

  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Outlet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outlet_id' })
  outlet: Outlet;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
