import { PartialType } from '@nestjs/swagger';
import { CreateRedeemDto } from './create-redeem.dto';

export class UpdateRedeemDto extends PartialType(CreateRedeemDto) {}
