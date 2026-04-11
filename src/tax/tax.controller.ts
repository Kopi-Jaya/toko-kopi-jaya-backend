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
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('taxes')
@ApiBearerAuth()
@Controller('taxes')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.CASHIER)
  @Get()
  @ApiOperation({ summary: 'Get all taxes' })
  @ApiResponse({ status: 200, description: 'List of taxes returned successfully' })
  findAll() {
    return this.taxService.findAll();
  }

  @Roles(StaffRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new tax' })
  @ApiResponse({ status: 201, description: 'Tax created successfully' })
  create(@Body() dto: CreateTaxDto) {
    return this.taxService.create(dto);
  }

  @Roles(StaffRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax' })
  @ApiResponse({ status: 200, description: 'Tax updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaxDto) {
    return this.taxService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tax' })
  @ApiResponse({ status: 204, description: 'Tax deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taxService.remove(id);
  }
}
