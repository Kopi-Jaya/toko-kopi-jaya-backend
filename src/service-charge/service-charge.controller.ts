import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceChargeService } from './service-charge.service';
import { CreateServiceChargeDto } from './dto/create-service-charge.dto';
import { UpdateServiceChargeDto } from './dto/update-service-charge.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('service-charges')
@ApiBearerAuth()
@Controller('service-charges')
export class ServiceChargeController {
  constructor(private readonly serviceChargeService: ServiceChargeService) {}

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.CASHIER)
  @Get()
  @ApiOperation({ summary: 'Get all service charges' })
  @ApiResponse({ status: 200, description: 'List of service charges returned successfully' })
  findAll() {
    return this.serviceChargeService.findAll();
  }

  @Roles(StaffRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new service charge' })
  @ApiResponse({ status: 201, description: 'Service charge created successfully' })
  create(@Body() dto: CreateServiceChargeDto) {
    return this.serviceChargeService.create(dto);
  }

  @Roles(StaffRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a service charge' })
  @ApiResponse({ status: 200, description: 'Service charge updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceChargeDto) {
    return this.serviceChargeService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service charge' })
  @ApiResponse({ status: 204, description: 'Service charge deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceChargeService.remove(id);
  }
}
