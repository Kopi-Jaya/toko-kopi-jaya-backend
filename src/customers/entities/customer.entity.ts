import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  customer_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
