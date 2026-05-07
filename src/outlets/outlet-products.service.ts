import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OutletProduct } from './entities/outlet-product.entity';
import { Outlet } from './entities/outlet.entity';
import { Product } from '../products/entities/product.entity';

/// Per-outlet product activation + price-override service (M-125).
///
/// All mutations enforce a `scopedOutletId` argument:
///   - `null` → caller is super_admin (cross-outlet); allowed any outlet
///   - number → caller is an outlet operator; outlet_id MUST match
///
/// Service throws ForbiddenException on scope mismatch — guards above
/// don't have to know about outlet identity, services do.
@Injectable()
export class OutletProductsService {
  constructor(
    @InjectRepository(OutletProduct)
    private readonly repo: Repository<OutletProduct>,
    @InjectRepository(Outlet)
    private readonly outletRepo: Repository<Outlet>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private assertScope(outletId: number, scopedOutletId: number | null): void {
    if (scopedOutletId !== null && scopedOutletId !== outletId) {
      throw new ForbiddenException(
        `You don't have access to outlet ${outletId}`,
      );
    }
  }

  /// All product activations for one outlet (joined with the master product
  /// row so the caller has price + name + image in one shot).
  async findByOutlet(outletId: number) {
    const outlet = await this.outletRepo.findOne({
      where: { outlet_id: outletId },
    });
    if (!outlet) throw new NotFoundException(`Outlet ${outletId} not found`);

    const rows = await this.repo
      .createQueryBuilder('op')
      .leftJoinAndSelect('op.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('op.outlet_id = :outletId', { outletId })
      .getMany();

    return rows.map((op) => ({
      outlet_product_id: op.outlet_product_id,
      outlet_id: op.outlet_id,
      product_id: op.product_id,
      product: op.product,
      price_override: op.price_override,
      effective_price: op.price_override ?? op.product?.base_price ?? null,
      is_available: op.is_available,
    }));
  }

  /// Activate (or re-activate) a product at an outlet. Idempotent — re-uses
  /// the soft-deleted row if one exists. Returns the upserted activation.
  async activate(
    outletId: number,
    productId: number,
    payload: { price_override?: number | null; is_available?: boolean },
    scopedOutletId: number | null,
  ) {
    this.assertScope(outletId, scopedOutletId);

    const outlet = await this.outletRepo.findOne({
      where: { outlet_id: outletId },
    });
    if (!outlet) throw new NotFoundException(`Outlet ${outletId} not found`);

    const product = await this.productRepo.findOne({
      where: { product_id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    let row = await this.repo.findOne({
      where: { outlet_id: outletId, product_id: productId },
      withDeleted: true,
    });

    if (row) {
      row.deleted_at = null;
      if (payload.price_override !== undefined) {
        row.price_override = payload.price_override;
      }
      if (payload.is_available !== undefined) {
        row.is_available = payload.is_available;
      }
    } else {
      row = this.repo.create({
        outlet_id: outletId,
        product_id: productId,
        price_override: payload.price_override ?? null,
        is_available: payload.is_available ?? true,
      });
    }

    return this.repo.save(row);
  }

  /// Soft-deactivate (soft-delete) a product at an outlet. Master product
  /// catalog is untouched. Other outlets unaffected.
  async deactivate(
    outletId: number,
    productId: number,
    scopedOutletId: number | null,
  ) {
    this.assertScope(outletId, scopedOutletId);

    const row = await this.repo.findOne({
      where: { outlet_id: outletId, product_id: productId },
    });
    if (!row) {
      throw new NotFoundException(
        `Product ${productId} is not active at outlet ${outletId}`,
      );
    }
    await this.repo.softRemove(row);
  }

  /// Bulk activate a list of product IDs at an outlet (e.g. when
  /// onboarding a new outlet from the catalog). Skips already-active
  /// products. Soft-deleted rows are revived.
  async bulkActivate(
    outletId: number,
    productIds: number[],
    scopedOutletId: number | null,
  ) {
    this.assertScope(outletId, scopedOutletId);
    if (productIds.length === 0) return [];

    const products = await this.productRepo.find({
      where: { product_id: In(productIds) },
    });
    const valid = new Set(products.map((p) => p.product_id));
    const filtered = productIds.filter((id) => valid.has(id));

    const results: OutletProduct[] = [];
    for (const id of filtered) {
      results.push(await this.activate(outletId, id, {}, scopedOutletId));
    }
    return results;
  }
}
