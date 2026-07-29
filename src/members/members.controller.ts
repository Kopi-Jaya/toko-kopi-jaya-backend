import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdminUpdateMemberDto } from './dto/admin-update-member.dto';
import { ResetMemberPasswordDto } from './dto/reset-member-password.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('members')
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current member profile' })
  @ApiResponse({ status: 200, description: 'Member profile returned successfully' })
  getMe(@Request() req) {
    return this.membersService.findMe(req.user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current member profile' })
  @ApiResponse({ status: 200, description: 'Member profile updated successfully' })
  updateMe(@Request() req, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateMe(req.user.sub, dto);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get()
  @ApiOperation({ summary: 'Get all members (admin/manager)' })
  @ApiResponse({ status: 200, description: 'List of members returned successfully' })
  findAll(@Query() query: QueryMemberDto) {
    return this.membersService.findAll(query);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a member by ID (admin/manager)' })
  @ApiResponse({ status: 200, description: 'Member returned successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findOne(id);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a member by ID (admin/manager)' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  adminUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateMemberDto,
  ) {
    return this.membersService.adminUpdate(id, dto);
  }

  /// BUG-2026-009 — the only password recovery path that exists.
  ///
  /// Member login is email + password with no OTP and no SMTP configured, so a
  /// forgotten password previously meant permanent loss of the account and its
  /// points ("Lupa password?" in the app only showed "Coming soon"). Recovery is
  /// staff-assisted: the member identifies themselves at an outlet and an admin
  /// sets a new password here.
  ///
  /// Restricted to ADMIN and SUPER_ADMIN — deliberately NOT manager or cashier,
  /// since resetting a password is full account takeover and the till-level roles
  /// should not be able to do it.
  @Roles(StaffRole.ADMIN, StaffRole.SUPER_ADMIN)
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset a member password (admin only)',
    description:
      'Staff-assisted recovery for a member who has forgotten their password. ' +
      'There is no self-service email reset in this deployment.',
  })
  @ApiResponse({ status: 200, description: 'Password reset' })
  @ApiResponse({ status: 400, description: 'Password shorter than 8 characters' })
  @ApiResponse({ status: 403, description: 'Insufficient role — admin only' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetMemberPasswordDto,
  ) {
    return this.membersService.resetPassword(id, dto.new_password);
  }
}
