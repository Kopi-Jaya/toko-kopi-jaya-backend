import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('favorite')
@Unique(['member_id', 'product_id'])
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  favorite_id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'staff_id' })
  member_id: number;

  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Member, (member) => member.favorites)
  @JoinColumn({ name: 'staff_id' })
  member: Member;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
