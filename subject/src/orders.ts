import type { CartLine, Order, OrderStatus } from "./model.js";

export function createOrder(id: string, customerId: string, lines: readonly CartLine[], totalCents: number): Order {
  if (!id.trim() || !customerId.trim() || lines.length === 0) {
    throw new Error("Missing order details");
  }
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new Error("Invalid order total");
  }
  return { id, customerId, lines: lines.map((line) => ({ ...line })), totalCents, status: "draft" };
}

export function orderStatus(order: Order): OrderStatus {
  return order.status;
}

export function confirmOrder(order: Order): Order {
  if (order.status !== "draft") throw new Error("Only draft orders can be confirmed");
  return { ...order, status: "confirmed" };
}

export function fulfillOrder(order: Order): Order {
  if (order.status !== "confirmed") throw new Error("Only confirmed orders can be fulfilled");
  return { ...order, status: "fulfilled" };
}

export function cancelOrder(order: Order): Order {
  if (order.status === "fulfilled" || order.status === "cancelled") {
    throw new Error("Order cannot be cancelled");
  }
  return { ...order, status: "cancelled" };
}
