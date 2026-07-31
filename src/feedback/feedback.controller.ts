import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { StaffRole } from '../common/enums';

@ApiTags('feedback')
@ApiBearerAuth()
@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('orders/:orderId/feedback')
  @ApiOperation({ summary: 'Leave feedback on a completed order (member only, own order)' })
  @ApiResponse({ status: 201, description: 'Feedback recorded' })
  @ApiResponse({ status: 400, description: 'Order not completed, or feedback already exists' })
  @ApiResponse({ status: 403, description: 'Not the order\'s own member' })
  create(
    @Request() req,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createForOrder(req.user.sub, orderId, dto);
  }

  @Get('orders/:orderId/feedback/exists')
  @ApiOperation({ summary: 'Check whether the caller has already left feedback on this order' })
  async exists(@Param('orderId', ParseIntPipe) orderId: number) {
    return { exists: await this.feedbackService.hasFeedback(orderId) };
  }

  /// Same outlet-scoping convention as analytics/shifts: `scopedOutletId` is
  /// null for super_admin (sees everything) and the caller's own outlet_id
  /// otherwise, forced server-side rather than trusted from the query (M-188).
  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get('feedback')
  @ApiOperation({ summary: 'List order feedback (admin/manager)' })
  @ApiResponse({ status: 200, description: 'Feedback list returned successfully' })
  findAll(
    @Query() query: QueryFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.feedbackService.findAll(query, user.scopedOutletId);
  }
}
