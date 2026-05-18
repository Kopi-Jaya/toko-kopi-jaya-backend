import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'Outlet ID that owns this favorite' })
  @IsNumber()
  outlet_id: number;

  @ApiProperty({ description: 'Product ID to add as favorite' })
  @IsNumber()
  product_id: number;
}
