import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ChargeType } from '../../common/enums';

export class CreateServiceChargeDto {
  @ApiProperty({ description: 'Service charge name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Charge type', enum: ChargeType })
  @IsEnum(ChargeType)
  type: ChargeType;

  @ApiProperty({ description: 'Charge value' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Whether service charge is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
