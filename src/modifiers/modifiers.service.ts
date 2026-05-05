import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Modifier } from './entities/modifier.entity';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';
import { ModifierType } from '../common/enums';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(Modifier)
    private readonly modifierRepository: Repository<Modifier>,
  ) {}

  async findAll(query?: { is_active?: boolean; type?: ModifierType }): Promise<Modifier[]> {
    const where: FindOptionsWhere<Modifier> = {};

    if (query?.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    if (query?.type) {
      where.type = query.type;
    }

    return this.modifierRepository.find({ where });
  }

  async findOne(id: number): Promise<Modifier & { order_usage_count: number }> {
    const modifier = await this.modifierRepository.findOne({
      where: { modifier_id: id },
    });

    if (!modifier) {
      throw new NotFoundException(`Modifier with ID ${id} not found`);
    }

    const [{ cnt }] = await this.modifierRepository.query(
      'SELECT COUNT(*) as cnt FROM order_item_modifier WHERE modifier_id = ?',
      [id],
    );
    (modifier as Modifier & { order_usage_count: number }).order_usage_count =
      parseInt(cnt, 10);

    return modifier as Modifier & { order_usage_count: number };
  }

  async create(dto: CreateModifierDto): Promise<Modifier> {
    const modifier = this.modifierRepository.create(dto);
    return this.modifierRepository.save(modifier);
  }

  async update(id: number, dto: UpdateModifierDto): Promise<Modifier> {
    const modifier = await this.findOne(id);
    Object.assign(modifier, dto);
    return this.modifierRepository.save(modifier);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.modifierRepository.existsBy({ modifier_id: id });
    if (!exists) throw new NotFoundException(`Modifier with ID ${id} not found`);
    await this.modifierRepository.softDelete(id);
  }
}
