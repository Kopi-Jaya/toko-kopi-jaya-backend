import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { OutletProductsService } from './outlet-products.service';
import { ActivateOutletProductDto } from './dto/activate-outlet-product.dto';
import { BulkActivateDto } from './dto/bulk-activate.dto';

@ApiTags('outlet-products')
@ApiBearerAuth()
@Controller('outlets/:outletId/products')
export class OutletProductsController {
  constructor(private readonly service: OutletProductsService) {}

  /// Public: customers (mobile app) read this to see the per-outlet menu.
  @Public()
  @Get()
  @ApiOperation({
    summary: "List an outlet's active products + price overrides",
  })
  @ApiResponse({ status: 200, description: 'Products returned successfully' })
  findByOutlet(@Param('outletId', ParseIntPipe) outletId: number) {
    return this.service.findByOutlet(outletId);
  }

  /// Activate a product at the outlet, or update its override/availability.
  /// Outlet admin scopes to their own outlet; super_admin can target any.
  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Post(':productId')
  @ApiOperation({
    summary: 'Activate / upsert a product at an outlet',
  })
  @ApiResponse({ status: 201, description: 'Activation upserted' })
  activate(
    @Param('outletId', ParseIntPipe) outletId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: ActivateOutletProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.activate(
      outletId,
      productId,
      {
        price_override: dto.price_override,
        is_available: dto.is_available,
      },
      user.scopedOutletId,
    );
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Patch(':productId')
  @ApiOperation({ summary: 'Update price override or availability' })
  @ApiResponse({ status: 200, description: 'Activation updated' })
  update(
    @Param('outletId', ParseIntPipe) outletId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: ActivateOutletProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.activate(
      outletId,
      productId,
      {
        price_override: dto.price_override,
        is_available: dto.is_available,
      },
      user.scopedOutletId,
    );
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a product at this outlet' })
  @ApiResponse({ status: 204, description: 'Deactivated' })
  deactivate(
    @Param('outletId', ParseIntPipe) outletId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.deactivate(outletId, productId, user.scopedOutletId);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Post('bulk-activate')
  @ApiOperation({
    summary: 'Bulk-activate a list of products at an outlet',
  })
  @ApiResponse({ status: 201, description: 'Bulk activation completed' })
  bulkActivate(
    @Param('outletId', ParseIntPipe) outletId: number,
    @Body() dto: BulkActivateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.bulkActivate(
      outletId,
      dto.product_ids,
      user.scopedOutletId,
    );
  }
}
