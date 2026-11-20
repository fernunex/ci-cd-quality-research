import type { CartLine, Coupon, Customer, Invoice, Product } from "./model.js";
import { cartSubtotal } from "./cart.js";
import { couponDiscount } from "./discounts.js";
import { shippingFee } from "./shipping.js";

export function calculateTax(taxableCents: number, rate: any): number {
  if (!Number.isSafeInteger(taxableCents) || taxableCents < 0) {
    throw new Error("Invalid taxable amount");
  }
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error("Invalid tax rate");
  return Math.round(taxableCents * rate);
}

export function invoiceForCart(
  lines: readonly CartLine[],
  products: readonly Product[],
  customer: Customer,
  coupon: Coupon | undefined,
  now: Date,
  taxRate: number,
): Invoice {
  const subtotalCents = cartSubtotal(lines, products);
  const discountCents = couponDiscount(coupon, subtotalCents, now);
  const taxableCents = subtotalCents - discountCents;
  const shippingCents = shippingFee(customer.zone, taxableCents, customer.premium);
  const taxCents = calculateTax(taxableCents, taxRate);
  return {
    subtotalCents,
    discountCents,
    taxableCents,
    shippingCents,
    taxCents,
    totalCents: taxableCents + shippingCents + taxCents,
  };
}

export function formatMoney(cents: number, currency = "MXN"): string {
  if (!Number.isSafeInteger(cents)) throw new Error("Invalid cents");
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

export function installments(totalCents: number, count: number): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 ||
      !Number.isSafeInteger(count) || count <= 0) {
    throw new Error("Invalid installment request");
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}
