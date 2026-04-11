import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdminUpdateMemberDto } from './dto/admin-update-member.dto';
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
}
