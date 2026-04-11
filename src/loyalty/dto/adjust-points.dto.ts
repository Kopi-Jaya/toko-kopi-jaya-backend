import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({ description: 'Member ID' })
  @IsNumber()
  member_id: number;

  @ApiProperty({ description: 'Points change (positive to add, negative to deduct)' })
  @IsNumber()
  points_change: number;

  @ApiProperty({ description: 'Description/reason for adjustment' })
  @IsString()
  description: string;
}
