import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { MemberTier } from '../../common/enums';

export class QueryMemberDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by member tier', enum: MemberTier })
  @IsOptional()
  @IsEnum(MemberTier)
  tier?: MemberTier;
}
