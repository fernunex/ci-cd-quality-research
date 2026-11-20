import type { ShippingZone } from "./model.js";

const ZONE_FEE: Record<ShippingZone, number> = {
  local: 400,
  national: 900,
  international: 2500,
};

export function freeShippingEligible(subtotalCents: number, premium: boolean): boolean {
  if (subtotalCents < 0) throw new Error("Invalid subtotal");
  return premium || subtotalCents >= 15_000;
}

export function shippingFee(zone: ShippingZone, subtotalCents: number, premium: boolean): number {
  if (freeShippingEligible(subtotalCents, premium)) return 0;
  return ZONE_FEE[zone];
}

export function estimatedDeliveryDays(zone: ShippingZone, express: boolean): number {
  const regularDays: Record<ShippingZone, number> = {
    local: 2,
    national: 5,
    international: 12,
  };
  return Math.max(1, regularDays[zone] - (express ? 2 : 0));
}

export function shippingWeight(lines: readonly { productId: string; quantity: number }[],
  weightsByProduct: Readonly<Record<string, number>>): number {
  return lines.reduce((sum, line) => {
    const weight = weightsByProduct[line.productId];
    if (weight === undefined || weight < 0) throw new Error("Unknown product weight");
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new Error("Invalid quantity");
    return sum + weight * line.quantity;
  }, 0);
}
