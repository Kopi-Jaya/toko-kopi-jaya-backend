import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { Product } from '../products/entities/product.entity';
import { Modifier } from '../modifiers/entities/modifier.entity';
import { Outlet } from '../outlets/entities/outlet.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { Tax } from '../tax/entities/tax.entity';
import { ServiceCharge } from '../service-charge/entities/service-charge.entity';
import { Member } from '../members/entities/member.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Staff } from '../staff/entities/staff.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  OrderStatus,
  OrderSource,
  OutletStatus,
  ChargeType,
} from '../common/enums';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Modifier)
    private readonly modifierRepository: Repository<Modifier>,
    @InjectRepository(Outlet)
    private readonly outletRepository: Repository<Outlet>,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(ServiceCharge)
    private readonly serviceChargeRepository: Repository<ServiceCharge>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateOrderDto, user: any): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate outlet
      const outlet = await queryRunner.manager.findOne(Outlet, {
        where: { outlet_id: dto.outlet_id },
      });
      if (!outlet) {
        throw new NotFoundException(
          `Outlet with ID ${dto.outlet_id} not found`,
        );
      }
      if (outlet.status !== OutletStatus.ACTIVE) {
        throw new BadRequestException(
          `Outlet "${outlet.name}" is not currently active`,
        );
      }

      // 2. Validate and load all products
      const productIds = dto.items.map((item) => item.product_id);
      const products = await queryRunner.manager.findByIds(Product, productIds);
      const productMap = new Map(
        products.map((p) => [Number(p.product_id), p]),
      );

      for (const item of dto.items) {
        const product = productMap.get(Number(item.product_id));
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.product_id} not found`,
          );
        }
        if (!product.is_available) {
          throw new BadRequestException(
            `Product "${product.name}" is not available`,
          );
        }
      }

      // 3. Validate and load all modifiers
      const allModifierIds = dto.items.flatMap(
        (item) => item.modifiers?.map((m) => m.modifier_id) ?? [],
      );
      const modifierMap = new Map<number, Modifier>();

      if (allModifierIds.length > 0) {
        const uniqueModifierIds = [...new Set(allModifierIds)];
        const modifiers = await queryRunner.manager.findByIds(
          Modifier,
          uniqueModifierIds,
        );
        for (const mod of modifiers) {
          modifierMap.set(Number(mod.modifier_id), mod);
        }
        for (const modId of uniqueModifierIds) {
          if (!modifierMap.has(Number(modId))) {
            throw new NotFoundException(`Modifier with ID ${modId} not found`);
          }
        }
      }

      // 4. Calculate subtotal
      let subtotal = 0;
      for (const item of dto.items) {
        const product = productMap.get(Number(item.product_id))!;
        let itemTotal = Number(product.base_price) * item.quantity;

        if (item.modifiers) {
          for (const mod of item.modifiers) {
            const modifier = modifierMap.get(Number(mod.modifier_id))!;
            itemTotal += Number(modifier.extra_price) * item.quantity;
          }
        }

        subtotal += itemTotal;
      }

      // 5. Validate and calculate discount
      let discountAmount = 0;
      let discountId: number | null = null;
      let discountEntity: Discount | null = null;

      if (dto.discount_code) {
        discountEntity = await queryRunner.manager.findOne(Discount, {
          where: { code: dto.discount_code },
        });

        if (!discountEntity) {
          throw new NotFoundException(
            `Discount code "${dto.discount_code}" not found`,
          );
        }
        if (!discountEntity.is_active) {
          throw new BadRequestException('Discount code is no longer active');
        }

        const now = new Date();
        if (
          discountEntity.valid_from &&
          new Date(discountEntity.valid_from) > now
        ) {
          throw new BadRequestException('Discount code is not yet valid');
        }
        if (
          discountEntity.valid_until &&
          new Date(discountEntity.valid_until) < now
        ) {
          throw new BadRequestException('Discount code has expired');
        }
        if (
          discountEntity.usage_limit !== null &&
          discountEntity.usage_count >= discountEntity.usage_limit
        ) {
          throw new BadRequestException('Discount code usage limit reached');
        }
        if (subtotal < Number(discountEntity.min_purchase)) {
          throw new BadRequestException(
            `Minimum purchase of ${discountEntity.min_purchase} is required for this discount`,
          );
        }

        if (discountEntity.type === ChargeType.PERCENTAGE) {
          discountAmount = subtotal * (Number(discountEntity.value) / 100);
          if (discountEntity.max_discount !== null) {
            discountAmount = Math.min(
              discountAmount,
              Number(discountEntity.max_discount),
            );
          }
        } else {
          discountAmount = Number(discountEntity.value);
        }

        discountAmount = Math.round(discountAmount * 100) / 100;
        discountId = discountEntity.discount_id;
      }

      // 6. Calculate tax
      let taxAmount = 0;
      if (dto.tax_id) {
        const tax = await queryRunner.manager.findOne(Tax, {
          where: { tax_id: dto.tax_id },
        });
        if (!tax) {
          throw new NotFoundException(`Tax with ID ${dto.tax_id} not found`);
        }
        if (tax.type === ChargeType.PERCENTAGE) {
          taxAmount = (subtotal - discountAmount) * (Number(tax.value) / 100);
        } else {
          taxAmount = Number(tax.value);
        }
        taxAmount = Math.round(taxAmount * 100) / 100;
      }

      // 7. Calculate service charge
      let serviceChargeAmount = 0;
      if (dto.service_charge_id) {
        const sc = await queryRunner.manager.findOne(ServiceCharge, {
          where: { service_charge_id: dto.service_charge_id },
        });
        if (!sc) {
          throw new NotFoundException(
            `Service charge with ID ${dto.service_charge_id} not found`,
          );
        }
        if (sc.type === ChargeType.PERCENTAGE) {
          serviceChargeAmount = subtotal * (Number(sc.value) / 100);
        } else {
          serviceChargeAmount = Number(sc.value);
        }
        serviceChargeAmount = Math.round(serviceChargeAmount * 100) / 100;
      }

      // 8. Calculate total
      const totalFinal =
        Math.round(
          (subtotal - discountAmount + taxAmount + serviceChargeAmount) * 100,
        ) / 100;

      // 9. Generate unique pickup code
      let pickupCode: string;
      let isUnique = false;
      do {
        pickupCode = this.generatePickupCode();
        const existing = await queryRunner.manager.findOne(Order, {
          where: { pickup_code: pickupCode },
        });
        isUnique = !existing;
      } while (!isUnique);

      // 10. Determine staff_id / member_id / customer_id.
      //
      // The schema requires:
      //   - staff_id NOT NULL  (every order has an attributable cashier/agent)
      //   - exactly ONE of (member_id, customer_id) set (CHECK constraint)
      //
      // Without this resolver, member-placed mobile orders crashed with
      // "Column 'staff_id' cannot be null" (M-013 / DEFECT-001) and
      // staff walk-ins crashed the CHECK constraint when both ids were null.
      const { memberId, customerId, staffId } = await this.resolveOrderActors(
        dto,
        user,
        queryRunner.manager,
      );

      // 11. Create order
      const order = queryRunner.manager.create(Order, {
        member_id: memberId,
        customer_id: customerId,
        staff_id: staffId,
        outlet_id: dto.outlet_id,
        source: dto.source ?? OrderSource.POS_IN_STORE,
        order_type: dto.order_type,
        table_number: dto.table_number ?? null,
        status: OrderStatus.PENDING,
        pickup_code: pickupCode,
        subtotal,
        tax_id: dto.tax_id ?? null,
        service_charge_id: dto.service_charge_id ?? null,
        discount_id: discountId,
        discount_amount: discountAmount,
        total_final: totalFinal,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // 12. Create order items
      for (const item of dto.items) {
        const product = productMap.get(Number(item.product_id))!;
        const priceAtPurchase = Number(product.base_price);

        const orderItem = queryRunner.manager.create(OrderItem, {
          order_id: savedOrder.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: priceAtPurchase,
        });

        const savedItem = await queryRunner.manager.save(OrderItem, orderItem);

        // 13. Create order item modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            const modifier = modifierMap.get(Number(mod.modifier_id))!;
            const oim = queryRunner.manager.create(OrderItemModifier, {
              order_item_id: savedItem.order_item_id,
              modifier_id: mod.modifier_id,
              price_added: Number(modifier.extra_price),
            });
            await queryRunner.manager.save(OrderItemModifier, oim);
          }
        }
      }

      // 14. Increment discount usage
      if (discountEntity) {
        await queryRunner.manager.increment(
          Discount,
          { discount_id: discountEntity.discount_id },
          'usage_count',
          1,
        );
      }

      await queryRunner.commitTransaction();

      // 15. Return full order with relations
      return this.findOne(savedOrder.order_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByMember(memberId: number, query: QueryOrderDto) {
    const { page = 1, limit = 20, status, date_from, date_to } = query;
    const skip = (page - 1) * limit;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.outlet', 'outlet')
      .where('order.member_id = :memberId', { memberId });

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }
    if (date_from) {
      qb.andWhere('order.created_at >= :date_from', { date_from });
    }
    if (date_to) {
      qb.andWhere('order.created_at <= :date_to', { date_to });
    }

    qb.orderBy('order.created_at', 'DESC').skip(skip).take(limit);

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

  async findAllAdmin(query: QueryOrderDto) {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      order_type,
      date_from,
      date_to,
      pickup_code,
      outlet_id,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.outlet', 'outlet')
      .leftJoinAndSelect('order.staff', 'staff')
      .leftJoinAndSelect('order.member', 'member')
      .leftJoinAndSelect('order.customer', 'customer');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }
    if (source) {
      qb.andWhere('order.source = :source', { source });
    }
    if (order_type) {
      qb.andWhere('order.order_type = :order_type', { order_type });
    }
    if (outlet_id !== undefined) {
      qb.andWhere('order.outlet_id = :outlet_id', { outlet_id });
    }
    if (date_from) {
      qb.andWhere('order.created_at >= :date_from', { date_from });
    }
    if (date_to) {
      qb.andWhere('order.created_at <= :date_to', { date_to });
    }
    if (pickup_code) {
      qb.andWhere('order.pickup_code = :pickup_code', { pickup_code });
    }

    qb.orderBy('order.created_at', 'DESC').skip(skip).take(limit);

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

  async findByPickupCode(pickupCode: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { pickup_code: pickupCode },
      relations: [
        'order_items',
        'order_items.product',
        'order_items.modifiers',
        'order_items.modifiers.modifier',
        'payment',
        'member',
        'customer',
        'outlet',
      ],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with pickup code "${pickupCode}" not found`,
      );
    }

    return order;
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: id },
      relations: [
        'order_items',
        'order_items.product',
        'order_items.modifiers',
        'order_items.modifiers.modifier',
        'payment',
        'member',
        'customer',
        'staff',
        'outlet',
        'tax',
        'service_charge',
        'discount',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    user: any,
  ): Promise<Order> {
    const order = await this.findOne(id);

    const allowedTransitions = STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions || !allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from "${order.status}" to "${dto.status}"`,
      );
    }

    const now = new Date();
    const fields: Partial<Order> = { status: dto.status };

    switch (dto.status) {
      case OrderStatus.PAID:
        fields.paid_at = now;
        break;
      case OrderStatus.READY_FOR_PICKUP:
        fields.ready_at = now;
        break;
      case OrderStatus.COMPLETED:
        fields.completed_at = now;
        break;
    }

    // Use a targeted UPDATE (by primary key only) to avoid loading relations into
    // the UPDATE statement, which would re-fire the DB AFTER UPDATE trigger on
    // 'orders' and cause the "Can't update table in stored function/trigger" error.
    await this.orderRepository.update({ order_id: id }, fields);
    return this.findOne(id);
  }

  private generatePickupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Resolves the (member_id, customer_id, staff_id) tuple for a new order
   * given the JWT and the request DTO, satisfying both the staff_id NOT NULL
   * column and the CHECK(member_id XOR customer_id) constraint.
   *
   * Mobile-app member orders are attributed to a configurable service-account
   * staff (env: MOBILE_APP_STAFF_ID, default 1). Staff walk-ins either reuse
   * an existing customer (matched by phone) or create a new one.
   */
  private async resolveOrderActors(
    dto: CreateOrderDto,
    user: { type: 'member' | 'staff'; sub: number },
    manager: EntityManager,
  ): Promise<{
    memberId: number | null;
    customerId: number | null;
    staffId: number;
  }> {
    if (user.type === 'member') {
      // Mobile / web member checkout. The bearer is the customer; we still
      // need an attributable staff row because staff_id is NOT NULL.
      const fallbackStaffId = parseInt(
        this.configService.get<string>('MOBILE_APP_STAFF_ID', '1'),
        10,
      );
      const serviceStaff = await manager.findOne(Staff, {
        where: { staff_id: fallbackStaffId },
      });
      if (!serviceStaff) {
        throw new UnprocessableEntityException(
          `Mobile-app service staff (id=${fallbackStaffId}) is missing. Set MOBILE_APP_STAFF_ID to a valid staff_id or seed a service account.`,
        );
      }
      return {
        memberId: user.sub,
        customerId: null,
        staffId: fallbackStaffId,
      };
    }

    // user.type === 'staff' — POS / Admin Dashboard order entry.
    const staffId = user.sub;

    if (dto.member_id != null) {
      // Staff is registering an existing member's purchase at the till.
      const member = await manager.findOne(Member, {
        where: { member_id: dto.member_id },
      });
      if (!member) {
        throw new NotFoundException(
          `Member with ID ${dto.member_id} not found`,
        );
      }
      return { memberId: member.member_id, customerId: null, staffId };
    }

    // Anonymous walk-in. Match by phone if supplied, otherwise create.
    const walkInName = dto.customer_name?.trim() || 'Walk-in Customer';
    const walkInPhone = dto.customer_phone?.trim() || null;

    let customer: Customer | null = null;
    if (walkInPhone) {
      customer = await manager.findOne(Customer, {
        where: { phone_number: walkInPhone },
      });
    }
    if (!customer) {
      customer = manager.create(Customer, {
        name: walkInName,
        phone_number: walkInPhone,
      });
      customer = await manager.save(Customer, customer);
    }

    return { memberId: null, customerId: customer.customer_id, staffId };
  }
}
