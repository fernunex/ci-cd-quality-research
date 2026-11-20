import type { Product, ProductCategory } from "./model.js";

export function validateProduct(product: Product): void {
  if (!product.id.trim() || !product.name.trim()) {
    throw new Error("Product ID and name are required");
  }
  if (!Number.isSafeInteger(product.priceCents) || product.priceCents < 0) {
    throw new Error("Price must be a nonnegative integer");
  }
  if (!Number.isSafeInteger(product.weightGrams) || product.weightGrams < 0) {
    throw new Error("Weight must be a nonnegative integer");
  }
}

export function createProduct(
  id: string,
  name: string,
  category: ProductCategory,
  priceCents: number,
  weightGrams: number,
): Product {
  const product: Product = { id, name, category, priceCents, weightGrams, active: true };
  validateProduct(product);
  return product;
}

export function findProduct(products: readonly Product[], id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function changePrice(product: Product, newPriceCents: number): Product {
  const updated = { ...product, priceCents: newPriceCents };
  validateProduct(updated);
  return updated;
}

export function byCategory(products: readonly Product[], category: ProductCategory): Product[] {
  return products.filter((product) => product.category === category);
}

export function activeProducts(products: readonly Product[]): Product[] {
  return products.filter((product) => product.active);
}
