import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { Product } from '../products/entities/product.entity';
import { Modifier } from '../modifiers/entities/modifier.entity';
import { Outlet } from '../outlets/entities/outlet.entity';
import { OutletProduct } from '../outlets/entities/outlet-product.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { Tax } from '../tax/entities/tax.entity';
import { ServiceCharge } from '../service-charge/entities/service-charge.entity';
import { Member } from '../members/entities/member.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Staff } from '../staff/entities/staff.entity';
import { OrdersGateway } from './orders.gateway';
import { ChargeType, OrderStatus, OutletStatus } from '../common/enums';

// Covers the other half of GAP 15's recommendation
// (.planning/READY_REMAINING_gaps_and_fixes.md): "order pricing and the
// loyalty trigger" as the two highest-value untested areas. This exercises
// the pricing pipeline in OrdersService.create() (subtotal, discount, tax,
// service charge, total_final) via a fake QueryRunner, and the order status
// state machine in updateStatus() — both previously at 0% coverage.

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: { findOne: jest.Mock; update: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let manager: {
    findOne: jest.Mock;
    find: jest.Mock;
    findByIds: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    increment: jest.Mock;
  };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: typeof manager;
  };

  const activeOutlet = { outlet_id: 1, name: 'Toko Kopi Jaya - Sukun', status: OutletStatus.ACTIVE };

  const buildMenuRow = (productId: number, basePrice: number, priceOverride: number | null = null) => ({
    product_id: productId,
    price_override: priceOverride,
    is_available: true,
    product: { product_id: productId, name: `Product ${productId}`, base_price: basePrice, is_available: true },
  });

  beforeEach(async () => {
    orderRepository = {
      findOne: jest.fn().mockResolvedValue({ order_id: 100 }), // final this.findOne() after commit
      update: jest.fn(),
    };

    manager = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
      create: jest.fn((_entity, data) => data),
      save: jest.fn((entity, data) => {
        if (entity === Order) return Promise.resolve({ ...data, order_id: 100 });
        if (entity === OrderItem) return Promise.resolve({ ...data, order_item_id: 1 });
        return Promise.resolve(data);
      }),
      increment: jest.fn(),
    };

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager,
    };

    dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Modifier), useValue: {} },
        { provide: getRepositoryToken(Outlet), useValue: {} },
        { provide: getRepositoryToken(Discount), useValue: {} },
        { provide: getRepositoryToken(Tax), useValue: {} },
        { provide: getRepositoryToken(ServiceCharge), useValue: {} },
        { provide: getRepositoryToken(Member), useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('1') } },
        { provide: OrdersGateway, useValue: { emitOrderUpdated: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  /// Wires the manager.findOne switch-by-entity mock used by every create()
  /// test: outlet, the pickup-code-uniqueness check on Order, and the
  /// member-checkout service-staff lookup are common to all scenarios.
  function mockCommonLookups(overrides: {
    tax?: any;
    serviceCharge?: any;
    discount?: any;
  } = {}) {
    manager.findOne.mockImplementation((entity: any, opts: any) => {
      if (entity === Outlet) return Promise.resolve(activeOutlet);
      if (entity === Order) return Promise.resolve(null); // pickup code is unique
      if (entity === Staff) return Promise.resolve({ staff_id: 1 });
      if (entity === Tax) return Promise.resolve(overrides.tax ?? null);
      if (entity === ServiceCharge) return Promise.resolve(overrides.serviceCharge ?? null);
      if (entity === Discount) return Promise.resolve(overrides.discount ?? null);
      return Promise.resolve(null);
    });
  }

  const memberUser = { type: 'member' as const, sub: 10 };

  function getSavedOrder() {
    const orderCall = manager.save.mock.calls.find(([entity]) => entity === Order);
    return orderCall?.[1];
  }

  describe('create — pricing pipeline', () => {
    it('rejects an inactive outlet before pricing anything', async () => {
      manager.findOne.mockImplementation((entity: any) => {
        if (entity === Outlet) return Promise.resolve({ ...activeOutlet, status: OutletStatus.INACTIVE });
        return Promise.resolve(null);
      });

      await expect(
        service.create(
          { outlet_id: 1, order_type: 'dine-in' as any, items: [{ product_id: 2, quantity: 1 }] } as any,
          memberUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a product not on the outlet menu (the exact M-194 defect class)', async () => {
      mockCommonLookups();
      manager.find.mockResolvedValue([]); // menu is empty — product 2 not carried by this outlet

      await expect(
        service.create(
          { outlet_id: 1, order_type: 'dine-in' as any, items: [{ product_id: 2, quantity: 1 }] } as any,
          memberUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes subtotal from the outlet price_override, not the catalog base_price (M-194)', async () => {
      mockCommonLookups();
      manager.find.mockResolvedValue([buildMenuRow(2, 25000, 28000)]); // outlet charges 28000, catalog says 25000

      await service.create(
        { outlet_id: 1, order_type: 'dine-in' as any, items: [{ product_id: 2, quantity: 1 }] } as any,
        memberUser,
      );

      expect(getSavedOrder().subtotal).toBe(28000);
    });

    it('applies a percentage service charge on top of subtotal (M-247 / GAP 14 scenario: 5%)', async () => {
      mockCommonLookups({ serviceCharge: { service_charge_id: 1, type: ChargeType.PERCENTAGE, value: 5 } });
      manager.find.mockResolvedValue([buildMenuRow(2, 25000)]);

      await service.create(
        {
          outlet_id: 1, order_type: 'dine-in' as any, service_charge_id: 1,
          items: [{ product_id: 2, quantity: 1 }],
        } as any,
        memberUser,
      );

      const saved = getSavedOrder();
      expect(saved.subtotal).toBe(25000);
      expect(saved.total_final).toBe(26250); // exactly what order 59 proved live in production
    });

    it('applies a percentage discount capped by max_discount', async () => {
      mockCommonLookups({
        discount: {
          discount_id: 1, code: 'BESAR20', is_active: true, valid_from: null, valid_until: null,
          usage_limit: null, usage_count: 0, min_purchase: 0,
          type: ChargeType.PERCENTAGE, value: 20, max_discount: 3000,
        },
      });
      manager.find.mockResolvedValue([buildMenuRow(2, 100000)]); // 20% of 100000 = 20000, capped to 3000

      await service.create(
        {
          outlet_id: 1, order_type: 'dine-in' as any, discount_code: 'BESAR20',
          items: [{ product_id: 2, quantity: 1 }],
        } as any,
        memberUser,
      );

      const saved = getSavedOrder();
      expect(saved.discount_amount).toBe(3000);
      expect(saved.total_final).toBe(97000);
    });

    it('rejects a discount code below its minimum purchase threshold', async () => {
      mockCommonLookups({
        discount: {
          discount_id: 1, code: 'MIN50K', is_active: true, valid_from: null, valid_until: null,
          usage_limit: null, usage_count: 0, min_purchase: 50000,
          type: ChargeType.NOMINAL, value: 10000, max_discount: null,
        },
      });
      manager.find.mockResolvedValue([buildMenuRow(2, 25000)]); // below the 50000 minimum

      await expect(
        service.create(
          {
            outlet_id: 1, order_type: 'dine-in' as any, discount_code: 'MIN50K',
            items: [{ product_id: 2, quantity: 1 }],
          } as any,
          memberUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired discount code', async () => {
      mockCommonLookups({
        discount: {
          discount_id: 1, code: 'EXPIRED', is_active: true,
          valid_from: null, valid_until: new Date('2020-01-01'),
          usage_limit: null, usage_count: 0, min_purchase: 0,
          type: ChargeType.NOMINAL, value: 5000, max_discount: null,
        },
      });
      manager.find.mockResolvedValue([buildMenuRow(2, 25000)]);

      await expect(
        service.create(
          {
            outlet_id: 1, order_type: 'dine-in' as any, discount_code: 'EXPIRED',
            items: [{ product_id: 2, quantity: 1 }],
          } as any,
          memberUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('combines discount, tax, and service charge in the correct order (subtotal - discount + tax + service charge)', async () => {
      mockCommonLookups({
        discount: {
          discount_id: 1, code: 'FLAT10K', is_active: true, valid_from: null, valid_until: null,
          usage_limit: null, usage_count: 0, min_purchase: 0,
          type: ChargeType.NOMINAL, value: 10000, max_discount: null,
        },
        tax: { tax_id: 1, type: ChargeType.PERCENTAGE, value: 10 },
        serviceCharge: { service_charge_id: 1, type: ChargeType.PERCENTAGE, value: 5 },
      });
      manager.find.mockResolvedValue([buildMenuRow(2, 100000)]);

      await service.create(
        {
          outlet_id: 1, order_type: 'dine-in' as any, discount_code: 'FLAT10K',
          tax_id: 1, service_charge_id: 1,
          items: [{ product_id: 2, quantity: 1 }],
        } as any,
        memberUser,
      );

      const saved = getSavedOrder();
      // subtotal 100000, discount 10000 -> 90000 taxable base
      // tax = 90000 * 10% = 9000; service charge = 100000 * 5% = 5000 (off subtotal, not the discounted base)
      // total = 100000 - 10000 + 9000 + 5000 = 104000
      expect(saved.subtotal).toBe(100000);
      expect(saved.discount_amount).toBe(10000);
      expect(saved.total_final).toBe(104000);
    });
  });

  describe('updateStatus — order state machine', () => {
    const orderAt = (status: OrderStatus) => ({ order_id: 1, status });

    it('allows pending -> paid', async () => {
      orderRepository.findOne.mockResolvedValue(orderAt(OrderStatus.PENDING));
      await service.updateStatus(1, { status: OrderStatus.PAID } as any, {});
      expect(orderRepository.update).toHaveBeenCalledWith(
        { order_id: 1 },
        expect.objectContaining({ status: OrderStatus.PAID }),
      );
    });

    it('allows the full forward path paid -> preparing -> ready_for_pickup -> completed', async () => {
      const transitions: [OrderStatus, OrderStatus][] = [
        [OrderStatus.PAID, OrderStatus.PREPARING],
        [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
        [OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED],
      ];
      for (const [from, to] of transitions) {
        orderRepository.findOne.mockResolvedValue(orderAt(from));
        await expect(service.updateStatus(1, { status: to } as any, {})).resolves.toBeDefined();
      }
    });

    it('rejects skipping straight from pending to preparing', async () => {
      orderRepository.findOne.mockResolvedValue(orderAt(OrderStatus.PENDING));
      await expect(
        service.updateStatus(1, { status: OrderStatus.PREPARING } as any, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition out of a completed order', async () => {
      orderRepository.findOne.mockResolvedValue(orderAt(OrderStatus.COMPLETED));
      await expect(
        service.updateStatus(1, { status: OrderStatus.CANCELLED } as any, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reviving a cancelled order', async () => {
      orderRepository.findOne.mockResolvedValue(orderAt(OrderStatus.CANCELLED));
      await expect(
        service.updateStatus(1, { status: OrderStatus.PAID } as any, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for an order that does not exist', async () => {
      orderRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus(999, { status: OrderStatus.PAID } as any, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
