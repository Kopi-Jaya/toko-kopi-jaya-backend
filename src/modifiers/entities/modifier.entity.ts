import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';
import { ModifierSelectionType, ModifierType } from '../../common/enums';

@Entity('modifier')
export class Modifier {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  modifier_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  group_name: string | null;

  @Column({
    type: 'enum',
    enum: ModifierSelectionType,
    default: ModifierSelectionType.SINGLE,
  })
  selection_type: ModifierSelectionType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  extra_price: number;

  @Column({ type: 'enum', enum: ModifierType, default: ModifierType.ADD })
  type: ModifierType;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
