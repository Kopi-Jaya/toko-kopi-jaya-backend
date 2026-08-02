import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedeemService } from './redeem.service';
import { Reedem } from './entities/reedem.entity';
import { Member } from '../members/entities/member.entity';
import { PointsHistory } from '../members/entities/points-history.entity';
import { Outlet } from '../outlets/entities/outlet.entity';
import { MemberTier } from '../common/enums';

// Covers the M-242 tier-exclusive rewards feature: reward.min_tier is brand
// new (no prior test coverage existed for anything in this module — see
// GAP 15 in .planning/READY_REMAINING_gaps_and_fixes.md).

describe('RedeemService', () => {
  let service: RedeemService;
  let reedemRepository: { find: jest.Mock };
  let memberRepository: { findOne: jest.Mock };

  const buildMember = (tier: MemberTier, current_points = 1000): Member =>
    ({ member_id: 10, tier, current_points }) as Member;

  const buildReward = (overrides: Partial<Reedem> = {}): Reedem =>
    ({
      reedem_id: 1,
      product_id: 5,
      point_cost: 10,
      min_tier: null,
      is_active: true,
      stock_limit: null,
      redemption_count: 0,
      product: { product_id: 5, name: 'Test Reward', base_price: 20000 },
      ...overrides,
    }) as Reedem;

  beforeEach(async () => {
    reedemRepository = { find: jest.fn() };
    memberRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedeemService,
        { provide: getRepositoryToken(Reedem), useValue: reedemRepository },
        { provide: getRepositoryToken(Member), useValue: memberRepository },
        { provide: getRepositoryToken(PointsHistory), useValue: {} },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(RedeemService);
  });

  describe('findAll — is_eligible annotation', () => {
    it('marks a no-restriction reward eligible for every tier', async () => {
      memberRepository.findOne.mockResolvedValue(buildMember(MemberTier.BRONZE));
      reedemRepository.find.mockResolvedValue([buildReward({ min_tier: null })]);

      const [result] = await service.findAll(10);

      expect(result.is_eligible).toBe(true);
    });

    it('marks a Gold-exclusive reward ineligible for a Silver member', async () => {
      memberRepository.findOne.mockResolvedValue(buildMember(MemberTier.SILVER));
      reedemRepository.find.mockResolvedValue([buildReward({ min_tier: MemberTier.GOLD })]);

      const [result] = await service.findAll(10);

      expect(result.is_eligible).toBe(false);
    });

    it('marks a Gold-exclusive reward eligible for a Gold member', async () => {
      memberRepository.findOne.mockResolvedValue(buildMember(MemberTier.GOLD));
      reedemRepository.find.mockResolvedValue([buildReward({ min_tier: MemberTier.GOLD })]);

      const [result] = await service.findAll(10);

      expect(result.is_eligible).toBe(true);
    });

    it('marks a Gold-exclusive reward eligible for a Platinum member (rank above, not just equal)', async () => {
      memberRepository.findOne.mockResolvedValue(buildMember(MemberTier.PLATINUM));
      reedemRepository.find.mockResolvedValue([buildReward({ min_tier: MemberTier.GOLD })]);

      const [result] = await service.findAll(10);

      expect(result.is_eligible).toBe(true);
    });

    it('throws NotFoundException for an unknown member', async () => {
      memberRepository.findOne.mockResolvedValue(null);
      await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('redeemReward — tier-exclusive rejection', () => {
    it('rejects a below-tier redemption attempt before touching points or stock', async () => {
      const member = buildMember(MemberTier.SILVER, 1000);
      const reward = buildReward({ min_tier: MemberTier.GOLD, point_cost: 10, stock_limit: null });

      const manager = {
        findOne: jest.fn((entity) => {
          if (entity === Member) return Promise.resolve(member);
          if (entity === Reedem) return Promise.resolve(reward);
          return Promise.resolve(null);
        }),
        save: jest.fn(),
        update: jest.fn(),
        increment: jest.fn(),
        create: jest.fn(),
      };
      (service as any).dataSource.transaction = jest.fn((cb) => cb(manager));

      await expect(
        service.redeemReward(10, 1, { outlet_id: 1 } as any),
      ).rejects.toThrow(
        new BadRequestException('This reward requires Gold tier or above'),
      );

      // The rejection must happen before any mutation — no points deducted,
      // no order/points_history rows created.
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.increment).not.toHaveBeenCalled();
    });

    it('does not reject an at-or-above-tier redemption on tier grounds (fails later, on outlet lookup, once past the tier gate)', async () => {
      const member = buildMember(MemberTier.GOLD, 1000);
      const reward = buildReward({ min_tier: MemberTier.GOLD, point_cost: 10, stock_limit: null });

      const manager = {
        findOne: jest.fn((entity) => {
          if (entity === Member) return Promise.resolve(member);
          if (entity === Reedem) return Promise.resolve(reward);
          if (entity === Outlet) return Promise.resolve(null); // deliberately unmocked
          return Promise.resolve(null);
        }),
      };
      (service as any).dataSource.transaction = jest.fn((cb) => cb(manager));

      // Reaches the outlet-not-found error, proving the tier check passed
      // silently rather than rejecting on tier grounds.
      let caught: Error | undefined;
      try {
        await service.redeemReward(10, 1, { outlet_id: 999 } as any);
      } catch (e) {
        caught = e as Error;
      }
      expect(caught).toBeInstanceOf(NotFoundException);
      expect(caught?.message).not.toContain('requires Gold tier or above');
    });
  });
});
