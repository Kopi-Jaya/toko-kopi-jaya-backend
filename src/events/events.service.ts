import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual, Or } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(query: QueryEventDto): Promise<Event[]> {
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.outlet', 'outlet')
      .orderBy('event.start_date', 'DESC');

    if (query.outlet_id !== undefined) {
      qb.andWhere(
        '(event.outlet_id = :outletId OR event.outlet_id IS NULL)',
        { outletId: query.outlet_id },
      );
    }

    if (query.is_active !== undefined) {
      qb.andWhere('event.is_active = :isActive', { isActive: query.is_active });
    }

    if (query.upcoming) {
      const today = new Date().toISOString().slice(0, 10);
      qb.andWhere('event.end_date >= :today', { today });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { event_id: id },
      relations: ['outlet'],
    });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...dto,
      outlet_id: dto.outlet_id ?? null,
    });
    return this.eventRepository.save(event);
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    await this.eventRepository.save(event);
    return this.findOne(id);
  }

  async setImage(id: number, imgUrl: string): Promise<Event> {
    const event = await this.findOne(id);
    event.img_url = imgUrl;
    await this.eventRepository.save(event);
    return event;
  }

  async remove(id: number): Promise<void> {
    const exists = await this.eventRepository.existsBy({ event_id: id });
    if (!exists) throw new NotFoundException(`Event ${id} not found`);
    await this.eventRepository.softDelete(id);
  }
}
