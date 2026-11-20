import { describe, expect, it } from "vitest";
import { applyFixedCredit, couponDiscount, couponEligible, percentageDiscount } from "../src/discounts.js";
import type { Coupon } from "../src/model.js";
const coupon: Coupon = {
  code: "SAVE10", percent: 10, minimumCents: 5000, expiresAt: "2030-01-01T00:00:00Z", active: true,
};
const now = new Date("2026-01-01T00:00:00Z");

describe("discounts", () => {
  it("calculates and rounds percentage discounts", () => {
    expect(percentageDiscount(1050, 10)).toBe(105);
    expect(percentageDiscount(1055, 10)).toBe(106);
  });
  it("rejects invalid discount inputs", () => {
    expect(() => percentageDiscount(-1, 10)).toThrow();
    expect(() => percentageDiscount(100, 101)).toThrow();
  });
  it("checks minimum, active status and expiration", () => {
    expect(couponEligible(coupon, 5000, now)).toBe(true);
    expect(couponEligible(coupon, 4999, now)).toBe(false);
    expect(couponEligible({ ...coupon, active: false }, 5000, now)).toBe(false);
    expect(couponEligible(coupon, 5000, new Date("2031-01-01"))).toBe(false);
  });
  it("rejects unparsable expiration", () => {
    expect(() => couponEligible({ ...coupon, expiresAt: "oops" }, 10000, now)).toThrow();
  });
  it("applies a valid coupon", () => expect(couponDiscount(coupon, 10000, now)).toBe(1000));
  it("handles missing or ineligible coupons", () => {
    expect(couponDiscount(undefined, 10000, now)).toBe(0);
    expect(couponDiscount(coupon, 100, now)).toBe(0);
  });
  it("applies fixed credit without making total negative", () => {
    expect(applyFixedCredit(3000, 500)).toBe(2500);
    expect(applyFixedCredit(3000, 4000)).toBe(0);
    expect(() => applyFixedCredit(3000, -1)).toThrow();
  });
});
