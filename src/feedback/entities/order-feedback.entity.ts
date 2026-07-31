import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('order_feedback')
export class OrderFeedback {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  feedback_id: number;

  @Column({ type: 'bigint', unsigned: true, unique: true })
  order_id: number;

  @Column({ type: 'bigint', unsigned: true })
  member_id: number;

  @Column({ type: 'tinyint', unsigned: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
