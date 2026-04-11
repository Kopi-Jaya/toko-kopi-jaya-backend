import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reedem } from './entities/reedem.entity';
import { Member } from '../members/entities/member.entity';
import { PointsHistory } from '../members/entities/points-history.entity';
import { RedeemController } from './redeem.controller';
import { RedeemService } from './redeem.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reedem, Member, PointsHistory])],
  controllers: [RedeemController],
  providers: [RedeemService],
  exports: [RedeemService],
})
export class RedeemModule {}
