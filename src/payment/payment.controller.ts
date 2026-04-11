import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get payment details by order ID' })
  @ApiResponse({ status: 200, description: 'Payment details returned successfully' })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.findByOrderId(orderId);
  }
}
