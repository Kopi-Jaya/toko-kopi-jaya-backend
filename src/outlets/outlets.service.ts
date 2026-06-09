import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { Outlet } from './entities/outlet.entity';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { QueryOutletDto } from './dto/query-outlet.dto';

@Injectable()
export class OutletsService {
  constructor(
    @InjectRepository(Outlet)
    private readonly outletRepository: Repository<Outlet>,
  ) {}

  async findAll(query: QueryOutletDto) {
    const { page = 1, limit = 20, status, lat, lng } = query;
    const skip = (page - 1) * limit;

    const qb = this.outletRepository.createQueryBuilder('outlet');

    if (status) {
      qb.andWhere('outlet.status = :status', { status });
    }

    if (lat !== undefined && lng !== undefined) {
      qb.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(outlet.latitude)) * cos(radians(outlet.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(outlet.latitude))))`,
        'distance',
      );
      qb.setParameters({ lat, lng });
      qb.andWhere('outlet.latitude IS NOT NULL');
      qb.andWhere('outlet.longitude IS NOT NULL');
      qb.orderBy('distance', 'ASC');
    } else {
      qb.orderBy('outlet.created_at', 'DESC');
    }

    qb.skip(skip).take(limit);

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

  async findOne(id: number): Promise<Outlet> {
    const outlet = await this.outletRepository
      .createQueryBuilder('outlet')
      .where('outlet.outlet_id = :id', { id })
      .loadRelationCountAndMap('outlet.staff_count', 'outlet.staff')
      .loadRelationCountAndMap('outlet.orders_count', 'outlet.orders')
      .getOne();

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${id} not found`);
    }

    return outlet;
  }

  async create(dto: CreateOutletDto): Promise<Outlet> {
    const outlet = this.outletRepository.create(dto);
    return this.outletRepository.save(outlet);
  }

  async update(id: number, dto: UpdateOutletDto): Promise<Outlet> {
    const outlet = await this.findOne(id);
    Object.assign(outlet, dto);
    return this.outletRepository.save(outlet);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.outletRepository.existsBy({ outlet_id: id });
    if (!exists) throw new NotFoundException(`Outlet with ID ${id} not found`);
    await this.outletRepository.softDelete(id);
  }

  async setLogo(
    id: number,
    publicUrl: string,
    relativeFilePath: string,
    uploadsRoot: string,
  ): Promise<Outlet> {
    if (!publicUrl) throw new BadRequestException('Logo upload failed (no file)');
    const outlet = await this.findOne(id);
    const previous = outlet.logo_url;

    outlet.logo_url = publicUrl;
    await this.outletRepository.save(outlet);

    if (previous && previous.includes('/uploads/')) {
      const previousPath = previous.split('/uploads/').pop();
      if (previousPath) {
        const previousAbsolute = join(uploadsRoot, previousPath);
        if (
          previousAbsolute.startsWith(uploadsRoot) &&
          previousAbsolute !== join(uploadsRoot, relativeFilePath) &&
          existsSync(previousAbsolute)
        ) {
          try { unlinkSync(previousAbsolute); } catch (_) {}
        }
      }
    }

    return this.findOne(id);
  }
}
