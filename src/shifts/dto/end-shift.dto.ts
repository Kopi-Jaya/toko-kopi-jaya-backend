import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class EndShiftDto {
  @ApiProperty({ description: 'Total cash received during shift' })
  @IsNumber()
  total_cash_received: number;

  @ApiProperty({ description: 'Total cash out during shift' })
  @IsNumber()
  total_cash_out: number;

  @ApiProperty({ description: 'Final cash amount' })
  @IsNumber()
  final_cash: number;
}
