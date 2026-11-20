import type { InventoryItem } from "./model.js";

function validateQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }
}

export function availableUnits(item: InventoryItem): number {
  if (item.onHand < 0 || item.reserved < 0 || item.reserved > item.onHand) {
    throw new Error("Invalid inventory state");
  }
  return item.onHand - item.reserved;
}

export function restock(item: InventoryItem, quantity: number): InventoryItem {
  validateQuantity(quantity);
  availableUnits(item);
  return { ...item, onHand: item.onHand + quantity };
}

export function reserveStock(item: InventoryItem, quantity: number): InventoryItem {
  validateQuantity(quantity);
  if (quantity > availableUnits(item)) {
    throw new Error("Insufficient available stock");
  }
  return { ...item, reserved: item.reserved + quantity };
}

export function releaseStock(item: InventoryItem, quantity: number): InventoryItem {
  validateQuantity(quantity);
  if (quantity > item.reserved) {
    throw new Error("Cannot release more than reserved");
  }
  return { ...item, reserved: item.reserved - quantity };
}

export function canFulfill(item: InventoryItem, quantity: number): boolean {
  validateQuantity(quantity);
  return availableUnits(item) >= quantity;
}
