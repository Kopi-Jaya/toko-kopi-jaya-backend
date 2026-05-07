import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryShiftDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by staff_id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  staff_id?: number;

  @ApiPropertyOptional({ description: 'Filter by outlet (M-125)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  outlet_id?: number;
}
