import { describe, expect, it } from "vitest";
import { calculateTax, formatMoney, installments, invoiceForCart } from "../src/billing.js";
import { createProduct } from "../src/products.js";
import type { Coupon, Customer } from "../src/model.js";
const products = [createProduct("book", "Book", "books", 10000, 250)];
const customer: Customer = { id: "c", email: "c@example.test", premium: false, zone: "local" };
const coupon: Coupon = { code: "SAVE10", percent: 10, minimumCents: 1000,
  expiresAt: "2030-01-01T00:00:00Z", active: true };

describe("billing", () => {
  it("calculates tax in integer cents", () => expect(calculateTax(10000, 0.16)).toBe(1600));
  it("rejects invalid taxes", () => {
    expect(() => calculateTax(-100, 0.16)).toThrow();
    expect(() => calculateTax(100, 2)).toThrow();
  });
  it("combines subtotal, coupon, shipping and tax", () => {
    const invoice = invoiceForCart([{ productId: "book", quantity: 1 }],
      products, customer, coupon, new Date("2026-01-01"), 0.16);
    expect(invoice).toEqual({ subtotalCents: 10000, discountCents: 1000,
      taxableCents: 9000, shippingCents: 400, taxCents: 1440, totalCents: 10840 });
  });
  it("grants free shipping to premium customers", () => {
    const invoice = invoiceForCart([{ productId: "book", quantity: 2 }],
      products, { ...customer, premium: true }, undefined, new Date("2026-01-01"), 0);
    expect(invoice.totalCents).toBe(20000);
  });
  it("formats money", () => {
    expect(formatMoney(12345)).toBe("MXN 123.45");
    expect(formatMoney(100, "USD")).toBe("USD 1.00");
    expect(() => formatMoney(Number.NaN)).toThrow();
  });
  it("distributes cents exactly across installments", () => {
    expect(installments(100, 3)).toEqual([34, 33, 33]);
    expect(installments(0, 2)).toEqual([0, 0]);
    expect(() => installments(100, 0)).toThrow();
  });
});
