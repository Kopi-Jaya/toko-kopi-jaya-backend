import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { StaffRole } from '../../common/enums';

export class CreateStaffDto {
  @ApiProperty({ description: 'Staff name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Staff phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiProperty({ description: 'Staff role', enum: StaffRole })
  @IsEnum(StaffRole)
  role: StaffRole;

  @ApiProperty({ description: 'Username', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: 'Password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Outlet ID' })
  @IsOptional()
  @IsNumber()
  outlet_id?: number;

  @ApiPropertyOptional({ description: 'Whether staff is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
