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

  /// `scopedOutletId` is `null` for super_admin (cross-outlet) and the caller's
  /// own outlet_id otherwise. When set it OVERRIDES any client-supplied
  /// `outlet_id` filter — the query string is a convenience for super_admin, not
  /// an authorisation boundary. Omitting the parameter used to return every
  /// staff record in the company to any outlet admin (M-188).
  async findAll(
    query: PaginationQueryDto & {
      role?: StaffRole;
      outlet_id?: number;
      is_active?: boolean;
    },
    scopedOutletId: number | null = null,
  ) {
    const { page = 1, limit = 20, role, is_active } = query;
    const outlet_id = scopedOutletId ?? query.outlet_id;
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

  /// Pass `scopedOutletId` from the caller so an outlet admin cannot read a
  /// staff record belonging to another outlet (M-188). Deliberately reports
  /// NotFound rather than Forbidden — a 403 would confirm the id exists and let
  /// an outlet admin enumerate staff ids they have no business knowing about.
  async findOne(
    id: number,
    scopedOutletId: number | null = null,
  ): Promise<Staff> {
    const staff = await this.staffRepository
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.outlet', 'outlet')
      .where('staff.staff_id = :id', { id })
      .loadRelationCountAndMap('staff.orders_count', 'staff.orders')
      .loadRelationCountAndMap('staff.shifts_count', 'staff.shifts')
      .getOne();

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    if (
      scopedOutletId !== null &&
      Number(staff.outlet_id) !== Number(scopedOutletId)
    ) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async create(dto: CreateStaffDto): Promise<Staff> {
    const existingUsername = await this.staffRepository.findOne({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException(
        `Username "${dto.username}" is already taken`,
      );
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
        throw new ConflictException(
          `Username "${dto.username}" is already taken`,
        );
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
    const exists = await this.staffRepository.existsBy({ staff_id: id });
    if (!exists) throw new NotFoundException(`Staff with ID ${id} not found`);
    await this.staffRepository.softDelete(id);
  }
}
