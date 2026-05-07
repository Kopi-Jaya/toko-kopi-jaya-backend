import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StaffRole } from '../../common/enums';

export class QueryStaffDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by role', enum: StaffRole })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @ApiPropertyOptional({ description: 'Filter by outlet (M-125)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  outlet_id?: number;

  @ApiPropertyOptional({ description: 'Filter by active flag' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
