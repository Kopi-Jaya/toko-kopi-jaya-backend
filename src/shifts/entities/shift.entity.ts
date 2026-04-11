import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Outlet } from '../../outlets/entities/outlet.entity';

@Entity('shift')
export class Shift {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  shift_id: number;

  @Column({ type: 'bigint', unsigned: true })
  staff_id: number;

  @Column({ type: 'bigint', unsigned: true })
  outlet_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cash_in_hand: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_cash_received: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_cash_out: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  final_cash: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    insert: false,
    update: false,
    select: true,
  })
  discrepancy: number;

  @ManyToOne(() => Staff, (staff) => staff.shifts)
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @ManyToOne(() => Outlet, (outlet) => outlet.shifts)
  @JoinColumn({ name: 'outlet_id' })
  outlet: Outlet;
}
