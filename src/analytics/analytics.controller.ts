import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { StaffRole } from '../common/enums';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /// Forces the outlet filter to the caller's own outlet unless they hold
  /// cross-outlet authority (super_admin, where `scopedOutletId` is null).
  /// The service already supports `outlet_id`; it was simply optional, so an
  /// outlet admin who omitted it received company-wide revenue (M-188).
  private scoped(
    query: QueryAnalyticsDto,
    user: AuthenticatedUser,
  ): QueryAnalyticsDto {
    if (user.scopedOutletId === null) return query;
    return { ...query, outlet_id: user.scopedOutletId };
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('sales-by-source')
  @ApiOperation({ summary: 'Get sales analytics grouped by order source' })
  @ApiResponse({
    status: 200,
    description: 'Sales by source data returned successfully',
  })
  getSalesBySource(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getSalesBySource(this.scoped(query, user));
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance analytics' })
  @ApiResponse({
    status: 200,
    description: 'Product performance data returned successfully',
  })
  getProductPerformance(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getProductPerformance(
      this.scoped(query, user),
    );
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('product-outlets')
  @ApiOperation({ summary: 'Get outlet assignments for all products' })
  getProductOutlets() {
    return this.analyticsService.getProductOutlets();
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('member-loyalty')
  @ApiOperation({ summary: 'Get member loyalty analytics' })
  @ApiResponse({
    status: 200,
    description: 'Member loyalty data returned successfully',
  })
  getMemberLoyalty(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getMemberLoyalty(this.scoped(query, user));
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('loyalty')
  @ApiOperation({
    summary: 'Get loyalty program analytics (points issued/redeemed, tier distribution)',
  })
  @ApiResponse({
    status: 200,
    description: 'Loyalty analytics returned successfully',
  })
  getLoyaltyAnalytics(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getLoyaltyAnalytics(this.scoped(query, user));
  }
}
