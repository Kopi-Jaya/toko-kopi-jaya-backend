import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AssignProductModifierDto {
  @ApiProperty({ description: 'Modifier ID to assign to this product' })
  @IsNumber()
  modifier_id: number;
}
