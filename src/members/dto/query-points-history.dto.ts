import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PointsTransactionType } from '../../common/enums';

export class QueryPointsHistoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: PointsTransactionType })
  @IsOptional()
  @IsEnum(PointsTransactionType)
  transaction_type?: PointsTransactionType;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
