import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Outlet } from '../../outlets/entities/outlet.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  event_id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  outlet_id: number | null;

  @ManyToOne(() => Outlet, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'outlet_id' })
  outlet: Outlet | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  img_url: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tag: string | null;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
