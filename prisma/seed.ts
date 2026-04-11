/**
 * Prisma Seed Script — Toko Kopi Jaya
 * Seeds all 18 tables with realistic data for development/demo.
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// bcrypt hash of "password" (cost=10)
async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function main() {
  console.log('🌱 Seeding Toko Kopi Jaya database...\n');

  // ─── 1. CATEGORIES ────────────────────────────────────────────────────────
  console.log('📁 Seeding categories...');
  // Pre-hash all passwords upfront (cost=10 for dev speed)
  const DEFAULT_PASSWORD = await hash('password');

  const [catHot, catCold, catFood, catMerch] = await Promise.all([
    prisma.categories.upsert({
      where: { category_id: 1n },
      update: {},
      create: { name: 'Minuman Panas', description: 'Kopi dan minuman panas lainnya' },
    }),
    prisma.categories.upsert({
      where: { category_id: 2n },
      update: {},
      create: { name: 'Minuman Dingin', description: 'Es kopi dan minuman dingin' },
    }),
    prisma.categories.upsert({
      where: { category_id: 3n },
      update: {},
      create: { name: 'Makanan', description: 'Snack dan makanan ringan' },
    }),
    prisma.categories.upsert({
      where: { category_id: 4n },
      update: {},
      create: { name: 'Merchandise', description: 'Produk branded Toko Kopi Jaya', is_active: true },
    }),
  ]);
  console.log('  ✓ 4 categories');

  // ─── 2. OUTLETS ───────────────────────────────────────────────────────────
  console.log('🏪 Seeding outlets...');
  const [outletMatos, outletDinoyo] = await Promise.all([
    prisma.outlet.upsert({
      where: { outlet_id: 1n },
      update: {},
      create: {
        name: 'Toko Kopi Jaya - Malang Town Square',
        address: 'Jl. Veteran No.2, Penanggungan, Kec. Klojen, Kota Malang, Jawa Timur 65113',
        latitude: -7.9666200,
        longitude: 112.6326300,
        phone: '0341-551234',
        status: 'active',
      },
    }),
    prisma.outlet.upsert({
      where: { outlet_id: 2n },
      update: {},
      create: {
        name: 'Toko Kopi Jaya - Dinoyo',
        address: 'Jl. MT. Haryono No.167, Dinoyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144',
        latitude: -7.9432100,
        longitude: 112.6143500,
        phone: '0341-556789',
        status: 'active',
      },
    }),
  ]);
  console.log('  ✓ 2 outlets');

  // ─── 3. TAX ───────────────────────────────────────────────────────────────
  console.log('💰 Seeding tax...');
  const [taxPPN] = await Promise.all([
    prisma.tax.upsert({
      where: { tax_id: 1n },
      update: {},
      create: { name: 'PPN 11%', type: 'percentage', value: 11.00, is_active: true },
    }),
  ]);
  console.log('  ✓ 1 tax record');

  // ─── 4. SERVICE CHARGE ────────────────────────────────────────────────────
  console.log('🧾 Seeding service charges...');
  const [scService] = await Promise.all([
    prisma.service_charge.upsert({
      where: { service_charge_id: 1n },
      update: {},
      create: { name: 'Service Charge 5%', type: 'percentage', value: 5.00, is_active: true },
    }),
  ]);
  console.log('  ✓ 1 service charge record');

  // ─── 5. DISCOUNTS ─────────────────────────────────────────────────────────
  console.log('🏷️  Seeding discounts...');
  const [discWelcome, discWeekend, discLoyal] = await Promise.all([
    prisma.discount.upsert({
      where: { discount_id: 1n },
      update: {},
      create: {
        name: 'Welcome Bonus',
        code: 'WELCOME10',
        type: 'percentage',
        value: 10.00,
        min_purchase: 0.00,
        max_discount: 20000.00,
        usage_limit: 1000,
        usage_count: 0,
        valid_from: new Date('2026-01-01'),
        valid_until: new Date('2026-12-31'),
        is_active: true,
      },
    }),
    prisma.discount.upsert({
      where: { discount_id: 2n },
      update: {},
      create: {
        name: 'Weekend Promo',
        code: 'WEEKEND10',
        type: 'percentage',
        value: 10.00,
        min_purchase: 50000.00,
        max_discount: 15000.00,
        usage_limit: null,
        usage_count: 0,
        valid_from: new Date('2026-01-01'),
        valid_until: new Date('2026-12-31'),
        is_active: true,
      },
    }),
    prisma.discount.upsert({
      where: { discount_id: 3n },
      update: {},
      create: {
        name: 'Loyal Member 50K',
        code: 'LOYAL50K',
        type: 'nominal',
        value: 50000.00,
        min_purchase: 200000.00,
        max_discount: null,
        usage_limit: null,
        usage_count: 0,
        valid_from: new Date('2026-01-01'),
        valid_until: new Date('2026-12-31'),
        is_active: true,
      },
    }),
  ]);
  console.log('  ✓ 3 discounts');

  // ─── 6. MODIFIERS ─────────────────────────────────────────────────────────
  console.log('✏️  Seeding modifiers...');
  await Promise.all([
    prisma.modifier.upsert({
      where: { modifier_id: 1n },
      update: {},
      create: { name: 'Extra Shot', extra_price: 5000.00, type: 'add', is_active: true },
    }),
    prisma.modifier.upsert({
      where: { modifier_id: 2n },
      update: {},
      create: { name: 'No Sugar', extra_price: 0.00, type: 'remove', is_active: true },
    }),
    prisma.modifier.upsert({
      where: { modifier_id: 3n },
      update: {},
      create: { name: 'Oat Milk', extra_price: 8000.00, type: 'add', is_active: true },
    }),
    prisma.modifier.upsert({
      where: { modifier_id: 4n },
      update: {},
      create: { name: 'Large Size', extra_price: 5000.00, type: 'add', is_active: true },
    }),
    prisma.modifier.upsert({
      where: { modifier_id: 5n },
      update: {},
      create: { name: 'No Ice', extra_price: 0.00, type: 'remove', is_active: true },
    }),
  ]);
  console.log('  ✓ 5 modifiers');

  // ─── 7. PRODUCTS ──────────────────────────────────────────────────────────
  console.log('☕ Seeding products...');
  const [
    prodSignature, prodCappuccino, prodAmericano,
    prodKopiSusu, prodMatcha,
    prodCroissant, prodNasiGoreng,
    prodToteBag,
  ] = await Promise.all([
    prisma.products.upsert({
      where: { product_id: 1n },
      update: {},
      create: {
        category_id: catHot.category_id,
        name: 'Kopi Jaya Signature',
        description: 'Espresso blend khas Toko Kopi Jaya dengan sentuhan rempah lokal',
        base_price: 35000.00,
        earning_points: 25,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 2n },
      update: {},
      create: {
        category_id: catHot.category_id,
        name: 'Cappuccino',
        description: 'Espresso dengan steamed milk dan foam tebal',
        base_price: 32000.00,
        earning_points: 20,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 3n },
      update: {},
      create: {
        category_id: catHot.category_id,
        name: 'Americano',
        description: 'Espresso dengan air panas, bold dan klasik',
        base_price: 28000.00,
        earning_points: 15,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 4n },
      update: {},
      create: {
        category_id: catCold.category_id,
        name: 'Kopi Susu Iced',
        description: 'Kopi susu dingin dengan es batu segar, favorit pelanggan',
        base_price: 30000.00,
        earning_points: 20,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 5n },
      update: {},
      create: {
        category_id: catCold.category_id,
        name: 'Matcha Latte Iced',
        description: 'Matcha Jepang premium dengan susu segar dan es',
        base_price: 38000.00,
        earning_points: 30,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 6n },
      update: {},
      create: {
        category_id: catFood.category_id,
        name: 'Croissant Butter',
        description: 'Croissant renyah dengan mentega premium impor',
        base_price: 25000.00,
        earning_points: 10,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 7n },
      update: {},
      create: {
        category_id: catFood.category_id,
        name: 'Sandwich Tuna',
        description: 'Sandwich tuna mayo dengan roti whole wheat',
        base_price: 35000.00,
        earning_points: 15,
        is_available: true,
      },
    }),
    prisma.products.upsert({
      where: { product_id: 8n },
      update: {},
      create: {
        category_id: catMerch.category_id,
        name: 'Tote Bag Toko Kopi Jaya',
        description: 'Tote bag kanvas premium branded Toko Kopi Jaya',
        base_price: 85000.00,
        earning_points: 50,
        is_available: true,
      },
    }),
  ]);
  console.log('  ✓ 8 products');

  // ─── 8. REDEEM CATALOG ────────────────────────────────────────────────────
  console.log('🎁 Seeding redeem catalog...');
  await Promise.all([
    prisma.reedem.upsert({
      where: { reedem_id: 1n },
      update: {},
      create: {
        product_id: prodSignature.product_id,
        point_cost: 100,
        is_active: true,
        stock_limit: null,
        redemption_count: 0,
      },
    }),
    prisma.reedem.upsert({
      where: { reedem_id: 2n },
      update: {},
      create: {
        product_id: prodCappuccino.product_id,
        point_cost: 80,
        is_active: true,
        stock_limit: null,
        redemption_count: 0,
      },
    }),
    prisma.reedem.upsert({
      where: { reedem_id: 3n },
      update: {},
      create: {
        product_id: prodCroissant.product_id,
        point_cost: 50,
        is_active: true,
        stock_limit: 50,
        redemption_count: 0,
      },
    }),
  ]);
  console.log('  ✓ 3 redeem items');

  // ─── 9. STAFF ─────────────────────────────────────────────────────────────
  console.log('👤 Seeding staff...');
  const [staffAdmin, staffCashier, staffManager, staffBarista] = await Promise.all([
    prisma.staff.upsert({
      where: { username: 'admin' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Administrator',
        role: 'admin',
        username: 'admin',
        password: DEFAULT_PASSWORD,
        outlet_id: outletMatos.outlet_id,
        is_active: true,
      },
    }),
    prisma.staff.upsert({
      where: { username: 'cashier01' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Andi Prasetyo',
        role: 'cashier',
        username: 'cashier01',
        password: DEFAULT_PASSWORD,
        outlet_id: outletMatos.outlet_id,
        is_active: true,
      },
    }),
    prisma.staff.upsert({
      where: { username: 'manager01' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Siti Rahayu',
        role: 'manager',
        username: 'manager01',
        password: DEFAULT_PASSWORD,
        outlet_id: outletMatos.outlet_id,
        is_active: true,
      },
    }),
    prisma.staff.upsert({
      where: { username: 'barista01' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Reza Firmansyah',
        role: 'barista',
        username: 'barista01',
        password: DEFAULT_PASSWORD,
        outlet_id: outletDinoyo.outlet_id,
        is_active: true,
      },
    }),
  ]);
  console.log('  ✓ 4 staff accounts (all password: "password")');

  // ─── 10. MEMBERS ──────────────────────────────────────────────────────────
  console.log('🧑‍💼 Seeding members...');
  const [memberDavis, memberBudi, memberCitra] = await Promise.all([
    prisma.member.upsert({
      where: { email: 'davis@example.com' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Davis Hermanto',
        email: 'davis@example.com',
        phone_number: '081234567890',
        birthday: new Date('2000-06-15'),
        fav_menu: 'Kopi Jaya Signature',
        password: DEFAULT_PASSWORD,
        current_points: 150,
        lifetime_points_earned: 350,
        tier: 'Silver',
        is_active: true,
      },
    }),
    prisma.member.upsert({
      where: { email: 'budi@example.com' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        phone_number: '082345678901',
        birthday: new Date('1995-03-22'),
        fav_menu: 'Kopi Susu Iced',
        password: DEFAULT_PASSWORD,
        current_points: 50,
        lifetime_points_earned: 50,
        tier: 'Bronze',
        is_active: true,
      },
    }),
    prisma.member.upsert({
      where: { email: 'citra@example.com' },
      update: { password: DEFAULT_PASSWORD },
      create: {
        name: 'Citra Lestari',
        email: 'citra@example.com',
        phone_number: '083456789012',
        birthday: new Date('1998-11-07'),
        fav_menu: 'Matcha Latte Iced',
        password: DEFAULT_PASSWORD,
        current_points: 1200,
        lifetime_points_earned: 1500,
        tier: 'Gold',
        is_active: true,
      },
    }),
  ]);
  console.log('  ✓ 3 members (Bronze/Silver/Gold)');

  // ─── 11. CUSTOMERS (anonymous) ────────────────────────────────────────────
  console.log('🚶 Seeding anonymous customers...');
  const [custAnon1, custAnon2] = await Promise.all([
    prisma.customer.upsert({
      where: { customer_id: 1n },
      update: {},
      create: { name: 'Pelanggan Umum', phone_number: null },
    }),
    prisma.customer.upsert({
      where: { customer_id: 2n },
      update: {},
      create: { name: 'Walk-in Customer', phone_number: '089876543210' },
    }),
  ]);
  console.log('  ✓ 2 anonymous customers');

  // ─── 12. SHIFTS ───────────────────────────────────────────────────────────
  console.log('🕐 Seeding shifts...');
  const [shift1, shift2] = await Promise.all([
    prisma.shift.upsert({
      where: { shift_id: 1n },
      update: {},
      create: {
        staff_id: staffCashier.staff_id,
        outlet_id: outletMatos.outlet_id,
        start_time: new Date('2026-04-05T08:00:00'),
        end_time: new Date('2026-04-05T16:00:00'),
        cash_in_hand: 500000.00,
        total_cash_received: 850000.00,
        total_cash_out: 0.00,
        final_cash: 1350000.00,
      },
    }),
    prisma.shift.upsert({
      where: { shift_id: 2n },
      update: {},
      create: {
        staff_id: staffBarista.staff_id,
        outlet_id: outletDinoyo.outlet_id,
        start_time: new Date('2026-04-05T09:00:00'),
        end_time: null,
        cash_in_hand: 300000.00,
        total_cash_received: 0.00,
        total_cash_out: 0.00,
        final_cash: 300000.00,
      },
    }),
  ]);
  console.log('  ✓ 2 shifts');

  // ─── 13. ORDERS ───────────────────────────────────────────────────────────
  // Note: We INSERT with final statuses directly (bypass the AFTER UPDATE trigger)
  // Points history is seeded manually below.
  console.log('🛒 Seeding orders...');
  const [order1, order2, order3, order4] = await Promise.all([
    // Order 1: Member Davis — completed — Mobile App
    prisma.orders.upsert({
      where: { order_id: 1n },
      update: {},
      create: {
        member_id: memberDavis.member_id,
        staff_id: staffCashier.staff_id,
        outlet_id: outletMatos.outlet_id,
        source: 'Mobile_App',
        order_type: 'click_collect',
        status: 'completed',
        pickup_code: 'PICK001',
        subtotal: 67000.00,
        tax_id: taxPPN.tax_id,
        discount_amount: 0.00,
        total_final: 74370.00,
        points_earned: 45,
        created_at: new Date('2026-04-04T10:15:00'),
        paid_at: new Date('2026-04-04T10:16:00'),
        ready_at: new Date('2026-04-04T10:25:00'),
        completed_at: new Date('2026-04-04T10:30:00'),
      },
    }),
    // Order 2: Member Citra — completed — POS In-Store
    prisma.orders.upsert({
      where: { order_id: 2n },
      update: {},
      create: {
        member_id: memberCitra.member_id,
        staff_id: staffCashier.staff_id,
        outlet_id: outletMatos.outlet_id,
        source: 'POS_In_Store',
        order_type: 'dine_in',
        table_number: 'A3',
        status: 'completed',
        subtotal: 68000.00,
        tax_id: taxPPN.tax_id,
        service_charge_id: scService.service_charge_id,
        discount_id: discWelcome.discount_id,
        discount_amount: 6800.00,
        total_final: 73882.00,
        points_earned: 50,
        created_at: new Date('2026-04-04T14:00:00'),
        paid_at: new Date('2026-04-04T14:05:00'),
        ready_at: new Date('2026-04-04T14:20:00'),
        completed_at: new Date('2026-04-04T14:35:00'),
      },
    }),
    // Order 3: Anonymous customer — paid (preparing) — POS In-Store
    prisma.orders.upsert({
      where: { order_id: 3n },
      update: {},
      create: {
        customer_id: custAnon1.customer_id,
        staff_id: staffCashier.staff_id,
        outlet_id: outletMatos.outlet_id,
        source: 'POS_In_Store',
        order_type: 'takeaway',
        status: 'preparing',
        subtotal: 30000.00,
        tax_id: taxPPN.tax_id,
        discount_amount: 0.00,
        total_final: 33300.00,
        points_earned: 0,
        created_at: new Date('2026-04-05T09:10:00'),
        paid_at: new Date('2026-04-05T09:11:00'),
      },
    }),
    // Order 4: Member Budi — pending — Mobile App
    prisma.orders.upsert({
      where: { order_id: 4n },
      update: {},
      create: {
        member_id: memberBudi.member_id,
        staff_id: staffCashier.staff_id,
        outlet_id: outletMatos.outlet_id,
        source: 'Mobile_App',
        order_type: 'click_collect',
        status: 'pending',
        pickup_code: 'PICK004',
        subtotal: 73000.00,
        tax_id: taxPPN.tax_id,
        discount_amount: 0.00,
        total_final: 81030.00,
        points_earned: 0,
        created_at: new Date('2026-04-05T09:30:00'),
      },
    }),
  ]);
  console.log('  ✓ 4 orders');

  // ─── 14. ORDER ITEMS ──────────────────────────────────────────────────────
  // Note: points_earned_per_item is normally set by trigger (trg_set_earning_points_on_order_item)
  // but since we're seeding directly, we set it manually.
  console.log('📋 Seeding order items...');
  await Promise.all([
    // Order 1: Kopi Jaya Signature + Croissant
    prisma.order_items.upsert({
      where: { order_item_id: 1n },
      update: {},
      create: {
        order_id: order1.order_id,
        product_id: prodSignature.product_id,
        quantity: 1,
        price_at_purchase: 35000.00,
        points_earned_per_item: 25,
      },
    }),
    prisma.order_items.upsert({
      where: { order_item_id: 2n },
      update: {},
      create: {
        order_id: order1.order_id,
        product_id: prodCroissant.product_id,
        quantity: 2,
        price_at_purchase: 25000.00,
        points_earned_per_item: 10,
      },
    }),
    // Order 2: Matcha Latte + Cappuccino
    prisma.order_items.upsert({
      where: { order_item_id: 3n },
      update: {},
      create: {
        order_id: order2.order_id,
        product_id: prodMatcha.product_id,
        quantity: 1,
        price_at_purchase: 38000.00,
        points_earned_per_item: 30,
      },
    }),
    prisma.order_items.upsert({
      where: { order_item_id: 4n },
      update: {},
      create: {
        order_id: order2.order_id,
        product_id: prodCappuccino.product_id,
        quantity: 1,
        price_at_purchase: 32000.00,
        points_earned_per_item: 20,
      },
    }),
    // Order 3: Kopi Susu Iced
    prisma.order_items.upsert({
      where: { order_item_id: 5n },
      update: {},
      create: {
        order_id: order3.order_id,
        product_id: prodKopiSusu.product_id,
        quantity: 1,
        price_at_purchase: 30000.00,
        points_earned_per_item: 0,
      },
    }),
    // Order 4: Americano + Sandwich Tuna
    prisma.order_items.upsert({
      where: { order_item_id: 6n },
      update: {},
      create: {
        order_id: order4.order_id,
        product_id: prodAmericano.product_id,
        quantity: 2,
        price_at_purchase: 28000.00,
        points_earned_per_item: 15,
      },
    }),
    prisma.order_items.upsert({
      where: { order_item_id: 7n },
      update: {},
      create: {
        order_id: order4.order_id,
        product_id: prodNasiGoreng.product_id,
        quantity: 1,
        price_at_purchase: 35000.00,
        points_earned_per_item: 15,
      },
    }),
  ]);
  console.log('  ✓ 7 order items');

  // ─── 15. ORDER ITEM MODIFIERS ─────────────────────────────────────────────
  console.log('🔧 Seeding order item modifiers...');
  await Promise.all([
    // Order 1, item 1 (Signature): Extra Shot
    prisma.order_item_modifier.upsert({
      where: { order_item_modifier_id: 1n },
      update: {},
      create: {
        order_item_id: 1n,
        modifier_id: 1n,
        price_added: 5000.00,
      },
    }),
    // Order 2, item 3 (Matcha): Oat Milk + No Ice
    prisma.order_item_modifier.upsert({
      where: { order_item_modifier_id: 2n },
      update: {},
      create: {
        order_item_id: 3n,
        modifier_id: 3n,
        price_added: 8000.00,
      },
    }),
    prisma.order_item_modifier.upsert({
      where: { order_item_modifier_id: 3n },
      update: {},
      create: {
        order_item_id: 3n,
        modifier_id: 5n,
        price_added: 0.00,
      },
    }),
    // Order 2, item 4 (Cappuccino): No Sugar
    prisma.order_item_modifier.upsert({
      where: { order_item_modifier_id: 4n },
      update: {},
      create: {
        order_item_id: 4n,
        modifier_id: 2n,
        price_added: 0.00,
      },
    }),
  ]);
  console.log('  ✓ 4 order item modifiers');

  // ─── 16. PAYMENTS ─────────────────────────────────────────────────────────
  console.log('💳 Seeding payments...');
  await Promise.all([
    prisma.payment.upsert({
      where: { payment_id: 1n },
      update: {},
      create: {
        order_id: order1.order_id,
        payment_method: 'GoPay',
        payment_gateway: 'midtrans',
        transaction_id: 'TXN-ORDER1-20260404',
        status: 'success',
        amount: 74370.00,
        paid_at: new Date('2026-04-04T10:16:00'),
        expired_at: new Date('2026-04-04T11:16:00'),
      },
    }),
    prisma.payment.upsert({
      where: { payment_id: 2n },
      update: {},
      create: {
        order_id: order2.order_id,
        payment_method: 'Cash',
        payment_gateway: null,
        transaction_id: 'TXN-ORDER2-20260404',
        status: 'success',
        amount: 73882.00,
        paid_at: new Date('2026-04-04T14:05:00'),
      },
    }),
    prisma.payment.upsert({
      where: { payment_id: 3n },
      update: {},
      create: {
        order_id: order3.order_id,
        payment_method: 'QRIS',
        payment_gateway: 'xendit',
        transaction_id: 'TXN-ORDER3-20260405',
        status: 'success',
        amount: 33300.00,
        paid_at: new Date('2026-04-05T09:11:00'),
        expired_at: new Date('2026-04-05T10:11:00'),
      },
    }),
    prisma.payment.upsert({
      where: { payment_id: 4n },
      update: {},
      create: {
        order_id: order4.order_id,
        payment_method: 'GoPay',
        payment_gateway: 'midtrans',
        transaction_id: 'TXN-ORDER4-20260405',
        status: 'pending',
        amount: 81030.00,
        expired_at: new Date('2026-04-05T10:30:00'),
      },
    }),
  ]);
  console.log('  ✓ 4 payment records');

  // ─── 17. POINTS HISTORY ───────────────────────────────────────────────────
  console.log('🏆 Seeding points history...');
  await Promise.all([
    // Davis: earned from order 1
    prisma.points_history.upsert({
      where: { points_history_id: 1n },
      update: {},
      create: {
        member_id: memberDavis.member_id,
        order_id: order1.order_id,
        points_change: 45,
        transaction_type: 'earned',
        description: 'Poin dari pembelian Order #1',
        balance_before: 105,
        balance_after: 150,
        created_by: staffCashier.staff_id,
        created_at: new Date('2026-04-04T10:16:00'),
      },
    }),
    // Citra: earned from order 2
    prisma.points_history.upsert({
      where: { points_history_id: 2n },
      update: {},
      create: {
        member_id: memberCitra.member_id,
        order_id: order2.order_id,
        points_change: 50,
        transaction_type: 'earned',
        description: 'Poin dari pembelian Order #2',
        balance_before: 1150,
        balance_after: 1200,
        created_by: staffCashier.staff_id,
        created_at: new Date('2026-04-04T14:05:00'),
      },
    }),
    // Citra: bonus adjustment
    prisma.points_history.upsert({
      where: { points_history_id: 3n },
      update: {},
      create: {
        member_id: memberCitra.member_id,
        order_id: null,
        points_change: 100,
        transaction_type: 'bonus',
        description: 'Bonus ulang tahun pelanggan',
        balance_before: 1100,
        balance_after: 1150,
        created_by: staffAdmin.staff_id,
        created_at: new Date('2026-03-15T10:00:00'),
      },
    }),
    // Budi: earned
    prisma.points_history.upsert({
      where: { points_history_id: 4n },
      update: {},
      create: {
        member_id: memberBudi.member_id,
        order_id: null,
        points_change: 50,
        transaction_type: 'earned',
        description: 'Poin registrasi member baru',
        balance_before: 0,
        balance_after: 50,
        created_by: staffAdmin.staff_id,
        created_at: new Date('2026-03-01T09:00:00'),
      },
    }),
  ]);
  console.log('  ✓ 4 points history records');

  // ─── 18. FAVORITES ────────────────────────────────────────────────────────
  console.log('⭐ Seeding favorites...');
  await Promise.all([
    prisma.favorite.upsert({
      where: { staff_id_product_id: { staff_id: staffCashier.staff_id, product_id: prodSignature.product_id } },
      update: {},
      create: { staff_id: staffCashier.staff_id, product_id: prodSignature.product_id },
    }),
    prisma.favorite.upsert({
      where: { staff_id_product_id: { staff_id: staffCashier.staff_id, product_id: prodKopiSusu.product_id } },
      update: {},
      create: { staff_id: staffCashier.staff_id, product_id: prodKopiSusu.product_id },
    }),
    prisma.favorite.upsert({
      where: { staff_id_product_id: { staff_id: staffBarista.staff_id, product_id: prodMatcha.product_id } },
      update: {},
      create: { staff_id: staffBarista.staff_id, product_id: prodMatcha.product_id },
    }),
    prisma.favorite.upsert({
      where: { staff_id_product_id: { staff_id: staffBarista.staff_id, product_id: prodAmericano.product_id } },
      update: {},
      create: { staff_id: staffBarista.staff_id, product_id: prodAmericano.product_id },
    }),
  ]);
  console.log('  ✓ 4 favorites\n');

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('✅ Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TABLE                  RECORDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  categories             4');
  console.log('  outlets                2');
  console.log('  tax                    1');
  console.log('  service_charge         1');
  console.log('  discounts              3');
  console.log('  modifiers              5');
  console.log('  products               8');
  console.log('  reedem                 3');
  console.log('  staff                  4');
  console.log('  members                3');
  console.log('  customers              2');
  console.log('  shifts                 2');
  console.log('  orders                 4');
  console.log('  order_items            7');
  console.log('  order_item_modifiers   4');
  console.log('  payments               4');
  console.log('  points_history         4');
  console.log('  favorites              4');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Staff credentials (all password: "password")');
  console.log('  admin      → admin role');
  console.log('  cashier01  → cashier role');
  console.log('  manager01  → manager role');
  console.log('  barista01  → barista role');
  console.log('\n👤 Member credentials (all password: "password")');
  console.log('  davis@example.com  → Silver tier (150 pts)');
  console.log('  budi@example.com   → Bronze tier (50 pts)');
  console.log('  citra@example.com  → Gold tier (1200 pts)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
