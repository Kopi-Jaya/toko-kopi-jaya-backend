import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';
import { ChargeType } from '../../common/enums';

@Entity('discount')
export class Discount {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  discount_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code: string | null;

  @Column({ type: 'enum', enum: ChargeType })
  type: ChargeType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  min_purchase: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  max_discount: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  usage_limit: number | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  usage_count: number;

  @Column({ type: 'timestamp', nullable: true })
  valid_from: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  valid_until: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
