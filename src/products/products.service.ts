import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, ProductSortBy, SortOrder } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(query: QueryProductDto) {
    const {
      page = 1,
      limit = 20,
      category_id,
      search,
      is_available,
      sort_by = ProductSortBy.created_at,
      sort_order = SortOrder.DESC,
    } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (category_id !== undefined) {
      qb.andWhere('product.category_id = :category_id', { category_id });
    }

    if (search) {
      qb.andWhere('product.name LIKE :search', { search: `%${search}%` });
    }

    if (is_available !== undefined) {
      qb.andWhere('product.is_available = :is_available', { is_available });
    }

    qb.orderBy(`product.${sort_by}`, sort_order);

    const skip = (page - 1) * limit;
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

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { product_id: id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    const saved = await this.productRepository.save(product);
    return this.findOne(saved.product_id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    await this.productRepository.save(product);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
