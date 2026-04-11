import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  OrderStatus,
  OrderSource,
  OrderType,
} from '../../common/enums';
import { Member } from '../../members/entities/member.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Outlet } from '../../outlets/entities/outlet.entity';
import { Tax } from '../../tax/entities/tax.entity';
import { ServiceCharge } from '../../service-charge/entities/service-charge.entity';
import { Discount } from '../../discounts/entities/discount.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../../payment/entities/payment.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  order_id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  member_id: number | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  customer_id: number | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  staff_id: number | null;

  @Column({ type: 'bigint', unsigned: true })
  outlet_id: number;

  @Column({
    type: 'enum',
    enum: OrderSource,
    default: OrderSource.POS_IN_STORE,
  })
  source: OrderSource;

  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.TAKEAWAY,
  })
  order_type: OrderType;

  @Column({ type: 'varchar', length: 10, nullable: true })
  table_number: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  pickup_code: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  tax_id: number | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  service_charge_id: number | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  discount_id: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_final: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  points_earned: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ready_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => Member, (member) => member.orders)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Staff, (staff) => staff.orders, { nullable: true })
  @JoinColumn({ name: 'staff_id' })
  staff: Staff | null;

  @ManyToOne(() => Outlet, (outlet) => outlet.orders)
  @JoinColumn({ name: 'outlet_id' })
  outlet: Outlet;

  @ManyToOne(() => Tax)
  @JoinColumn({ name: 'tax_id' })
  tax: Tax;

  @ManyToOne(() => ServiceCharge)
  @JoinColumn({ name: 'service_charge_id' })
  service_charge: ServiceCharge;

  @ManyToOne(() => Discount)
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  order_items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;
}
