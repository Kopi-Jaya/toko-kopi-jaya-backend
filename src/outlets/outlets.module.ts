import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outlet } from './entities/outlet.entity';
import { OutletProduct } from './entities/outlet-product.entity';
import { Product } from '../products/entities/product.entity';
import { OutletsController } from './outlets.controller';
import { OutletsService } from './outlets.service';
import { OutletProductsController } from './outlet-products.controller';
import { OutletProductsService } from './outlet-products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Outlet, OutletProduct, Product])],
  controllers: [OutletsController, OutletProductsController],
  providers: [OutletsService, OutletProductsService],
  exports: [OutletsService, OutletProductsService],
})
export class OutletsModule {}
