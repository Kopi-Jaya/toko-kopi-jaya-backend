import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ModifierSelectionType, ModifierType } from '../../common/enums';

export class CreateModifierDto {
  @ApiProperty({ description: 'Modifier name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Group label for related modifiers (e.g. "Ukuran", "Susu")', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  group_name?: string | null;

  @ApiPropertyOptional({ description: 'Whether the customer picks one or many from this group', enum: ModifierSelectionType, default: ModifierSelectionType.SINGLE })
  @IsOptional()
  @IsEnum(ModifierSelectionType)
  selection_type?: ModifierSelectionType;

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
