import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Cash received from customer (Tunai only). Must be >= amount. Response will include calculated change.',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cash_received?: number;
}
