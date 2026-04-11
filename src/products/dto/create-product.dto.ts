import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Category ID' })
  @IsNumber()
  category_id: number;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Base price', minimum: 0 })
  @IsNumber()
  @Min(0)
  base_price: number;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  img_url?: string;

  @ApiPropertyOptional({ description: 'Points earned per purchase', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  earning_points?: number = 0;

  @ApiPropertyOptional({ description: 'Whether product is available', default: true })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean = true;
}
