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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles(StaffRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiResponse({
    status: 200,
    description: 'List of staff returned successfully',
  })
  findAll(@Query() query: QueryStaffDto) {
    return this.staffService.findAll(query);
  }

  @Roles(StaffRole.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member returned successfully',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  /// Only super_admin can create new staff under M-125 — outlet admins
  /// shouldn't be able to mint accounts for outlets they don't run.
  @Roles(StaffRole.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new staff member (super_admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
  })
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Roles(StaffRole.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member (super_admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Roles(StaffRole.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a staff member (super_admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Staff member deleted successfully',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }
}
