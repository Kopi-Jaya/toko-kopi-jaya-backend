import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { StaffRole } from '../../common/enums';
import { Outlet } from '../../outlets/entities/outlet.entity';
import { Order } from '../../orders/entities/order.entity';
import { Shift } from '../../shifts/entities/shift.entity';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  staff_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: StaffRole })
  role: StaffRole;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  outlet_id: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Outlet, (outlet) => outlet.staff)
  @JoinColumn({ name: 'outlet_id' })
  outlet: Outlet;

  @OneToMany(() => Order, (order) => order.staff)
  orders: Order[];

  @OneToMany(() => Shift, (shift) => shift.staff)
  shifts: Shift[];
}
