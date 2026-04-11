import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StaffLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
