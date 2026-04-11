import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderSource, OrderType } from '../../common/enums';

export class CreateOrderItemModifierDto {
  @ApiProperty({ description: 'Modifier ID' })
  @IsNumber()
  modifier_id: number;
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNumber()
  product_id: number;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Item modifiers', type: [CreateOrderItemModifierDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  items: CreateOrderItemDto[];

  @ApiProperty({ description: 'Outlet ID' })
  @IsNumber()
  outlet_id: number;

  @ApiProperty({ description: 'Order type', enum: OrderType })
  @IsEnum(OrderType)
  order_type: OrderType;

  @ApiPropertyOptional({ description: 'Order source', enum: OrderSource })
  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @ApiPropertyOptional({ description: 'Table number for dine-in orders' })
  @IsOptional()
  @IsString()
  table_number?: string;

  @ApiPropertyOptional({ description: 'Discount code to apply' })
  @IsOptional()
  @IsString()
  discount_code?: string;

  @ApiPropertyOptional({ description: 'Tax ID to apply' })
  @IsOptional()
  @IsNumber()
  tax_id?: number;

  @ApiPropertyOptional({ description: 'Service charge ID to apply' })
  @IsOptional()
  @IsNumber()
  service_charge_id?: number;
}
