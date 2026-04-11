import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { Staff } from '../staff/entities/staff.entity';
import { StartShiftDto } from './dto/start-shift.dto';
import { EndShiftDto } from './dto/end-shift.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async startShift(staffId: number, dto: StartShiftDto): Promise<Shift> {
    const staff = await this.staffRepository.findOne({
      where: { staff_id: staffId },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    if (!staff.outlet_id) {
      throw new BadRequestException('Staff is not assigned to any outlet');
    }

    // Check for existing open shift
    const openShift = await this.shiftRepository.findOne({
      where: { staff_id: staffId, end_time: IsNull() },
    });

    if (openShift) {
      throw new BadRequestException('Staff already has an open shift. Please end the current shift first.');
    }

    const shift = this.shiftRepository.create({
      staff_id: staffId,
      outlet_id: staff.outlet_id,
      start_time: new Date(),
      cash_in_hand: dto.cash_in_hand,
    });

    const saved = await this.shiftRepository.save(shift);

    const result = await this.shiftRepository.findOne({
      where: { shift_id: saved.shift_id },
      relations: ['staff', 'outlet'],
    });

    if (!result) {
      throw new NotFoundException(`Shift with ID ${saved.shift_id} not found after creation`);
    }

    return result;
  }

  async endShift(shiftId: number, staffId: number, dto: EndShiftDto): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { shift_id: shiftId },
      relations: ['staff', 'outlet'],
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${shiftId} not found`);
    }

    if (Number(shift.staff_id) !== Number(staffId)) {
      throw new BadRequestException('You can only end your own shift');
    }

    if (shift.end_time) {
      throw new BadRequestException('This shift has already ended');
    }

    shift.end_time = new Date();
    shift.total_cash_received = dto.total_cash_received;
    shift.total_cash_out = dto.total_cash_out;
    shift.final_cash = dto.final_cash;

    await this.shiftRepository.save(shift);

    // Re-fetch to get the generated discrepancy column
    const updated = await this.shiftRepository.findOne({
      where: { shift_id: shiftId },
      relations: ['staff', 'outlet'],
    });

    if (!updated) {
      throw new NotFoundException(`Shift with ID ${shiftId} not found after update`);
    }

    return updated;
  }

  async findAll(query: PaginationQueryDto & { staff_id?: number; outlet_id?: number }) {
    const { page = 1, limit = 20, staff_id, outlet_id } = query;
    const skip = (page - 1) * limit;

    const qb = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.staff', 'staff')
      .leftJoinAndSelect('shift.outlet', 'outlet');

    if (staff_id) {
      qb.andWhere('shift.staff_id = :staff_id', { staff_id });
    }
    if (outlet_id) {
      qb.andWhere('shift.outlet_id = :outlet_id', { outlet_id });
    }

    qb.orderBy('shift.start_time', 'DESC').skip(skip).take(limit);

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
