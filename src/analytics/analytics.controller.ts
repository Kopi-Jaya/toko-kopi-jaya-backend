import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('sales-by-source')
  @ApiOperation({ summary: 'Get sales analytics grouped by order source' })
  @ApiResponse({ status: 200, description: 'Sales by source data returned successfully' })
  getSalesBySource(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getSalesBySource(query);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance analytics' })
  @ApiResponse({ status: 200, description: 'Product performance data returned successfully' })
  getProductPerformance(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getProductPerformance(query);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('member-loyalty')
  @ApiOperation({ summary: 'Get member loyalty analytics' })
  @ApiResponse({ status: 200, description: 'Member loyalty data returned successfully' })
  getMemberLoyalty(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getMemberLoyalty(query);
  }
}
