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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { EndShiftDto } from './dto/end-shift.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Roles(StaffRole.CASHIER, StaffRole.MANAGER)
  @Post('start')
  @ApiOperation({ summary: 'Start a new shift' })
  @ApiResponse({ status: 201, description: 'Shift started successfully' })
  start(@Request() req, @Body() dto: StartShiftDto) {
    return this.shiftsService.startShift(req.user.sub, dto);
  }

  @Roles(StaffRole.CASHIER, StaffRole.MANAGER)
  @Patch(':id/end')
  @ApiOperation({ summary: 'End an active shift' })
  @ApiResponse({ status: 200, description: 'Shift ended successfully' })
  end(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndShiftDto,
  ) {
    return this.shiftsService.endShift(id, req.user.sub, dto);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get()
  @ApiOperation({ summary: 'Get all shifts' })
  @ApiResponse({ status: 200, description: 'List of shifts returned successfully' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.shiftsService.findAll(query);
  }
}
