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

  @ApiPropertyOptional({
    description: 'Item modifiers',
    type: [CreateOrderItemModifierDto],
  })
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

  // ─── Staff-placed walk-in / member-attribution fields ──────────────────
  // Used only when the request comes from a staff JWT. Ignored on member
  // requests (which always attribute the order to the JWT's member_id).
  //
  // Resolution rules in OrdersService.create:
  //   1. Member JWT          → member_id = JWT.sub, customer_id = null,
  //                            staff_id = MOBILE_APP_STAFF_ID env var.
  //   2. Staff JWT + member_id → existing-member purchase at the till.
  //                              member_id = dto.member_id, customer_id = null.
  //   3. Staff JWT + customer_name → anonymous walk-in. customer row is
  //                                  created (or matched by phone) and
  //                                  customer_id is set.
  //   4. Staff JWT + neither → falls back to (3) with a "Walk-in" name.

  @ApiPropertyOptional({
    description:
      'Staff-only: register the order against an existing member. Mutually exclusive with customer_name.',
  })
  @IsOptional()
  @IsNumber()
  member_id?: number;

  @ApiPropertyOptional({
    description:
      'Staff-only: walk-in customer name. A customer row is created (or matched by phone) and attached.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({
    description:
      'Staff-only: walk-in customer phone. Used to deduplicate against existing customer records.',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  customer_phone?: string;
}
