import type { CartLine, Product } from "./model.js";

function checkCartQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("Cart quantity must be positive");
  }
}

export function addLine(lines: readonly CartLine[], productId: string, quantity: number): CartLine[] {
  checkCartQuantity(quantity);
  if (!productId.trim()) throw new Error("Missing product ID");
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return [...lines, { productId, quantity }];
  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: line.quantity + quantity } : { ...line },
  );
}

export function setLineQuantity(lines: readonly CartLine[], productId: string, quantity: number): CartLine[] {
  checkCartQuantity(quantity);
  if (!lines.some((line) => line.productId === productId)) {
    throw new Error("Product not in cart");
  }
  return lines.map((line) => line.productId === productId ? { ...line, quantity } : { ...line });
}

export function removeLine(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId).map((line) => ({ ...line }));
}

export function cartQuantity(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(lines: readonly CartLine[], products: readonly Product[]): number {
  return lines.reduce((sum, line) => {
    checkCartQuantity(line.quantity);
    const product = products.find((candidate) => candidate.id === line.productId);
    if (!product || !product.active) throw new Error("Product unavailable");
    return sum + product.priceCents * line.quantity;
  }, 0);
}
