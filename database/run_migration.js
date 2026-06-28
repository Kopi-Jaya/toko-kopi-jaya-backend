const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'toko_kopi_jaya',
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'sync_zaki_schema.sql'), 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'));

  let ok = 0, skip = 0;
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      const col = stmt.match(/COLUMN\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1] ?? '';
      console.log(`  ✅  ${col || stmt.slice(0, 60).replace(/\n/g, ' ')}`);
      ok++;
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        const col = stmt.match(/COLUMN\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1] ?? '';
        console.log(`  ⏭  ${col} — already exists`);
        skip++;
      } else {
        console.error(`  ❌  ${e.message}`);
        console.error(`     SQL: ${stmt.slice(0, 80)}`);
      }
    }
  }

  // Verify key columns
  console.log('\n── Verification ─────────────────────────────────────────');
  const checks = [
    ["SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='toko_kopi_jaya' AND TABLE_NAME='products' AND COLUMN_NAME='stock'", 'products.stock'],
    ["SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='toko_kopi_jaya' AND TABLE_NAME='orders' AND COLUMN_NAME='table_id'", 'orders.table_id'],
    ["SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='toko_kopi_jaya' AND TABLE_NAME='orders' AND COLUMN_NAME='pax'", 'orders.pax'],
    ["SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='toko_kopi_jaya' AND TABLE_NAME='order_items' AND COLUMN_NAME='notes'", 'order_items.notes'],
    ["SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='toko_kopi_jaya' AND TABLE_NAME='payment' AND COLUMN_NAME='amount_paid'", 'payment.amount_paid'],
    ["SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='toko_kopi_jaya' AND TABLE_NAME='orders' AND COLUMN_NAME='staff_id'", 'orders.staff_id nullable'],
  ];
  for (const [q, label] of checks) {
    const [rows] = await conn.execute(q);
    const val = rows[0]?.c ?? rows[0]?.IS_NULLABLE;
    const ok2 = val === 1 || val === 'YES';
    console.log(`  ${ok2 ? '✅' : '❌'}  ${label}: ${val}`);
  }

  await conn.end();
  console.log(`\nDone. ${ok} applied, ${skip} already existed.`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
