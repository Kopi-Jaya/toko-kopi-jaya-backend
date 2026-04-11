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
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { QueryOutletDto } from './dto/query-outlet.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all outlets with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of outlets returned successfully' })
  findAll(@Query() query: QueryOutletDto) {
    return this.outletsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get an outlet by ID' })
  @ApiResponse({ status: 200, description: 'Outlet returned successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.outletsService.findOne(id);
  }

  @Roles(StaffRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new outlet' })
  @ApiResponse({ status: 201, description: 'Outlet created successfully' })
  create(@Body() dto: CreateOutletDto) {
    return this.outletsService.create(dto);
  }

  @Roles(StaffRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an outlet' })
  @ApiResponse({ status: 200, description: 'Outlet updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOutletDto) {
    return this.outletsService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an outlet' })
  @ApiResponse({ status: 204, description: 'Outlet deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.outletsService.remove(id);
  }
}
