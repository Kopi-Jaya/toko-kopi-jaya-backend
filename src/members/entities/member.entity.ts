import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { MemberTier } from '../../common/enums';
import { Order } from '../../orders/entities/order.entity';
import { PointsHistory } from './points-history.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';

@Entity('member')
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  member_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string | null;

  @Column({ type: 'date', nullable: true })
  birthday: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fav_menu: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  current_points: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  lifetime_points_earned: number;

  @Column({ type: 'enum', enum: MemberTier, default: MemberTier.BRONZE })
  tier: MemberTier;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Order, (order) => order.member)
  orders: Order[];

  @OneToMany(() => PointsHistory, (ph) => ph.member)
  points_history: PointsHistory[];

  @OneToMany(() => Favorite, (fav) => fav.member)
  favorites: Favorite[];
}
