import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { Product } from '../products/entities/product.entity';
import { Modifier } from '../modifiers/entities/modifier.entity';
import { Outlet } from '../outlets/entities/outlet.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { Tax } from '../tax/entities/tax.entity';
import { ServiceCharge } from '../service-charge/entities/service-charge.entity';
import { Member } from '../members/entities/member.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderItemModifier,
      Product,
      Modifier,
      Outlet,
      Discount,
      Tax,
      ServiceCharge,
      Member,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    CustomersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
