import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a payment for an order',
    description:
      'For Tunai (Cash): include cash_received to get change in the response. ' +
      'For QRIS: omit cash_received, then call PATCH /payments/:id/confirm when payment is received.',
  })
  @ApiResponse({ status: 201, description: 'Payment created. change field is present for Cash payments.' })
  @ApiResponse({ status: 400, description: 'Order not pending, payment already exists, or cash_received < total' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get payment details by order ID' })
  @ApiResponse({ status: 200, description: 'Payment details returned successfully' })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.findByOrderId(orderId);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.CASHIER, StaffRole.MANAGER, StaffRole.ADMIN, StaffRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Cashier confirms QRIS payment received',
    description: 'Marks a pending QRIS payment as SUCCESS and advances the order to PAID. Staff only.',
  })
  @ApiResponse({ status: 200, description: 'QRIS payment confirmed. Order advanced to paid.' })
  @ApiResponse({ status: 400, description: 'Payment is not QRIS or not in pending status' })
  @ApiResponse({ status: 403, description: 'Insufficient role — staff only' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  confirmQris(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.confirmQris(id);
  }
}
