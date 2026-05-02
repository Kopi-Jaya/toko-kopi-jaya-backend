import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';
import { ChargeType } from '../../common/enums';

@Entity('service_charge')
export class ServiceCharge {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  service_charge_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ChargeType, default: ChargeType.PERCENTAGE })
  type: ChargeType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
