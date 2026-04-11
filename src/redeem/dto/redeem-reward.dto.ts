import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class RedeemRewardDto {
  @ApiPropertyOptional({ description: 'Outlet ID where redemption occurs' })
  @IsOptional()
  @IsNumber()
  outlet_id?: number;

  @ApiPropertyOptional({ description: 'Staff ID processing the redemption' })
  @IsOptional()
  @IsNumber()
  staff_id?: number;
}
