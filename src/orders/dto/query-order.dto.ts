import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { OrderSource, OrderStatus, OrderType } from '../../common/enums';

export class QueryOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by order source',
    enum: OrderSource,
  })
  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @ApiPropertyOptional({ description: 'Filter by order type', enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType)
  order_type?: OrderType;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Filter by pickup code' })
  @IsOptional()
  @IsString()
  pickup_code?: string;

  @ApiPropertyOptional({ description: 'Filter by outlet (M-125)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  outlet_id?: number;
}
