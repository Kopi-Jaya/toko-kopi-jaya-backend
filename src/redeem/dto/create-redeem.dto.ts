import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { MemberTier } from '../../common/enums';

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

  @ApiPropertyOptional({
    description: 'Minimum member tier required to redeem (null/omitted = any tier)',
    enum: MemberTier,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(MemberTier)
  min_tier?: MemberTier | null;
}
