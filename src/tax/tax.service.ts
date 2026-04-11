import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from './entities/tax.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
  ) {}

  async findAll(): Promise<Tax[]> {
    return this.taxRepository.find({
      where: { is_active: true },
      order: { tax_id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Tax> {
    const tax = await this.taxRepository.findOne({
      where: { tax_id: id },
    });

    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }

    return tax;
  }

  async create(dto: CreateTaxDto): Promise<Tax> {
    const tax = this.taxRepository.create(dto);
    return this.taxRepository.save(tax);
  }

  async update(id: number, dto: UpdateTaxDto): Promise<Tax> {
    const tax = await this.findOne(id);
    Object.assign(tax, dto);
    return this.taxRepository.save(tax);
  }

  async remove(id: number): Promise<void> {
    const tax = await this.findOne(id);
    await this.taxRepository.remove(tax);
  }
}
