import { describe, expect, it } from "vitest";
import { availableUnits, canFulfill, releaseStock, reserveStock, restock } from "../src/inventory.js";
const item = { productId: "book", onHand: 20, reserved: 4 };

describe("inventory", () => {
  it("reports available units", () => expect(availableUnits(item)).toBe(16));
  it("rejects inconsistent stock", () => {
    expect(() => availableUnits({ ...item, reserved: 21 })).toThrow();
    expect(() => availableUnits({ ...item, onHand: -1 })).toThrow();
  });
  it("restocks without modifying the original", () => {
    expect(restock(item, 3).onHand).toBe(23);
    expect(item.onHand).toBe(20);
  });
  it("rejects invalid quantities", () => {
    expect(() => restock(item, 0)).toThrow();
    expect(() => reserveStock(item, 2.5)).toThrow();
    expect(() => releaseStock(item, -1)).toThrow();
  });
  it("reserves available stock", () => expect(reserveStock(item, 5).reserved).toBe(9));
  it("does not reserve too much stock", () => expect(() => reserveStock(item, 17)).toThrow());
  it("releases reservations", () => expect(releaseStock(item, 2).reserved).toBe(2));
  it("cannot release unreserved units", () => expect(() => releaseStock(item, 5)).toThrow());
  it("checks fulfillment", () => {
    expect(canFulfill(item, 16)).toBe(true);
    expect(canFulfill(item, 17)).toBe(false);
  });
});
