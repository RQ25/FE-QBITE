export type Role = "ADMIN" | "STAFF";

export type MenuCategory = "FOOD" | "DRINK";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "WAITING_VERIFICATION"
  | "PAID"
  | "REJECTED"
  | "EXPIRED"
  | "COMPLETED";

export interface IUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICanteen {
  id: number;
  name: string;
  description?: string | null;
  isOpen: boolean;
  _count?: {
    menus: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IMenu {
  id: number;
  canteenId: number;
  canteen?: {
    id: number;
    name: string;
    isOpen?: boolean;
  };
  name: string;
  price: number;
  description?: string | null;
  category: MenuCategory;
  picture?: string | null;
  dailyQuota?: number | null;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderSession {
  id: number;
  name: string;
  openTime: string;
  closeTime: string;
  deliveryTime: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderItem {
  id: number;
  orderId: string;
  menuId: number;
  canteenId: number;
  canteen?: {
    id: number;
    name: string;
  };
  menuNameSnapshot: string;
  priceAtOrder: number;
  quantity: number;
  subtotal: number;
}

export interface IOrder {
  id: string;
  orderCode: string;
  pickupPin: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string | null;
  sessionId: number;
  session?: IOrderSession;
  deliveryDate: string;
  totalAmount: number;
  status: OrderStatus;
  paymentExpiry: string;
  proofImageUrl?: string | null;
  paymentProof?: string | null;
  proofImageHash?: string | null;
  rejectionReason?: string | null;
  isExported: boolean;
  verifiedAt?: string | null;
  completedAt?: string | null;
  items: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ICartItem {
  menuId: number;
  canteenId: number;
  canteenName: string;
  name: string;
  price: number;
  picture?: string | null;
  quantity: number;
  dailyQuota?: number | null;
}