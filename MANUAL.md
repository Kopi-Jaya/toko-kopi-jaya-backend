# Toko Kopi Jaya — Backend Maintenance Manual

> Stack: NestJS · TypeORM · MySQL · Prisma (seed only) · JWT

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Environment Variables](#2-environment-variables)
3. [Database Management](#3-database-management)
4. [Authentication & Roles](#4-authentication--roles)
5. [API Reference](#5-api-reference)
6. [Common Maintenance Tasks](#6-common-maintenance-tasks)
7. [Error Reference](#7-error-reference)
8. [Known Constraints & Business Rules](#8-known-constraints--business-rules)
9. [Project Structure](#9-project-structure)

---

## 1. Quick Start

### Prerequisites
- Node.js ≥ 18
- MySQL 8.x running on port 3306
- Database `toko_kopi_jaya` created

### Install & run
```bash
npm install
npm run start:dev      # development (watch mode)
npm run start:prod     # production build
npm run build          # compile to dist/
```

### Seed the database (first time)
```bash
npx prisma db seed
```

This creates all tables, views, triggers, and inserts default data (staff accounts, sample members, products, categories, etc.).

### Reset database
```bash
# Drop and recreate
mysql -u root -e "DROP DATABASE toko_kopi_jaya; CREATE DATABASE toko_kopi_jaya;"
npx prisma db push
npx prisma db seed
```

---

## 2. Environment Variables

File: `.env` (copy `.env.example` if starting fresh)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USERNAME` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | _(empty)_ |
| `DB_DATABASE` | Database name | `toko_kopi_jaya` |
| `DATABASE_URL` | Prisma connection string | auto-built from above |
| `JWT_SECRET` | JWT signing secret | _(set a strong value in prod)_ |
| `JWT_ACCESS_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `THROTTLE_TTL` | Rate limit window (ms) | `60000` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000,...` |

---

## 3. Database Management

### Views

| View | Used by | Purpose |
|------|---------|---------|
| `v_product_performance` | `/analytics/product-performance` | Aggregates order_items per product |

### Triggers

| Trigger | Table | Event | What it does |
|---------|-------|-------|--------------|
| `trg_set_earning_points_on_order_item` | `order_items` | BEFORE INSERT | Copies `earning_points` from `products` into the order item |
| `trg_credit_points_after_payment` | `orders` | AFTER UPDATE | When status → `paid`, credits member points and logs to `points_history` |

> **Important:** The `trg_credit_points_after_payment` trigger does **not** touch the `orders` table itself (that would be a recursive trigger error). Points on the order record are managed by the NestJS service.

### Useful queries

```sql
-- Check open shifts
SELECT * FROM shift WHERE end_time IS NULL;

-- Member points summary
SELECT member_id, name, current_points, lifetime_points_earned, tier FROM member;

-- Recent orders
SELECT order_id, status, total_final, created_at FROM orders ORDER BY created_at DESC LIMIT 20;

-- Pending payments
SELECT p.payment_id, p.order_id, p.status, p.amount FROM payment p
JOIN orders o ON o.order_id = p.order_id WHERE p.status = 'pending';
```

---

## 4. Authentication & Roles

### Login endpoint
All logins use a single endpoint — both staff and members:

```
POST /api/v1/auth/login
Body: { "identifier": "<email or username>", "password": "<password>" }
```

- **Member login:** use email → returns `type: "member"` token
- **Staff login:** use username → returns `type: "staff"` token with role

> Note: The swagger doc shows a separate `/auth/staff-login` route — that route does not exist. Use `/auth/login` for everyone.

### Token refresh
```
POST /api/v1/auth/refresh
Body: { "refresh_token": "<token>" }
```

### JWT payload structure
```json
{ "sub": 1, "type": "member|staff", "role": "admin|manager|cashier|barista", "email": "..." }
```

All protected endpoints require: `Authorization: Bearer <access_token>`

### Role hierarchy

| Role | Can do |
|------|--------|
| `admin` | Everything — full CRUD on all resources |
| `manager` | Most read/write; can manage shifts, view orders |
| `cashier` | Create orders, process payments, manage own shifts |
| `barista` | Limited; cannot start/end shifts |
| `member` | Own orders, favorites, loyalty, redeem |

### Default dev credentials

| Type | Identifier | Password | Role/Tier |
|------|-----------|----------|-----------|
| Staff | `admin` | `password` | admin |
| Staff | `cashier01` | `password` | cashier |
| Staff | `manager01` | `password` | manager |
| Staff | `barista01` | `password` | barista |
| Member | `davis@example.com` | `password` | Silver |
| Member | `budi@example.com` | `password` | Bronze |
| Member | `citra@example.com` | `password` | Gold |

---

## 5. API Reference

Base URL: `http://localhost:3000/api/v1`

All endpoints return:
```json
{ "data": <payload> }
```
Errors return:
```json
{ "statusCode": 4xx|5xx, "error": "...", "message": "..." }
```

---

### AUTH

#### GET /
> Health check. Requires any valid bearer token.
```
Response 200: { "data": "Hello World!" }
```

#### POST /auth/register
> Register a new member account.
```json
// Request
{ "name": "John Doe", "email": "john@example.com", "password": "password123", "phone_number": "08123456789", "birthday": "1995-06-15" }

// Response 201
{ "data": { "member": { "id": 5, "name": "...", "email": "..." }, "access_token": "...", "refresh_token": "..." } }
```
Errors: `409` if email already registered.

#### POST /auth/login
```json
// Request
{ "identifier": "davis@example.com", "password": "password" }
// or staff:
{ "identifier": "admin", "password": "password" }

// Response 200
{ "data": { "type": "member|staff", "user": { ... }, "access_token": "...", "refresh_token": "..." } }
```

#### POST /auth/refresh
```json
// Request
{ "refresh_token": "<token>" }
// Response 200
{ "data": { "access_token": "..." } }
```

---

### PRODUCTS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | Any | List with pagination, filters, sort |
| POST | `/products` | Admin/Manager | Create product |
| GET | `/products/{id}` | Any | Get by ID |
| PATCH | `/products/{id}` | Admin/Manager | Update |
| DELETE | `/products/{id}` | Admin | Delete |

**GET /products query params:**
- `page` (default: 1), `limit` (default: 20, max: 100)
- `category_id` — filter by category
- `search` — search by name
- `is_available` — true/false
- `sort_by` — `name | base_price | earning_points | created_at`
- `sort_order` — `ASC | DESC`

**POST /products body:**
```json
{ "name": "Kopi Susu", "category_id": 1, "base_price": 25000, "description": "...", "earning_points": 20, "is_available": true }
```

---

### CATEGORIES

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | Any | List all |
| POST | `/categories` | Admin/Manager | Create |
| GET | `/categories/{id}` | Any | Get by ID (includes products) |
| PATCH | `/categories/{id}` | Admin/Manager | Update |
| DELETE | `/categories/{id}` | Admin | Delete |

**POST body:** `{ "name": "Coffee", "description": "...", "is_active": true }`

---

### MODIFIERS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/modifiers` | Any | List all active modifiers |
| POST | `/modifiers` | Admin/Manager | Create |
| PATCH | `/modifiers/{id}` | Admin/Manager | Update |
| DELETE | `/modifiers/{id}` | Admin | Delete |

**POST body:** `{ "name": "Extra Shot", "type": "add", "extra_price": 5000, "is_active": true }`
- `type`: `"add"` or `"remove"`

---

### OUTLETS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/outlets` | Any | List with filters |
| POST | `/outlets` | Admin | Create |
| GET | `/outlets/{id}` | Any | Get by ID |
| PATCH | `/outlets/{id}` | Admin | Update |
| DELETE | `/outlets/{id}` | Admin | Delete |

**GET query params:** `page`, `limit`, `status` (`active|inactive|maintenance`), `lat`, `lng` (for distance sort)

**POST body:**
```json
{ "name": "Outlet Soekarno-Hatta", "address": "Jl. ...", "latitude": -7.95, "longitude": 112.61, "phone": "0341-123456" }
```
> Note: `city` field is NOT accepted despite appearing in older Swagger docs.

---

### ORDERS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | Member or Staff | Create order |
| GET | `/orders` | Member | Own orders only |
| GET | `/orders/admin` | Admin/Manager/Cashier | All orders |
| GET | `/orders/{id}` | Any authenticated | Order detail |
| PATCH | `/orders/{id}/status` | Admin/Manager/Cashier | Update status |

**POST body:**
```json
{
  "outlet_id": 1,
  "order_type": "dine-in",
  "source": "Mobile App",
  "items": [
    { "product_id": 1, "quantity": 2, "modifiers": [{ "modifier_id": 2 }] }
  ],
  "table_number": "A3",
  "discount_code": "SAVE10",
  "tax_id": 1,
  "service_charge_id": 1
}
```
- `order_type`: `"dine-in" | "takeaway" | "click-collect"`
- `source`: `"Mobile App" | "POS - In-Store" | "POS - GoFood" | "POS - GrabFood" | "POS - ShopeeFood" | "Admin Dashboard" | "Kiosk"`

**Status transition rules:**
```
pending → paid → preparing → ready_for_pickup → completed
pending → cancelled
```

**PATCH /orders/{id}/status body:** `{ "status": "paid" }`

**GET /orders/admin query params:** `page`, `limit`, `status`, `source`, `order_type`, `date_from`, `date_to`

---

### PAYMENTS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments` | Any staff | Create payment for an order |
| GET | `/payments/{orderId}` | Any authenticated | Get payment by order ID |

**POST body:**
```json
{ "order_id": 5, "payment_method": "Cash", "amount": 30000 }
```
- `payment_method`: `"QRIS" | "GoPay" | "OVO" | "Dana" | "ShopeePay" | "Cash" | "Debit Card" | "Credit Card" | "Bank Transfer"`
- Order must be in `pending` status to accept a payment.
- Only one payment per order is allowed.

---

### LOYALTY

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/loyalty/me` | Member | Points summary + tier info |
| GET | `/loyalty/me/points-history` | Member | Transaction history |

**GET /loyalty/me/points-history query params:** `page`, `limit`, `transaction_type` (`earned|redeemed|expired|adjusted|refunded|bonus`), `date_from`, `date_to`

---

### REDEEM

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/redeem` | Member | List available rewards with affordability |
| POST | `/redeem/{id}` | Member | Redeem a reward |

**POST body:** `{}` _(no required fields)_

Deducts `point_cost` from member's `current_points`. Fails with 400 if insufficient points.

---

### MEMBERS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/members/me` | Member | Own profile |
| PATCH | `/members/me` | Member | Update own profile |
| GET | `/members` | Admin/Manager | All members |
| GET | `/members/{id}` | Admin/Manager | Member by ID |

**PATCH /members/me body:** `{ "name": "...", "phone_number": "...", "birthday": "1995-06-15", "fav_menu": "..." }`

**GET /members query params:** `page`, `limit`, `search`, `tier` (`Bronze|Silver|Gold|Platinum`)

---

### CUSTOMERS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/customers` | Admin/Manager/Cashier | Walk-in customers list |

**GET query params:** `page`, `limit`

---

### FAVORITES

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/favorites` | Member | Own favorites list |
| POST | `/favorites` | Member | Add to favorites |
| DELETE | `/favorites/{id}` | Member | Remove from favorites |

**POST body:** `{ "product_id": 3 }`

---

### STAFF

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/staff` | Admin/Manager | List all staff |
| POST | `/staff` | Admin | Create staff account |
| GET | `/staff/{id}` | Admin/Manager | Staff by ID |
| PATCH | `/staff/{id}` | Admin | Update staff |
| DELETE | `/staff/{id}` | Admin | Delete staff |

**POST body:**
```json
{ "name": "Jane", "username": "jane01", "password": "password123", "role": "cashier", "outlet_id": 1 }
```
- `role`: `"admin" | "manager" | "cashier" | "barista"`

---

### DISCOUNTS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/discounts` | Any staff | List discounts |
| POST | `/discounts` | Admin/Manager | Create discount |
| GET | `/discounts/{id}` | Any staff | Get by ID |
| PATCH | `/discounts/{id}` | Admin/Manager | Update |
| DELETE | `/discounts/{id}` | Admin | Delete |
| POST | `/discounts/validate` | Any authenticated | Validate code |

**POST body:**
```json
{
  "code": "SAVE10",
  "name": "Save 10%",
  "type": "percentage",
  "value": 10,
  "min_purchase": 50000,
  "max_discount": 20000,
  "usage_limit": 100,
  "valid_from": "2026-01-01",
  "valid_until": "2026-12-31",
  "is_active": true
}
```
- `type`: `"percentage"` or `"nominal"`

**POST /discounts/validate body:** `{ "code": "SAVE10", "subtotal": 100000 }`

---

### TAXES

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/taxes` | Any staff | List taxes |
| POST | `/taxes` | Admin | Create tax |
| PATCH | `/taxes/{id}` | Admin | Update |
| DELETE | `/taxes/{id}` | Admin | Delete |

**POST body:** `{ "name": "PPN 11%", "type": "percentage", "value": 11, "is_active": true }`
- `type`: `"percentage"` or `"nominal"`
- Note: the field is `value` + `type`, **not** `rate`

---

### SERVICE CHARGES

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/service-charges` | Any staff | List |
| POST | `/service-charges` | Admin | Create |
| PATCH | `/service-charges/{id}` | Admin | Update |
| DELETE | `/service-charges/{id}` | Admin | Delete |

**POST body:** `{ "name": "Service 5%", "type": "percentage", "value": 5, "is_active": true }`

---

### SHIFTS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/shifts/start` | Cashier/Manager | Start a new shift |
| PATCH | `/shifts/{id}/end` | Cashier/Manager | End your own shift |
| GET | `/shifts` | Admin/Manager | All shifts |

**POST /shifts/start body:** `{ "cash_in_hand": 500000 }`

**PATCH /shifts/{id}/end body:**
```json
{ "total_cash_received": 150000, "total_cash_out": 0, "final_cash": 650000 }
```

Rules:
- Only one open shift per staff at a time
- A staff can only end their own shift
- Barista role cannot start/end shifts (403)

---

### ANALYTICS

All analytics endpoints: Admin/Manager only, all query params optional.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/sales-by-source` | Revenue grouped by order source |
| GET | `/analytics/product-performance` | Sales volume per product |
| GET | `/analytics/member-loyalty` | Member spend + points summary |

**Common query params:** `date_from`, `date_to`, `outlet_id`, `category_id`, `tier` (`Bronze|Silver|Gold|Platinum`), `sort_by`, `limit`

---

## 6. Common Maintenance Tasks

### Add a new staff member
```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"password"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 2. Create staff
curl -X POST http://localhost:3000/api/v1/staff \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Cashier","username":"cashier02","password":"password123","role":"cashier","outlet_id":1}'
```

### Add a new product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Kopi Arabica","category_id":1,"base_price":32000,"earning_points":25,"is_available":true}'
```

### Create a discount code
```bash
curl -X POST http://localhost:3000/api/v1/discounts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"PROMO20","name":"Promo 20%","type":"percentage","value":20,"valid_from":"2026-04-01","valid_until":"2026-04-30","is_active":true}'
```

### Cashier daily workflow
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"identifier":"cashier01","password":"password"}' | ...)

# 2. Start shift
SHIFT=$(curl -s -X POST http://localhost:3000/api/v1/shifts/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cash_in_hand":500000}')
SHIFT_ID=$(echo $SHIFT | grep -o '"shift_id":"[^"]*"' | cut -d'"' -f4)

# 3. Create order for walk-in
ORDER=$(curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"outlet_id":1,"order_type":"dine-in","items":[{"product_id":1,"quantity":1}]}')
ORDER_ID=$(echo $ORDER | grep -o '"order_id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 4. Process payment
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"order_id\":$ORDER_ID,\"payment_method\":\"Cash\",\"amount\":30000}"

# 5. Update order status
curl -X PATCH "http://localhost:3000/api/v1/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"paid"}'

# 6. End shift
curl -X PATCH "http://localhost:3000/api/v1/shifts/$SHIFT_ID/end" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"total_cash_received":150000,"total_cash_out":0,"final_cash":650000}'
```

### Reset a member's points (direct DB)
```sql
UPDATE member SET current_points = 100 WHERE email = 'davis@example.com';
```

---

## 7. Error Reference

| Code | Meaning | Common causes |
|------|---------|---------------|
| `400` | Bad Request | Validation failed, business rule violated (e.g. duplicate email, insufficient points, already paid) |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Authenticated but wrong role (e.g. barista trying to start shift) |
| `404` | Not Found | Resource ID doesn't exist |
| `409` | Conflict | Duplicate unique constraint (e.g. email already registered) |
| `500` | Internal Server Error | Unexpected server error — check NestJS logs |

### Checking server logs
```bash
# If running with npm run start:dev, logs print to stdout
# Or tail the log file if redirected:
tail -f /tmp/server.log | grep -i error
```

---

## 8. Known Constraints & Business Rules

### Orders
- `staff_id` is **nullable** — set automatically from JWT when a staff places the order; `null` for member-placed orders
- `member_id` is **nullable** — `null` for walk-in/guest orders
- Status transitions are strictly enforced: `pending → paid → preparing → ready_for_pickup → completed` (or `pending → cancelled`)
- Pickup code is auto-generated on order creation

### Payments
- Only **one** payment per order
- Order must be in `pending` status to accept payment
- `amount_paid` is not a valid field — use `amount`

### Loyalty Points
- Points are credited automatically by the `trg_credit_points_after_payment` MySQL trigger when an order status becomes `paid`
- Redemption atomically deducts points and writes a `points_history` record

### Shifts
- Only **one** open shift per staff member at a time
- Staff can only end **their own** shift
- Only `cashier` and `manager` roles can start/end shifts

### Swagger / OpenAPI doc mismatches (known)
The generated Swagger at `/api/v1/docs` (if enabled) may show stale field names. Actual valid fields:

| Endpoint | Swagger shows | Actual field |
|----------|--------------|--------------|
| `POST /auth/login` | `email` | `identifier` |
| `POST /outlets` | `city` | _(field doesn't exist)_ |
| `POST /taxes` | `rate` | `value` + `type` |
| `POST /payments` | `amount_paid` | `amount` |

---

## 9. Project Structure

```
src/
├── auth/               # Login, register, JWT strategy
├── analytics/          # Sales, product, loyalty analytics (raw SQL views)
├── categories/         # Product categories
├── common/
│   ├── decorators/     # @Public, @Roles
│   ├── enums/          # OrderStatus, OrderType, StaffRole, etc.
│   ├── filters/        # Global exception filter
│   ├── guards/         # JwtAuthGuard, RolesGuard
│   └── interceptors/   # Response transform (wraps all responses in { data: ... })
├── customers/          # Walk-in customer management
├── discounts/          # Discount codes + validation
├── favorites/          # Member product favorites
├── loyalty/            # Points summary + history
├── members/            # Member profiles
├── modifiers/          # Order item add-ons
├── orders/             # Order creation, listing, status management
├── outlets/            # Store locations
├── payments/           # Payment processing
├── products/           # Product catalog
├── redeem/             # Loyalty reward redemption
├── service-charge/     # Service charge configuration
├── shifts/             # Cashier shift management
├── staff/              # Staff accounts
└── tax/                # Tax configuration

prisma/
├── schema.prisma       # DB schema (used for migrations & seeding)
└── seed.ts             # Seeds default data, views, triggers

.env                    # Environment config
CREDENTIALS.md          # Dev login credentials
MANUAL.md               # This file
```

### Key files to know

| File | What to change |
|------|----------------|
| `src/common/enums/index.ts` | Add new status values, roles, sources |
| `src/auth/jwt.strategy.ts` | JWT payload shape |
| `src/common/guards/roles.guard.ts` | Role permission logic |
| `prisma/seed.ts` | Default data, DB views, triggers |
| `.env` | All environment config |

---

*Last updated: 2026-04-06 — all 70 endpoints verified passing.*
