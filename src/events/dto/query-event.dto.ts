import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryEventDto {
  @ApiPropertyOptional({ description: 'Filter by outlet — also returns global (outlet_id IS NULL) events' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  outlet_id?: number;

  @ApiPropertyOptional({ description: 'Filter by is_active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Only return ongoing events (end_date >= today)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  upcoming?: boolean;
}
