import { describe, expect, it } from "vitest";
import { addLine, cartQuantity, cartSubtotal, removeLine, setLineQuantity } from "../src/cart.js";
import { createProduct } from "../src/products.js";
const products = [
  createProduct("a", "A", "books", 1000, 300),
  createProduct("b", "B", "home", 2500, 400),
];

describe("cart", () => {
  it("adds a new line", () => expect(addLine([], "a", 2)).toEqual([{ productId: "a", quantity: 2 }]));
  it("merges quantities for existing items", () => {
    const lines = addLine([{ productId: "a", quantity: 1 }], "a", 3);
    expect(lines[0]?.quantity).toBe(4);
  });
  it("rejects invalid lines", () => {
    expect(() => addLine([], "a", 0)).toThrow();
    expect(() => addLine([], "  ", 1)).toThrow();
  });
  it("updates quantities", () => {
    const lines = [{ productId: "a", quantity: 2 }, { productId: "b", quantity: 1 }];
    expect(setLineQuantity(lines, "a", 5)[0]?.quantity).toBe(5);
    expect(lines[0]?.quantity).toBe(2);
  });
  it("rejects updates to absent products", () => {
    expect(() => setLineQuantity([], "not-in-cart", 1)).toThrow();
  });
  it("removes lines", () => {
    expect(removeLine([{ productId: "a", quantity: 1 }], "a")).toEqual([]);
  });
  it("counts quantities", () => {
    expect(cartQuantity([{ productId: "a", quantity: 2 }, { productId: "b", quantity: 3 }])).toBe(5);
  });
  it("computes subtotal in cents", () => {
    expect(cartSubtotal([{ productId: "a", quantity: 2 }, { productId: "b", quantity: 1 }], products)).toBe(4500);
  });
  it("rejects unavailable or invalid cart items", () => {
    expect(() => cartSubtotal([{ productId: "z", quantity: 1 }], products)).toThrow();
    expect(() => cartSubtotal([{ productId: "a", quantity: -1 }], products)).toThrow();
    expect(() => cartSubtotal([{ productId: "b", quantity: 1 }], [{ ...products[1]!, active: false }])).toThrow();
  });
});
