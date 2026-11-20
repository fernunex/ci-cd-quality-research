import type { Coupon } from "./model.js";

export function percentageDiscount(amountCents: number, percent: number): number {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error("Invalid discount base");
  }
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("Invalid discount percentage");
  }
  return Math.round((amountCents * percent) / 100);
}

export function couponEligible(coupon: Coupon, subtotalCents: number, now: Date): boolean {
  const expiresAtMs = Date.parse(coupon.expiresAt);
  if (Number.isNaN(expiresAtMs)) throw new Error("Invalid coupon expiration");
  return coupon.active && subtotalCents >= coupon.minimumCents && now.getTime() <= expiresAtMs;
}

export function couponDiscount(coupon: Coupon | undefined, subtotalCents: number, now: Date): number {
  if (!coupon || !couponEligible(coupon, subtotalCents, now)) return 0;
  return percentageDiscount(subtotalCents, coupon.percent);
}

export function applyFixedCredit(amountCents: number, creditCents: number): number {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0 ||
      !Number.isSafeInteger(creditCents) || creditCents < 0) {
    throw new Error("Invalid amount or credit");
  }
  return Math.max(0, amountCents - creditCents);
}
