export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderSource {
  MOBILE_APP = 'Mobile App',
  POS_IN_STORE = 'POS - In-Store',
  POS_GOFOOD = 'POS - GoFood',
  POS_GRABFOOD = 'POS - GrabFood',
  POS_SHOPEEFOOD = 'POS - ShopeeFood',
  ADMIN_DASHBOARD = 'Admin Dashboard',
  KIOSK = 'Kiosk',
}

export enum OrderType {
  DINE_IN = 'dine-in',
  TAKEAWAY = 'takeaway',
  CLICK_COLLECT = 'click-collect',
}

export enum PaymentMethod {
  QRIS = 'QRIS',
  GOPAY = 'GoPay',
  OVO = 'OVO',
  DANA = 'Dana',
  SHOPEEPAY = 'ShopeePay',
  CASH = 'Cash',
  DEBIT_CARD = 'Debit Card',
  CREDIT_CARD = 'Credit Card',
  BANK_TRANSFER = 'Bank Transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum StaffRole {
  /// Cross-outlet operator. Manages outlets, the master product catalog,
  /// outlet admins, and sees cross-outlet analytics. Bypasses outlet-scope
  /// guards entirely (M-125).
  SUPER_ADMIN = 'super_admin',
  /// Outlet-scoped operator. Manages their assigned outlet's menu (via
  /// outlet_products), staff, orders, members, discounts, etc.
  ADMIN = 'admin',
  /// Outlet-scoped operator with elevated permissions over Cashier/Barista
  /// (e.g. shift open/close).
  MANAGER = 'manager',
  CASHIER = 'cashier',
  BARISTA = 'barista',
}

export enum MemberTier {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
}

export enum ModifierType {
  ADD = 'add',
  REMOVE = 'remove',
}

export enum ChargeType {
  NOMINAL = 'nominal',
  PERCENTAGE = 'percentage',
}

export enum PointsTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  ADJUSTED = 'adjusted',
  REFUNDED = 'refunded',
  BONUS = 'bonus',
}

export enum OutletStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}
