import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'davis@example.com',
    description: 'Email for members, username for staff/admin',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @MinLength(6)
  password: string;
}
