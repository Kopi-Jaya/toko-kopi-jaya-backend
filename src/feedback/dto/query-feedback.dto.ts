import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryFeedbackDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by exact rating (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Filter by outlet (via the order it was left on)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  outlet_id?: number;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
