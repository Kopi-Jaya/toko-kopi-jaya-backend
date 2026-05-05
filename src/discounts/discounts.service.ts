import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount } from './entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { ChargeType } from '../common/enums';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
  ) {}

  async findAll(): Promise<Discount[]> {
    return this.discountRepository.find({
      order: { discount_id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { discount_id: id },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return discount;
  }

  async create(dto: CreateDiscountDto): Promise<Discount> {
    const discount = this.discountRepository.create(dto);
    return this.discountRepository.save(discount);
  }

  async update(id: number, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findOne(id);
    Object.assign(discount, dto);
    return this.discountRepository.save(discount);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.discountRepository.existsBy({ discount_id: id });
    if (!exists) throw new NotFoundException(`Discount with ID ${id} not found`);
    await this.discountRepository.softDelete(id);
  }

  async validate(dto: ValidateDiscountDto) {
    const discount = await this.discountRepository.findOne({
      where: { code: dto.code },
    });

    if (!discount) {
      throw new NotFoundException(`Discount code "${dto.code}" not found`);
    }

    if (!discount.is_active) {
      throw new BadRequestException('Discount code is not active');
    }

    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      throw new BadRequestException('Discount code is not yet valid');
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      throw new BadRequestException('Discount code has expired');
    }

    if (
      discount.usage_limit !== null &&
      discount.usage_count >= discount.usage_limit
    ) {
      throw new BadRequestException('Discount code usage limit reached');
    }

    if (dto.subtotal < Number(discount.min_purchase)) {
      throw new BadRequestException(
        `Minimum purchase of ${discount.min_purchase} is required`,
      );
    }

    // Calculate discount amount
    let discount_amount: number;
    if (discount.type === ChargeType.PERCENTAGE) {
      discount_amount = dto.subtotal * (Number(discount.value) / 100);
      if (discount.max_discount !== null) {
        discount_amount = Math.min(discount_amount, Number(discount.max_discount));
      }
    } else {
      discount_amount = Number(discount.value);
    }

    discount_amount = Math.round(discount_amount * 100) / 100;

    return {
      valid: true,
      discount_id: discount.discount_id,
      name: discount.name,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discount_amount,
      final_subtotal: Math.round((dto.subtotal - discount_amount) * 100) / 100,
    };
  }
}
