import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './common/config/database.config';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ModifiersModule } from './modifiers/modifiers.module';
import { OutletsModule } from './outlets/outlets.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { RedeemModule } from './redeem/redeem.module';
import { MembersModule } from './members/members.module';
import { CustomersModule } from './customers/customers.module';
import { FavoritesModule } from './favorites/favorites.module';
import { StaffModule } from './staff/staff.module';
import { DiscountsModule } from './discounts/discounts.module';
import { TaxModule } from './tax/tax.module';
import { ServiceChargeModule } from './service-charge/service-charge.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    ModifiersModule,
    OutletsModule,
    OrdersModule,
    PaymentModule,
    LoyaltyModule,
    RedeemModule,
    MembersModule,
    CustomersModule,
    FavoritesModule,
    StaffModule,
    DiscountsModule,
    TaxModule,
    ServiceChargeModule,
    ShiftsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
