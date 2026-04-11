import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OutletStatus } from '../../common/enums';

export class CreateOutletDto {
  @ApiProperty({ description: 'Outlet name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Outlet address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Outlet status', enum: OutletStatus })
  @IsOptional()
  @IsEnum(OutletStatus)
  status?: OutletStatus;
}
