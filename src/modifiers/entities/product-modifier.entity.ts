import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Modifier } from './modifier.entity';

@Entity('product_modifier')
@Unique(['product_id', 'modifier_id'])
export class ProductModifier {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @Column({ type: 'bigint', unsigned: true })
  modifier_id: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Modifier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modifier_id' })
  modifier: Modifier;
}
