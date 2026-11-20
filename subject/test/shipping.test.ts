import { describe, expect, it } from "vitest";
import { estimatedDeliveryDays, freeShippingEligible, shippingFee, shippingWeight } from "../src/shipping.js";

describe("shipping", () => {
  it("provides free shipping for premium or large orders", () => {
    expect(freeShippingEligible(100, true)).toBe(true);
    expect(freeShippingEligible(15000, false)).toBe(true);
    expect(freeShippingEligible(14999, false)).toBe(false);
  });
  it("rejects negative subtotal", () => expect(() => freeShippingEligible(-1, false)).toThrow());
  it("applies zone-dependent fees", () => {
    expect(shippingFee("local", 100, false)).toBe(400);
    expect(shippingFee("national", 100, false)).toBe(900);
    expect(shippingFee("international", 100, false)).toBe(2500);
    expect(shippingFee("local", 100, true)).toBe(0);
  });
  it("estimates regular and express delivery", () => {
    expect(estimatedDeliveryDays("local", false)).toBe(2);
    expect(estimatedDeliveryDays("national", true)).toBe(3);
    expect(estimatedDeliveryDays("local", true)).toBe(1);
  });
  it("computes total shipment weight", () => {
    expect(shippingWeight([{ productId: "a", quantity: 2 }], { a: 300 })).toBe(600);
  });
  it("rejects missing weights and invalid quantities", () => {
    expect(() => shippingWeight([{ productId: "z", quantity: 1 }], { a: 10 })).toThrow();
    expect(() => shippingWeight([{ productId: "a", quantity: 0 }], { a: 10 })).toThrow();
  });
});
