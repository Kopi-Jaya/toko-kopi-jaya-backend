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
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('discounts')
@ApiBearerAuth()
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get()
  @ApiOperation({ summary: 'Get all discounts' })
  @ApiResponse({ status: 200, description: 'List of discounts returned successfully' })
  findAll() {
    return this.discountsService.findAll();
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a discount by ID' })
  @ApiResponse({ status: 200, description: 'Discount returned successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.findOne(id);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create a new discount' })
  @ApiResponse({ status: 201, description: 'Discount created successfully' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a discount' })
  @ApiResponse({ status: 200, description: 'Discount updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiscountDto) {
    return this.discountsService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a discount' })
  @ApiResponse({ status: 204, description: 'Discount deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.remove(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a discount code' })
  @ApiResponse({ status: 200, description: 'Discount validation result returned' })
  validate(@Body() dto: ValidateDiscountDto) {
    return this.discountsService.validate(dto);
  }
}
