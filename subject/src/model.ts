export type ProductCategory = "electronics" | "books" | "home";
export type ShippingZone = "local" | "national" | "international";
export type OrderStatus = "draft" | "confirmed" | "fulfilled" | "cancelled";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceCents: number;
  active: boolean;
  weightGrams: number;
}

export interface InventoryItem {
  productId: string;
  onHand: number;
  reserved: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Coupon {
  code: string;
  percent: number;
  minimumCents: number;
  expiresAt: string;
  active: boolean;
}

export interface Customer {
  id: string;
  email: string;
  premium: boolean;
  zone: ShippingZone;
}

export interface Order {
  id: string;
  customerId: string;
  lines: CartLine[];
  totalCents: number;
  status: OrderStatus;
}

export interface Invoice {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
}
