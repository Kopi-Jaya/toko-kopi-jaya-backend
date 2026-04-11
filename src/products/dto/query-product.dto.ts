import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export enum ProductSortBy {
  name = 'name',
  base_price = 'base_price',
  earning_points = 'earning_points',
  created_at = 'created_at',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  category_id?: number;

  @ApiPropertyOptional({ description: 'Search by product name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ProductSortBy })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sort_by?: ProductSortBy;

  @ApiPropertyOptional({ description: 'Sort order', enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;
}
