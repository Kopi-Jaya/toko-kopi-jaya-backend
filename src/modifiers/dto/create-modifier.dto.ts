import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ModifierType } from '../../common/enums';

export class CreateModifierDto {
  @ApiProperty({ description: 'Modifier name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Extra price for modifier', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_price?: number = 0;

  @ApiProperty({ description: 'Modifier type', enum: ModifierType })
  @IsEnum(ModifierType)
  type: ModifierType;

  @ApiPropertyOptional({ description: 'Whether modifier is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
