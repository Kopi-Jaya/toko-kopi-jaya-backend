import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoyaltyService } from './loyalty.service';
import { Member } from '../members/entities/member.entity';
import { PointsHistory } from '../members/entities/points-history.entity';
import { Order } from '../orders/entities/order.entity';
import { MemberTier } from '../common/enums';

// Highest-value coverage per the M-200 audit / GAP 15 in
// .planning/READY_REMAINING_gaps_and_fixes.md: NFR-13 claims 80% unit-test
// coverage while actual coverage was ~0%. This is real logic that has driven
// real production defects this project (BUG-2026-003's three disagreeing
// tier tables) and the M-242 tier-multiplier feature, so it is exactly the
// "order pricing and the loyalty trigger" area the gap analysis names.

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let memberRepository: { findOne: jest.Mock };
  let orderQueryBuilder: {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getRawOne: jest.Mock;
  };

  const buildMember = (overrides: Partial<Member> = {}): Member =>
    ({
      member_id: 1,
      name: 'Test Member',
      current_points: 0,
      lifetime_points_earned: 0,
      tier: MemberTier.BRONZE,
      ...overrides,
    }) as Member;

  beforeEach(async () => {
    memberRepository = { findOne: jest.fn() };

    orderQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total_orders: '0', total_spent: '0' }),
    };

    const orderRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(orderQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: getRepositoryToken(Member), useValue: memberRepository },
        { provide: getRepositoryToken(PointsHistory), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get(LoyaltyService);
  });

  describe('getMemberLoyalty — tier_progress', () => {
    it('throws NotFoundException when the member does not exist', async () => {
      memberRepository.findOne.mockResolvedValue(null);
      await expect(service.getMemberLoyalty(999)).rejects.toThrow(NotFoundException);
    });

    it('computes partial progress for a Bronze member below the Silver threshold', async () => {
      // Threshold table (must match trg_credit_points_after_payment):
      // Bronze 0 / Silver 200 / Gold 1000 / Platinum 5000.
      memberRepository.findOne.mockResolvedValue(
        buildMember({ tier: MemberTier.BRONZE, lifetime_points_earned: 100 }),
      );

      const result = await service.getMemberLoyalty(1);

      expect(result.tier_progress).toEqual({
        current_tier: MemberTier.BRONZE,
        current_threshold: 0,
        next_tier: MemberTier.SILVER,
        next_threshold: 200,
        progress_percent: 50, // 100 / (200 - 0) = 50%
      });
    });

    it('computes progress for a Silver member partway to Gold', async () => {
      memberRepository.findOne.mockResolvedValue(
        buildMember({ tier: MemberTier.SILVER, lifetime_points_earned: 600 }),
      );

      const result = await service.getMemberLoyalty(1);

      // (600 - 200) / (1000 - 200) = 50%
      expect(result.tier_progress.progress_percent).toBe(50);
      expect(result.tier_progress.next_tier).toBe(MemberTier.GOLD);
      expect(result.tier_progress.next_threshold).toBe(1000);
    });

    it('clamps progress at 100% instead of overshooting when lifetime points already exceed the next threshold', async () => {
      // A member can transiently sit on a lower tier than their lifetime total
      // would justify (e.g. between an admin points-adjust and the tier
      // recalculation) — the progress bar must never read over 100% in that
      // window. 5500 lifetime on Gold (next threshold Platinum @ 5000) would
      // be (5500-1000)/(5000-1000) = 112.5% without the clamp.
      memberRepository.findOne.mockResolvedValue(
        buildMember({ tier: MemberTier.GOLD, lifetime_points_earned: 5500 }),
      );

      const result = await service.getMemberLoyalty(1);

      expect(result.tier_progress.progress_percent).toBe(100);
    });

    it('reports 100% progress and no next tier for a Platinum member', async () => {
      memberRepository.findOne.mockResolvedValue(
        buildMember({ tier: MemberTier.PLATINUM, lifetime_points_earned: 6000 }),
      );

      const result = await service.getMemberLoyalty(1);

      expect(result.tier_progress.next_tier).toBeNull();
      expect(result.tier_progress.next_threshold).toBeNull();
      expect(result.tier_progress.progress_percent).toBe(100);
    });
  });

  describe('getMemberLoyalty — tier_multiplier (M-242)', () => {
    // Must match the CASE in trg_credit_points_after_payment
    // (backend/database/migrations/2026-08-01_tier_point_multiplier.sql).
    it.each([
      [MemberTier.BRONZE, 1.0],
      [MemberTier.SILVER, 1.1],
      [MemberTier.GOLD, 1.25],
      [MemberTier.PLATINUM, 1.5],
    ])('exposes the %s multiplier as %s', async (tier, expectedMultiplier) => {
      memberRepository.findOne.mockResolvedValue(
        buildMember({ tier, lifetime_points_earned: 0 }),
      );

      const result = await service.getMemberLoyalty(1);

      expect(result.tier_multiplier).toBe(expectedMultiplier);
    });
  });
});
