import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Modifier } from '../../modifiers/entities/modifier.entity';

@Entity('order_item_modifier')
export class OrderItemModifier {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  order_item_modifier_id: number;

  @Column({ type: 'bigint', unsigned: true })
  order_item_id: number;

  @Column({ type: 'bigint', unsigned: true })
  modifier_id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_added: number;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.modifiers)
  @JoinColumn({ name: 'order_item_id' })
  order_item: OrderItem;

  @ManyToOne(() => Modifier)
  @JoinColumn({ name: 'modifier_id' })
  modifier: Modifier;
}
