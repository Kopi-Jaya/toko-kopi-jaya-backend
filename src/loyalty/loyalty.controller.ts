import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { QueryPointsHistoryDto } from '../members/dto/query-points-history.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('loyalty')
@ApiBearerAuth()
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get loyalty summary for current member' })
  @ApiResponse({ status: 200, description: 'Loyalty summary returned successfully' })
  getMySummary(@Request() req) {
    return this.loyaltyService.getMySummary(req.user);
  }

  @Get('me/points-history')
  @ApiOperation({ summary: 'Get points history for current member' })
  @ApiResponse({ status: 200, description: 'Points history returned successfully' })
  getMyPointsHistory(@Request() req, @Query() query: QueryPointsHistoryDto) {
    return this.loyaltyService.getMyPointsHistory(req.user, query);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Post('adjust')
  @ApiOperation({ summary: 'Manual points adjustment (admin/manager)' })
  @ApiResponse({ status: 201, description: 'Points adjusted successfully' })
  adjustPoints(@Request() req, @Body() dto: AdjustPointsDto) {
    return this.loyaltyService.adjustPoints(dto, req.user.sub);
  }
}
