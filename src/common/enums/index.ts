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
  ADMIN = 'admin',
  CASHIER = 'cashier',
  MANAGER = 'manager',
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
