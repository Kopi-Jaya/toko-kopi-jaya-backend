import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @ApiPropertyOptional({ description: 'Outlet ID — omit or null for global events' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  outlet_id?: number;

  @ApiProperty({ description: 'Event title', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Full event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Short label chip, e.g. TERBATAS', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ description: 'Whether event is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
