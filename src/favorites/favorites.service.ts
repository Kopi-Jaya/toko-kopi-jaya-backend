import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
  ) {}

  async findAll(userId: number): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { member_id: userId },
      relations: ['product', 'product.category'],
      order: { created_at: 'DESC' },
    });
  }

  async create(userId: number, dto: CreateFavoriteDto): Promise<Favorite> {
    const existing = await this.favoriteRepository.findOne({
      where: { member_id: userId, product_id: dto.product_id },
    });

    if (existing) {
      throw new ConflictException('Product is already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      member_id: userId,
      product_id: dto.product_id,
    });

    const saved = await this.favoriteRepository.save(favorite);

    const result = await this.favoriteRepository.findOne({
      where: { favorite_id: saved.favorite_id },
      relations: ['product'],
    });

    if (!result) {
      throw new NotFoundException(`Favorite with ID ${saved.favorite_id} not found after creation`);
    }

    return result;
  }

  async remove(userId: number, favoriteId: number): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { favorite_id: favoriteId },
    });

    if (!favorite) {
      throw new NotFoundException(`Favorite with ID ${favoriteId} not found`);
    }

    if (Number(favorite.member_id) !== Number(userId)) {
      throw new NotFoundException(`Favorite with ID ${favoriteId} not found`);
    }

    await this.favoriteRepository.remove(favorite);
  }
}
