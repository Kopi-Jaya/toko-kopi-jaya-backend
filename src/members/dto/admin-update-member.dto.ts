import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UpdateMemberDto } from './update-member.dto';
import { MemberTier } from '../../common/enums';

export class AdminUpdateMemberDto extends UpdateMemberDto {
  @ApiPropertyOptional({ description: 'Member tier', enum: MemberTier })
  @IsOptional()
  @IsEnum(MemberTier)
  tier?: MemberTier;

  @ApiPropertyOptional({ description: 'Whether the member is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
