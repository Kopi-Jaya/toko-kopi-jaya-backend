import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../common/enums';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
