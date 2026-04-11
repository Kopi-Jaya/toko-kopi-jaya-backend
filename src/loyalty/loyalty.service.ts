import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Member } from '../members/entities/member.entity';
import { PointsHistory } from '../members/entities/points-history.entity';
import { Order } from '../orders/entities/order.entity';
import { QueryPointsHistoryDto } from '../members/dto/query-points-history.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { MemberTier, PointsTransactionType } from '../common/enums';

const TIER_THRESHOLDS: Record<MemberTier, number> = {
  [MemberTier.BRONZE]: 0,
  [MemberTier.SILVER]: 200,
  [MemberTier.GOLD]: 1000,
  [MemberTier.PLATINUM]: 5000,
};

const TIER_ORDER: MemberTier[] = [
  MemberTier.BRONZE,
  MemberTier.SILVER,
  MemberTier.GOLD,
  MemberTier.PLATINUM,
];

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(PointsHistory)
    private readonly pointsHistoryRepository: Repository<PointsHistory>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async getMySummary(user: any) {
    const memberId = user.sub;
    return this.getMemberLoyalty(memberId);
  }

  async getMemberLoyalty(memberId: number) {
    const member = await this.memberRepository.findOne({
      where: { member_id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    // Aggregate order stats
    const orderStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.order_id)', 'total_orders')
      .addSelect('COALESCE(SUM(order.total_final), 0)', 'total_spent')
      .where('order.member_id = :memberId', { memberId })
      .andWhere('order.status != :cancelled', { cancelled: 'cancelled' })
      .getRawOne();

    // Calculate tier progress
    const lifetimePoints = member.lifetime_points_earned;
    const currentTierIndex = TIER_ORDER.indexOf(member.tier);
    const currentThreshold = TIER_THRESHOLDS[member.tier];

    let nextTier: MemberTier | null = null;
    let nextThreshold: number | null = null;
    let progressPercent = 100;

    if (currentTierIndex < TIER_ORDER.length - 1) {
      nextTier = TIER_ORDER[currentTierIndex + 1];
      nextThreshold = TIER_THRESHOLDS[nextTier];
      const range = nextThreshold - currentThreshold;
      const progress = lifetimePoints - currentThreshold;
      progressPercent = Math.min(Math.round((progress / range) * 100), 100);
    }

    return {
      member_id: member.member_id,
      name: member.name,
      current_points: member.current_points,
      lifetime_points_earned: member.lifetime_points_earned,
      tier: member.tier,
      total_orders: parseInt(orderStats.total_orders, 10),
      total_spent: parseFloat(orderStats.total_spent),
      tier_progress: {
        current_tier: member.tier,
        current_threshold: currentThreshold,
        next_tier: nextTier,
        next_threshold: nextThreshold,
        progress_percent: progressPercent,
      },
    };
  }

  async getMyPointsHistory(user: any, query: QueryPointsHistoryDto) {
    const memberId = user.sub;
    return this.getPointsHistory(memberId, query);
  }

  async getPointsHistory(memberId: number, query: QueryPointsHistoryDto) {
    const { page = 1, limit = 20, transaction_type, date_from, date_to } = query;
    const skip = (page - 1) * limit;

    const qb = this.pointsHistoryRepository
      .createQueryBuilder('ph')
      .leftJoinAndSelect('ph.order', 'order')
      .where('ph.member_id = :memberId', { memberId });

    if (transaction_type) {
      qb.andWhere('ph.transaction_type = :transaction_type', { transaction_type });
    }
    if (date_from) {
      qb.andWhere('ph.created_at >= :date_from', { date_from });
    }
    if (date_to) {
      qb.andWhere('ph.created_at <= :date_to', { date_to });
    }

    qb.orderBy('ph.created_at', 'DESC').skip(skip).take(limit);

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

  async adjustPoints(dto: AdjustPointsDto, staffId: number) {
    return this.dataSource.transaction(async (manager) => {
      const member = await manager.findOne(Member, {
        where: { member_id: dto.member_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!member) {
        throw new NotFoundException(`Member with ID ${dto.member_id} not found`);
      }

      const balanceBefore = member.current_points;
      const balanceAfter = balanceBefore + dto.points_change;

      // Update current points
      await manager.update(Member, dto.member_id, {
        current_points: balanceAfter,
      });

      // If positive adjustment, also update lifetime earned
      if (dto.points_change > 0) {
        await manager.increment(
          Member,
          { member_id: dto.member_id },
          'lifetime_points_earned',
          dto.points_change,
        );
      }

      // Create points history entry
      const history = manager.create(PointsHistory, {
        member_id: dto.member_id,
        order_id: null,
        points_change: dto.points_change,
        transaction_type: PointsTransactionType.ADJUSTED,
        description: dto.description,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        created_by: staffId,
      });

      await manager.save(PointsHistory, history);

      // Recalculate tier if lifetime points changed
      if (dto.points_change > 0) {
        const updatedMember = await manager.findOne(Member, {
          where: { member_id: dto.member_id },
        });

        if (updatedMember) {
          const newTier = this.calculateTier(updatedMember.lifetime_points_earned);
          if (newTier !== updatedMember.tier) {
            await manager.update(Member, dto.member_id, { tier: newTier });
          }
        }
      }

      return {
        message: 'Points adjusted successfully',
        data: {
          member_id: dto.member_id,
          points_change: dto.points_change,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: dto.description,
        },
      };
    });
  }

  private calculateTier(lifetimePoints: number): MemberTier {
    if (lifetimePoints >= TIER_THRESHOLDS[MemberTier.PLATINUM]) {
      return MemberTier.PLATINUM;
    }
    if (lifetimePoints >= TIER_THRESHOLDS[MemberTier.GOLD]) {
      return MemberTier.GOLD;
    }
    if (lifetimePoints >= TIER_THRESHOLDS[MemberTier.SILVER]) {
      return MemberTier.SILVER;
    }
    return MemberTier.BRONZE;
  }
}
