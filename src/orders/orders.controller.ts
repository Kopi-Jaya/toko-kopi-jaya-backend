import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get own orders (member only)' })
  @ApiResponse({
    status: 200,
    description: 'List of member orders returned successfully',
  })
  findMyOrders(@Request() req, @Query() query: QueryOrderDto) {
    return this.ordersService.findAllByMember(req.user.sub, query);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.CASHIER)
  @Get('admin')
  @ApiOperation({ summary: 'Get all orders (admin/manager/cashier)' })
  @ApiResponse({
    status: 200,
    description: 'List of orders returned successfully',
  })
  findAllAdmin(@Query() query: QueryOrderDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.CASHIER)
  @Get('validate/:pickupCode')
  @ApiOperation({ summary: 'Validate order by pickup code (QR ticket)' })
  @ApiResponse({ status: 200, description: 'Order returned successfully' })
  validateByPickupCode(@Param('pickupCode') pickupCode: string) {
    return this.ordersService.findByPickupCode(pickupCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order returned successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Roles(
    StaffRole.ADMIN,
    StaffRole.MANAGER,
    StaffRole.CASHIER,
    StaffRole.BARISTA,
  )
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  updateStatus(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, req.user);
  }
}
