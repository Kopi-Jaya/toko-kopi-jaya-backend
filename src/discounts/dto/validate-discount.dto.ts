import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class ValidateDiscountDto {
  @ApiProperty({ description: 'Discount code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Order subtotal', minimum: 0 })
  @IsNumber()
  @Min(0)
  subtotal: number;
}
