import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Reedem } from './entities/reedem.entity';
import { Member } from '../members/entities/member.entity';
import { PointsHistory } from '../members/entities/points-history.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Outlet } from '../outlets/entities/outlet.entity';
import { Staff } from '../staff/entities/staff.entity';
import {
  MemberTier,
  PointsTransactionType,
  OrderStatus,
  OrderSource,
  OrderType,
  OutletStatus,
} from '../common/enums';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CreateRedeemDto } from './dto/create-redeem.dto';
import { UpdateRedeemDto } from './dto/update-redeem.dto';

// Same ordering as loyalty.service.ts's TIER_ORDER and the trigger's FIELD()
// rank comparison — kept as a local duplicate rather than a shared import
// because the two services have no existing dependency on each other; matches
// the project's established (if imperfect) convention for tier-rank tables.
const TIER_ORDER: MemberTier[] = [
  MemberTier.BRONZE,
  MemberTier.SILVER,
  MemberTier.GOLD,
  MemberTier.PLATINUM,
];

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
    private readonly configService: ConfigService,
  ) {}

  /// Same alphabet and length as OrdersService.generatePickupCode — a redeemed
  /// item is collected at the counter exactly like a purchased one, so it needs
  /// a code the barista can call out.
  private generatePickupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

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

    const memberRank = TIER_ORDER.indexOf(member.tier);

    return rewards.map((reward) => ({
      ...reward,
      is_affordable: member.current_points >= reward.point_cost,
      is_eligible: reward.min_tier == null || memberRank >= TIER_ORDER.indexOf(reward.min_tier),
    }));
  }

  async create(dto: CreateRedeemDto): Promise<Reedem> {
    const reward = this.reedemRepository.create({
      product_id: dto.product_id,
      point_cost: dto.point_cost,
      is_active: dto.is_active ?? true,
      stock_limit: dto.stock_limit ?? null,
      min_tier: dto.min_tier ?? null,
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

      // Check tier eligibility (tier-exclusive rewards)
      if (
        reward.min_tier != null &&
        TIER_ORDER.indexOf(member.tier) < TIER_ORDER.indexOf(reward.min_tier)
      ) {
        throw new BadRequestException(
          `This reward requires ${reward.min_tier} tier or above`,
        );
      }

      // Check member has enough points
      if (member.current_points < reward.point_cost) {
        throw new BadRequestException(
          `Insufficient points. Required: ${reward.point_cost}, available: ${member.current_points}`,
        );
      }

      if (!reward.product) {
        throw new NotFoundException(
          `Reward ${reedemId} points at product ${reward.product_id}, which no longer exists`,
        );
      }

      const balanceBefore = member.current_points;
      const balanceAfter = balanceBefore - reward.point_cost;

      // ─── M-192: create the Rp 0 fulfilment order ────────────────────────────
      //
      // Burning points is only half a redemption. Without an order the outlet
      // has nothing to act on: before this, redeeming produced a points_history
      // row and nothing else, so the barista never saw that a free Popcorn was
      // owed. The order is created already `paid` at Rp 0 — the member paid in
      // points, so there is no payment row and no amount to collect.
      //
      // Creating it as `paid` on INSERT (rather than inserting `pending` and
      // updating) is deliberate: `trg_credit_points_after_payment` is a BEFORE
      // UPDATE trigger, so an INSERT never fires it. That is what we want — a
      // redemption must not *earn* points back.
      const outletId = dto.outlet_id;
      if (!outletId) {
        throw new BadRequestException(
          'outlet_id is required — a redemption creates a collection order and must name the outlet fulfilling it',
        );
      }
      const outlet = await manager.findOne(Outlet, {
        where: { outlet_id: outletId },
      });
      if (!outlet) {
        throw new NotFoundException(`Outlet ${outletId} not found`);
      }
      if (outlet.status !== OutletStatus.ACTIVE) {
        throw new BadRequestException(
          `Outlet "${outlet.name}" is not currently active`,
        );
      }

      // `orders.staff_id` is NOT NULL. A member-initiated redemption has no
      // cashier, so it is attributed to the same mobile-app service account
      // OrdersService uses.
      const staffId =
        dto.staff_id ??
        parseInt(this.configService.get<string>('MOBILE_APP_STAFF_ID', '1'), 10);
      const staff = await manager.findOne(Staff, {
        where: { staff_id: staffId },
      });
      if (!staff) {
        throw new UnprocessableEntityException(
          `Staff ${staffId} not found. Pass staff_id or set MOBILE_APP_STAFF_ID to a valid staff_id.`,
        );
      }

      let pickupCode: string;
      for (;;) {
        pickupCode = this.generatePickupCode();
        const clash = await manager.findOne(Order, {
          where: { pickup_code: pickupCode },
        });
        if (!clash) break;
      }

      const order = await manager.save(
        Order,
        manager.create(Order, {
          member_id: memberId,
          customer_id: null,
          staff_id: staffId,
          outlet_id: outletId,
          source: OrderSource.MOBILE_APP,
          order_type: OrderType.CLICK_COLLECT,
          status: OrderStatus.PAID,
          pickup_code: pickupCode,
          subtotal: 0,
          discount_amount: 0,
          total_final: 0,
          points_earned: 0,
          paid_at: new Date(),
        }),
      );

      const orderItem = await manager.save(
        OrderItem,
        manager.create(OrderItem, {
          order_id: order.order_id,
          product_id: reward.product_id,
          quantity: 1,
          // Snapshot the catalog price for reporting even though Rp 0 is charged,
          // so v_product_performance still values the item that left the counter.
          price_at_purchase: Number(reward.product.base_price),
        }),
      );

      // `trg_set_earning_points_on_order_item` is a BEFORE INSERT trigger that
      // stamps points_earned_per_item from products.earning_points — it cannot
      // be bypassed at insert time. Zero it afterwards so a redeemed item is not
      // reported as having issued points. total_points_for_line is GENERATED and
      // recomputes to 0 on its own.
      await manager.update(OrderItem, orderItem.order_item_id, {
        points_earned_per_item: 0,
      });

      // Deduct points from member
      await manager.update(Member, memberId, {
        current_points: balanceAfter,
      });

      // Increment redemption count on the reward
      await manager.increment(Reedem, { reedem_id: reedemId }, 'redemption_count', 1);

      // Record the points history
      const history = manager.create(PointsHistory, {
        member_id: memberId,
        order_id: order.order_id,
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
          // The collection order the member shows at the counter.
          order_id: order.order_id,
          pickup_code: order.pickup_code,
          outlet_id: outletId,
          product_name: reward.product.name,
        },
      };
    });
  }
}
