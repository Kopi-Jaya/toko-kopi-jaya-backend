import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRedeemDto {
  @ApiProperty({ description: 'Product ID for the reward' })
  @IsNumber()
  product_id: number;

  @ApiProperty({ description: 'Points required to redeem', minimum: 1 })
  @IsNumber()
  @Min(1)
  point_cost: number;

  @ApiPropertyOptional({ description: 'Whether the reward is active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Stock limit (null for unlimited)', nullable: true })
  @IsOptional()
  @IsNumber()
  stock_limit?: number | null;
}
