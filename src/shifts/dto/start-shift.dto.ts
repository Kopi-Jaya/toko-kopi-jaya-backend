import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class StartShiftDto {
  @ApiProperty({ description: 'Starting cash in hand', minimum: 0 })
  @IsNumber()
  @Min(0)
  cash_in_hand: number;
}
