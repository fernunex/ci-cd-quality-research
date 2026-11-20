import { describe, expect, it } from "vitest";
import { activeProducts, byCategory, changePrice, createProduct, findProduct, validateProduct } from "../src/products.js";

const book = createProduct("b-1", "Software Engineering", "books", 2500, 400);
const lamp = createProduct("h-1", "Desk Lamp", "home", 4200, 800);

describe("products", () => {
  it("creates and validates a real product", () => {
    expect(book.active).toBe(true);
    expect(() => validateProduct(book)).not.toThrow();
  });
  it("requires a name and ID", () => {
    expect(() => createProduct("", "Book", "books", 100, 100)).toThrow();
    expect(() => createProduct("x", "", "books", 100, 100)).toThrow();
  });
  it("rejects negative or fractional price", () => {
    expect(() => changePrice(book, -1)).toThrow();
    expect(() => changePrice(book, 12.5)).toThrow();
  });
  it("rejects negative weight", () => {
    expect(() => createProduct("x", "Invalid", "home", 100, -1)).toThrow();
  });
  it("finds products and handles missing IDs", () => {
    expect(findProduct([book, lamp], "b-1")?.id).toBe("b-1");
    expect(findProduct([book, lamp], "unknown")).toBeUndefined();
  });
  it("changes price immutably", () => {
    expect(changePrice(book, 3000).priceCents).toBe(3000);
    expect(book.priceCents).toBe(2500);
  });
  it("filters by category", () => {
    expect(byCategory([book, lamp], "home")).toEqual([lamp]);
  });
  it("filters inactive products", () => {
    expect(activeProducts([book, { ...lamp, active: false }])).toEqual([book]);
  });
});
