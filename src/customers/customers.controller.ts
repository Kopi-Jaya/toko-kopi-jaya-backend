import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.CASHIER)
  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of customers returned successfully' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }
}
