import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { Member } from './entities/member.entity';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdminUpdateMemberDto } from './dto/admin-update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async findMe(memberId: number): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { member_id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    return member;
  }

  async updateMe(memberId: number, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findMe(memberId);
    Object.assign(member, dto);
    return this.memberRepository.save(member);
  }

  async adminUpdate(id: number, dto: AdminUpdateMemberDto): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { member_id: id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    Object.assign(member, dto);
    return this.memberRepository.save(member);
  }

  async findAll(query: QueryMemberDto) {
    const { page = 1, limit = 20, search, tier } = query;
    const skip = (page - 1) * limit;

    const qb = this.memberRepository.createQueryBuilder('member');

    if (search) {
      qb.andWhere(
        '(member.name LIKE :search OR member.email LIKE :search OR member.phone_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tier) {
      qb.andWhere('member.tier = :tier', { tier });
    }

    qb.orderBy('member.created_at', 'DESC').skip(skip).take(limit);

    const [data, total_items] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total_items,
        total_pages: Math.ceil(total_items / limit),
      },
    };
  }

  async findOne(id: number) {
    const member = await this.memberRepository
      .createQueryBuilder('member')
      .loadRelationCountAndMap('member.order_count', 'member.orders')
      .where('member.member_id = :id', { id })
      .getOne();

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    // instanceToPlain honors @Exclude() on Member.password; without it,
    // the spread below would copy `password` as a plain key and the
    // global ClassSerializerInterceptor can't recover (M-002 / DEFECT-002).
    return {
      ...instanceToPlain(member),
      points_summary: {
        current_points: member.current_points,
        lifetime_points_earned: member.lifetime_points_earned,
        tier: member.tier,
      },
    };
  }
}
