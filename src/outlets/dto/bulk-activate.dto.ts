import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator';

export class BulkActivateDto {
  @ApiProperty({
    description: 'Product IDs to activate (or revive) at this outlet.',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  product_ids: number[];
}
