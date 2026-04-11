import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MemberTier } from '../../common/enums';

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Filter by outlet ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  outlet_id?: number;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  category_id?: number;

  @ApiPropertyOptional({ description: 'Filter by member tier', enum: MemberTier })
  @IsOptional()
  @IsEnum(MemberTier)
  tier?: MemberTier;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
