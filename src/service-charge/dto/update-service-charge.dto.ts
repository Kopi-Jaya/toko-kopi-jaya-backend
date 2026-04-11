import { PartialType } from '@nestjs/swagger';
import { CreateServiceChargeDto } from './create-service-charge.dto';

export class UpdateServiceChargeDto extends PartialType(CreateServiceChargeDto) {}
