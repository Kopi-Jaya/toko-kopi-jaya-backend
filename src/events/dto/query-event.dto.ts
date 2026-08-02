import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

// BUG-2026-014: the admin frontend's `useApiList` hook always sends
// `page`/`limit` on every list request. This DTO didn't declare them, and the
// app has `forbidNonWhitelisted` validation, so every load of the admin
// Events & Promos page 400'd and silently rendered "No data found" — even
// though real events existed (`GET /events` with no query worked fine, which
// is why the mobile app, which never sends pagination params, was unaffected).
export class QueryEventDto extends PaginationQueryDto {
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
