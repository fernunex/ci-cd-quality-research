import { describe, expect, it } from "vitest";
import { cancelOrder, confirmOrder, createOrder, fulfillOrder, orderStatus } from "../src/orders.js";
const draft = createOrder("o-1", "c-1", [{ productId: "b", quantity: 1 }], 2000);

describe("orders", () => {
  it("creates a draft from a cart snapshot", () => {
    expect(draft.status).toBe("draft");
    expect(orderStatus(draft)).toBe("draft");
  });
  it("checks required order data", () => {
    expect(() => createOrder("", "c", [{ productId: "a", quantity: 1 }], 100)).toThrow();
    expect(() => createOrder("o", "c", [], 100)).toThrow();
    expect(() => createOrder("o", "c", [{ productId: "a", quantity: 1 }], -1)).toThrow();
  });
  it("confirms only draft orders", () => {
    expect(confirmOrder(draft).status).toBe("confirmed");
    expect(() => confirmOrder(confirmOrder(draft))).toThrow();
  });
  it("fulfills only confirmed orders", () => {
    expect(fulfillOrder(confirmOrder(draft)).status).toBe("fulfilled");
    expect(() => fulfillOrder(draft)).toThrow();
  });
  it("cancels drafts and confirmations", () => {
    expect(cancelOrder(draft).status).toBe("cancelled");
    expect(cancelOrder(confirmOrder(draft)).status).toBe("cancelled");
  });
  it("cannot cancel completed or cancelled orders", () => {
    expect(() => cancelOrder(fulfillOrder(confirmOrder(draft)))).toThrow();
    expect(() => cancelOrder(cancelOrder(draft))).toThrow();
  });
});
