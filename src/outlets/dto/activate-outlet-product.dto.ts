import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class ActivateOutletProductDto {
  @ApiProperty({
    description:
      'Per-outlet price override. Leave null to fall back to products.base_price.',
    required: false,
    nullable: true,
    example: 27000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price_override?: number | null;

  @ApiProperty({
    description: 'Whether the product is currently sold at this outlet.',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}
