import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PointsTransactionType } from '../../common/enums';
import { Member } from './member.entity';
import { Order } from '../../orders/entities/order.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity('points_history')
export class PointsHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  points_history_id: number;

  @Column({ type: 'bigint', unsigned: true })
  member_id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  order_id: number | null;

  @Column({ type: 'int' })
  points_change: number;

  @Column({ type: 'enum', enum: PointsTransactionType })
  transaction_type: PointsTransactionType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'int', unsigned: true })
  balance_before: number;

  @Column({ type: 'int', unsigned: true })
  balance_after: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  created_by: number | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Member, (member) => member.points_history)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'created_by' })
  created_by_staff: Staff;
}
