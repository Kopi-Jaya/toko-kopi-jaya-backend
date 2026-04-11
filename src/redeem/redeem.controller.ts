import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedeemService } from './redeem.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CreateRedeemDto } from './dto/create-redeem.dto';
import { UpdateRedeemDto } from './dto/update-redeem.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('redeem')
@ApiBearerAuth()
@Controller('redeem')
export class RedeemController {
  constructor(private readonly redeemService: RedeemService) {}

  @Get()
  @ApiOperation({ summary: 'Get available rewards for current member' })
  @ApiResponse({ status: 200, description: 'Available rewards returned successfully' })
  findAvailableRewards(@Request() req) {
    return this.redeemService.findAll(req.user.sub);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Post('admin')
  @ApiOperation({ summary: 'Create a new reward (admin/manager)' })
  @ApiResponse({ status: 201, description: 'Reward created successfully' })
  createReward(@Body() dto: CreateRedeemDto) {
    return this.redeemService.create(dto);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Redeem a reward' })
  @ApiResponse({ status: 201, description: 'Reward redeemed successfully' })
  redeem(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.redeemService.redeemReward(req.user.sub, id, dto);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Patch('admin/:id')
  @ApiOperation({ summary: 'Update a reward (admin/manager)' })
  @ApiResponse({ status: 200, description: 'Reward updated successfully' })
  updateReward(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRedeemDto,
  ) {
    return this.redeemService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Delete a reward (admin only)' })
  @ApiResponse({ status: 200, description: 'Reward deleted successfully' })
  removeReward(@Param('id', ParseIntPipe) id: number) {
    return this.redeemService.remove(id);
  }
}
