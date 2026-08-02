import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findOrCreate(name: string, phone?: string): Promise<Customer> {
    if (phone) {
      const existing = await this.customerRepository.findOne({
        where: { phone_number: phone },
      });

      if (existing) {
        return existing;
      }
    }

    const customer = this.customerRepository.create({
      name,
      phone_number: phone ?? null,
    });

    return this.customerRepository.save(customer);
  }

  /// `scopedOutletId` is `null` for super_admin, the caller's outlet_id
  /// otherwise — same pattern as `MembersService.findAll` (BUG-2026-015): a
  /// walk-in customer isn't tied to one outlet, so scoping means "has at
  /// least one order at this outlet", via EXISTS to avoid duplicating rows.
  async findAll(query: PaginationQueryDto, scopedOutletId: number | null = null) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (scopedOutletId !== null) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM orders scoped_order WHERE scoped_order.customer_id = customer.customer_id AND scoped_order.outlet_id = :scopedOutletId)`,
        { scopedOutletId },
      );
    }

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
}
