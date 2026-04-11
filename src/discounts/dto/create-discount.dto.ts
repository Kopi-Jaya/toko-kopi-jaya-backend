import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ChargeType } from '../../common/enums';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Discount name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Discount code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Discount type', enum: ChargeType })
  @IsEnum(ChargeType)
  type: ChargeType;

  @ApiProperty({ description: 'Discount value', minimum: 0 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Minimum purchase amount' })
  @IsOptional()
  @IsNumber()
  min_purchase?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount' })
  @IsOptional()
  @IsNumber()
  max_discount?: number;

  @ApiPropertyOptional({ description: 'Usage limit' })
  @IsOptional()
  @IsNumber()
  usage_limit?: number;

  @ApiPropertyOptional({ description: 'Valid from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @ApiPropertyOptional({ description: 'Valid until date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional({ description: 'Whether discount is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
