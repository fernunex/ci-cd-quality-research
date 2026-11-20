/** Demostración ejecutable del flujo: catálogo -> inventario -> carrito -> factura -> pedido. */
import {
  addLine,
  canFulfill,
  confirmOrder,
  createOrder,
  createProduct,
  formatMoney,
  invoiceForCart,
  reserveStock,
} from "../dist/index.js";

const book = createProduct("book-001", "Ingeniería de software", "books", 12900, 500);
const customer = { id: "customer-001", email: "buyer@example.test", premium: false, zone: "national" };
const inventory = { productId: book.id, onHand: 12, reserved: 0 };

const cart = addLine([], book.id, 2);
if (!canFulfill(inventory, cart[0].quantity)) throw new Error("Inventario insuficiente");
const reserved = reserveStock(inventory, cart[0].quantity);
const invoice = invoiceForCart(cart, [book], customer, undefined, new Date("2026-11-20"), 0.16);
const order = confirmOrder(createOrder("order-001", customer.id, cart, invoice.totalCents));

console.log(JSON.stringify({
  orderId: order.id,
  status: order.status,
  product: book.name,
  reservedUnits: reserved.reserved,
  subtotal: formatMoney(invoice.subtotalCents),
  tax: formatMoney(invoice.taxCents),
  shipping: formatMoney(invoice.shippingCents),
  total: formatMoney(invoice.totalCents),
}, null, 2));
