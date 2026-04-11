import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../../common/enums';
import { Order } from '../../orders/entities/order.entity';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  payment_id: number;

  @Column({ type: 'bigint', unsigned: true })
  order_id: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_gateway: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  transaction_id: string | null;

  @Column({ type: 'text', nullable: true })
  payment_url: string | null;

  @Column({ type: 'json', nullable: true })
  payment_response: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expired_at: Date | null;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
