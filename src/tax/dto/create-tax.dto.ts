import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ChargeType } from '../../common/enums';

export class CreateTaxDto {
  @ApiProperty({ description: 'Tax name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tax type', enum: ChargeType })
  @IsEnum(ChargeType)
  type: ChargeType;

  @ApiProperty({ description: 'Tax value' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Whether tax is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
