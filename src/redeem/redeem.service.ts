import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reedem } from './entities/reedem.entity';
import { Member } from '../members/entities/member.entity';
import { PointsHistory } from '../members/entities/points-history.entity';
import { PointsTransactionType } from '../common/enums';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CreateRedeemDto } from './dto/create-redeem.dto';
import { UpdateRedeemDto } from './dto/update-redeem.dto';

@Injectable()
export class RedeemService {
  constructor(
    @InjectRepository(Reedem)
    private readonly reedemRepository: Repository<Reedem>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(PointsHistory)
    private readonly pointsHistoryRepository: Repository<PointsHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(memberId: number) {
    const member = await this.memberRepository.findOne({
      where: { member_id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    const rewards = await this.reedemRepository.find({
      where: { is_active: true },
      relations: ['product'],
    });

    return rewards.map((reward) => ({
      ...reward,
      is_affordable: member.current_points >= reward.point_cost,
    }));
  }

  async create(dto: CreateRedeemDto): Promise<Reedem> {
    const reward = this.reedemRepository.create({
      product_id: dto.product_id,
      point_cost: dto.point_cost,
      is_active: dto.is_active ?? true,
      stock_limit: dto.stock_limit ?? null,
    });
    return this.reedemRepository.save(reward);
  }

  async update(id: number, dto: UpdateRedeemDto): Promise<Reedem> {
    const reward = await this.reedemRepository.findOne({
      where: { reedem_id: id },
    });

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    Object.assign(reward, dto);
    return this.reedemRepository.save(reward);
  }

  async remove(id: number): Promise<void> {
    const reward = await this.reedemRepository.findOne({
      where: { reedem_id: id },
    });

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    await this.reedemRepository.remove(reward);
  }

  async redeemReward(memberId: number, reedemId: number, dto: RedeemRewardDto) {
    return this.dataSource.transaction(async (manager) => {
      // Lock the member row for the duration of the transaction
      const member = await manager.findOne(Member, {
        where: { member_id: memberId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!member) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      const reward = await manager.findOne(Reedem, {
        where: { reedem_id: reedemId, is_active: true },
        relations: ['product'],
      });

      if (!reward) {
        throw new NotFoundException(`Reward with ID ${reedemId} not found or is inactive`);
      }

      // Check stock limit
      if (
        reward.stock_limit !== null &&
        reward.redemption_count >= reward.stock_limit
      ) {
        throw new BadRequestException('This reward is out of stock');
      }

      // Check member has enough points
      if (member.current_points < reward.point_cost) {
        throw new BadRequestException(
          `Insufficient points. Required: ${reward.point_cost}, available: ${member.current_points}`,
        );
      }

      const balanceBefore = member.current_points;
      const balanceAfter = balanceBefore - reward.point_cost;

      // Deduct points from member
      await manager.update(Member, memberId, {
        current_points: balanceAfter,
      });

      // Increment redemption count on the reward
      await manager.increment(Reedem, { reedem_id: reedemId }, 'redemption_count', 1);

      // Record the points history
      const history = manager.create(PointsHistory, {
        member_id: memberId,
        order_id: null,
        points_change: -reward.point_cost,
        transaction_type: PointsTransactionType.REDEEMED,
        description: `Redeemed reward: ${reward.product?.name ?? `Reward #${reedemId}`}`,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        created_by: dto.staff_id ?? null,
      });

      await manager.save(PointsHistory, history);

      return {
        message: 'Reward redeemed successfully',
        data: {
          member_id: memberId,
          reward_id: reedemId,
          points_spent: reward.point_cost,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
        },
      };
    });
  }
}
