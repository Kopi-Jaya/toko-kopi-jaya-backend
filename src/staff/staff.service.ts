import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { StaffRole } from '../common/enums';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async findAll(query: PaginationQueryDto & { role?: StaffRole; outlet_id?: number; is_active?: boolean }) {
    const { page = 1, limit = 20, role, outlet_id, is_active } = query;
    const skip = (page - 1) * limit;

    const qb = this.staffRepository
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.outlet', 'outlet');

    if (role) {
      qb.andWhere('staff.role = :role', { role });
    }
    if (outlet_id !== undefined) {
      qb.andWhere('staff.outlet_id = :outlet_id', { outlet_id });
    }
    if (is_active !== undefined) {
      qb.andWhere('staff.is_active = :is_active', { is_active });
    }

    qb.orderBy('staff.created_at', 'DESC').skip(skip).take(limit);

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

  async findOne(id: number): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { staff_id: id },
      relations: ['outlet'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async create(dto: CreateStaffDto): Promise<Staff> {
    const existingUsername = await this.staffRepository.findOne({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException(`Username "${dto.username}" is already taken`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const staff = this.staffRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const saved = await this.staffRepository.save(staff);
    return this.findOne(saved.staff_id);
  }

  async update(id: number, dto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.findOne(id);

    if (dto.username && dto.username !== staff.username) {
      const existingUsername = await this.staffRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new ConflictException(`Username "${dto.username}" is already taken`);
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }

    Object.assign(staff, dto);
    await this.staffRepository.save(staff);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.staffRepository.softDelete(id);
  }
}
