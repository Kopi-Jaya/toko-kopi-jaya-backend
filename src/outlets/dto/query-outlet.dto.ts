import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { OutletStatus } from '../../common/enums';

export class QueryOutletDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by outlet status', enum: OutletStatus })
  @IsOptional()
  @IsEnum(OutletStatus)
  status?: OutletStatus;

  @ApiPropertyOptional({ description: 'Latitude for distance sorting' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for distance sorting' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;
}
