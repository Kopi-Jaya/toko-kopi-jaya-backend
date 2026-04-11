import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsNumber()
  order_id: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ description: 'Payment amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;
}
