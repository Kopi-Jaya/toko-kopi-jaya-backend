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

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total_items] = await this.customerRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

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
