import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCharge } from './entities/service-charge.entity';
import { CreateServiceChargeDto } from './dto/create-service-charge.dto';
import { UpdateServiceChargeDto } from './dto/update-service-charge.dto';

@Injectable()
export class ServiceChargeService {
  constructor(
    @InjectRepository(ServiceCharge)
    private readonly serviceChargeRepository: Repository<ServiceCharge>,
  ) {}

  async findAll(): Promise<ServiceCharge[]> {
    return this.serviceChargeRepository.find({
      where: { is_active: true },
      order: { service_charge_id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ServiceCharge> {
    const sc = await this.serviceChargeRepository.findOne({
      where: { service_charge_id: id },
    });

    if (!sc) {
      throw new NotFoundException(`Service charge with ID ${id} not found`);
    }

    return sc;
  }

  async create(dto: CreateServiceChargeDto): Promise<ServiceCharge> {
    const sc = this.serviceChargeRepository.create(dto);
    return this.serviceChargeRepository.save(sc);
  }

  async update(id: number, dto: UpdateServiceChargeDto): Promise<ServiceCharge> {
    const sc = await this.findOne(id);
    Object.assign(sc, dto);
    return this.serviceChargeRepository.save(sc);
  }

  async remove(id: number): Promise<void> {
    const sc = await this.findOne(id);
    await this.serviceChargeRepository.remove(sc);
  }
}
