import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles(StaffRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiResponse({ status: 200, description: 'List of staff returned successfully' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.staffService.findAll(query);
  }

  @Roles(StaffRole.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member returned successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Roles(StaffRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Roles(StaffRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  @ApiResponse({ status: 200, description: 'Staff member updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a staff member' })
  @ApiResponse({ status: 204, description: 'Staff member deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }
}
