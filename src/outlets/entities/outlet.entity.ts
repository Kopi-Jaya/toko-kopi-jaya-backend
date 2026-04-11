import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OutletStatus } from '../../common/enums';
import { Staff } from '../../staff/entities/staff.entity';
import { Order } from '../../orders/entities/order.entity';
import { Shift } from '../../shifts/entities/shift.entity';

@Entity('outlet')
export class Outlet {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  outlet_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: OutletStatus, default: OutletStatus.ACTIVE })
  status: OutletStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Staff, (staff) => staff.outlet)
  staff: Staff[];

  @OneToMany(() => Order, (order) => order.outlet)
  orders: Order[];

  @OneToMany(() => Shift, (shift) => shift.outlet)
  shifts: Shift[];
}
