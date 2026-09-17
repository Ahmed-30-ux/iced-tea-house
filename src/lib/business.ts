import { prisma } from "@/lib/prisma";
import { generateNumber } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export type OrderInputItem = {
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
};

export type CreatedBy = Pick<SessionUser, "id" | "name" | "businessId">;

function requireBusiness(session: CreatedBy) {
  if (!session.businessId) throw new Error("No business selected");
  return session.businessId;
}

// ===== AUDIT + NOTIFICATIONS =====

export async function writeAudit(
  businessId: string,
  user: CreatedBy | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: string
) {
  await prisma.auditLog.create({
    data: {
      businessId,
      userId: user?.id ?? null,
      userName: user?.name ?? "system",
      action,
      entityType,
      entityId,
      details,
    },
  });
}

export async function notify(businessId: string, type: string, title: string, message: string) {
  await prisma.notification.create({ data: { businessId, type, title, message } });
}

export async function checkLowStock(businessId: string) {
  const products = await prisma.product.findMany({
    where: { businessId, status: "ACTIVE" },
  });
  const alerts = products.filter((p) => p.reorderLevel > 0 && p.currentStock <= p.reorderLevel);
  const out = products.filter((p) => p.currentStock <= 0);
  for (const p of out) {
    await notify(businessId, "out_of_stock", "Out of stock", `${p.name} is out of stock.`);
  }
  for (const p of alerts) {
    await notify(businessId, "low_stock", "Low stock", `${p.name} is below reorder level (${p.currentStock} remaining).`);
  }
  return alerts;
}

// ===== ORDERS =====

export async function createOrder(params: {
  session: CreatedBy;
  customerId?: string | null;
  items: OrderInputItem[];
  discount?: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  amountPaid?: number;
  status?: string | null;
  notes?: string | null;
  orderDate?: Date;
}) {
  const businessId = requireBusiness(params.session);

  if (!params.items.length) throw new Error("Order must have at least one item");
  const discount = Math.max(0, Number(params.discount ?? 0));
  const subtotal = params.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);
  const amountPaid = Math.max(0, Number(params.amountPaid ?? 0));

  const paymentStatus = params.paymentStatus ?? (total <= amountPaid ? "PAID" : amountPaid > 0 ? "PARTIALLY_PAID" : "UNPAID");

  const order = await prisma.order.create({
    data: {
      businessId,
      orderNumber: generateNumber("ORD"),
      customerId: params.customerId || null,
      orderDate: params.orderDate ?? new Date(),
      status: (params.status as any) ?? "PENDING",
      paymentStatus: (paymentStatus as any) ?? "UNPAID",
      paymentMethod: (params.paymentMethod as any) || null,
      subtotal,
      discount,
      total,
      amountPaid,
      notes: params.notes,
      userId: params.session.id,
      items: {
        create: params.items.map((i) => ({
          productId: i.productId || null,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          lineTotal: i.quantity * i.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  if (amountPaid > 0) {
    await prisma.payment.create({
      data: {
        businessId,
        orderId: order.id,
        customerId: params.customerId || null,
        amount: amountPaid,
        method: (params.paymentMethod as any) ?? "CASH",
        date: new Date(),
        reference: order.orderNumber,
      },
    });
  }

  await writeAudit(businessId, params.session, "Order created", "Order", order.id, `Order ${order.orderNumber} created (${total}).`);

  if (paymentStatus !== "PAID") {
    await notify(businessId, "unpaid_order", "Unpaid order", `Order ${order.orderNumber} is unpaid (${paymentStatus}).`);
  }

  return order;
}

export async function addPayment(params: {
  session: CreatedBy;
  orderId: string;
  amount: number;
  method: string;
}) {
  const businessId = requireBusiness(params.session);
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.businessId !== businessId) throw new Error("Order not found");

  const newPaid = Math.min(order.total, order.amountPaid + params.amount);

  await prisma.payment.create({
    data: {
      businessId,
      orderId: order.id,
      customerId: order.customerId,
      amount: params.amount,
      method: params.method as any,
      reference: order.orderNumber,
    },
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      amountPaid: newPaid,
      paymentStatus: newPaid >= order.total ? "PAID" : "PARTIALLY_PAID",
      paymentMethod: params.method as any,
    },
  });

  await writeAudit(businessId, params.session, "Payment recorded", "Order", order.id, `Payment of ${params.amount} recorded on ${order.orderNumber}.`);

  // If they want the revenue recorded once fully paid
  if (updated.paymentStatus === "PAID") {
    await recordSaleRevenue(businessId, updated, params.session);
  }

  return updated;
}

async function recordSaleRevenue(businessId: string, order: any, session: CreatedBy) {
  const existing = await prisma.financialTransaction.findFirst({
    where: { businessId, referenceType: "ORDER", referenceId: order.id },
  });
  if (existing) return;

  const last = await getLastBalance(businessId);
  const tx = await prisma.financialTransaction.create({
    data: {
      businessId,
      date: new Date(),
      type: "SALE",
      category: "Sales",
      description: `Sale — ${order.orderNumber}`,
      referenceType: "ORDER",
      referenceId: order.id,
      moneyIn: order.total,
      moneyOut: 0,
      balance: Math.round((last + order.total) * 100) / 100,
      paymentMethod: order.paymentMethod,
      userId: session.id,
    },
  });
  return tx;
}

export async function getLastBalance(businessId: string) {
  const last = await prisma.financialTransaction.findFirst({
    where: { businessId },
    orderBy: { date: "desc" },
  });
  return last?.balance ?? 0;
}

/**
 * Complete an order: deduct inventory, compute COGS/gross profit, record revenue + sales history.
 */
export async function completeOrder(params: { session: CreatedBy; orderId: string }) {
  const businessId = requireBusiness(params.session);
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true, sales: true },
  });
  if (!order || order.businessId !== businessId) throw new Error("Order not found");
  if (order.status === "CANCELLED" || order.status === "COMPLETED") {
    throw new Error(`Order is already ${order.status}`);
  }

  // 1. Deduct inventory per item + record movement
  let totalCogs = 0;
  for (const item of order.items) {
    totalCogs += item.costPrice * item.quantity;
    if (item.productId) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product ${item.productName} not found`);
      const newStock = Math.max(0, product.currentStock - item.quantity);
      await prisma.product.update({
        where: { id: product.id },
        data: { currentStock: newStock },
      });
      await prisma.inventoryMovement.create({
        data: {
          businessId,
          productId: product.id,
          productName: product.name,
          type: "SALE",
          quantity: -item.quantity,
          balanceAfter: newStock,
          referenceType: "ORDER",
          referenceId: order.id,
          notes: `Sold on ${order.orderNumber}`,
          userId: params.session.id,
        },
      });
    }
  }

  const grossProfit = Math.round((order.total - totalCogs) * 100) / 100;

  // 2. Update order
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "COMPLETED", totalCogs, grossProfit },
  });

  // 3. Create Sale records per item
  for (const item of order.items) {
    await prisma.sale.create({
      data: {
        businessId,
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        revenue: item.quantity * item.unitPrice,
        cost: item.costPrice * item.quantity,
        profit: Math.round((item.quantity * item.unitPrice - item.costPrice * item.quantity) * 100) / 100,
        date: order.orderDate,
      },
    });
  }

  // 4. Record revenue if fully paid
  if (order.paymentStatus === "PAID") {
    await recordSaleRevenue(businessId, order, params.session);
  }

  await writeAudit(businessId, params.session, "Order completed", "Order", order.id, `${order.orderNumber} completed. COGS ${totalCogs}, GP ${grossProfit}.`);
  await checkLowStock(businessId);
}

/**
 * Cancel / refund an order: reverse inventory, record refund outflow.
 */
export async function cancelOrder(params: { session: CreatedBy; orderId: string; reason?: string }) {
  const businessId = requireBusiness(params.session);
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });
  if (!order || order.businessId !== businessId) throw new Error("Order not found");
  if (order.status === "COMPLETED" || order.status === "PENDING" || order.status === "CANCELLED") {
    // Only restore inventory if it was previously deducted (COMPLETED)
    if (order.status === "CANCELLED") throw new Error("Order is already cancelled");
  }

  // 1. Restore inventory
  if (order.status === "COMPLETED") {
    for (const item of order.items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = Math.max(0, product.currentStock + item.quantity);
          await prisma.product.update({
            where: { id: product.id },
            data: { currentStock: newStock },
          });
          await prisma.inventoryMovement.create({
            data: {
              businessId,
              productId: product.id,
              productName: product.name,
              type: "RETURN",
              quantity: item.quantity,
              balanceAfter: newStock,
              referenceType: "ORDER",
              referenceId: order.id,
              notes: `Returned from cancelled order ${order.orderNumber}`,
              userId: params.session.id,
            },
          });
        }
      }
    }
  }

  // 2. Refund any paid amount as cash outflow
  if (order.amountPaid > 0) {
    const last = await getLastBalance(businessId);
    await prisma.financialTransaction.create({
      data: {
        businessId,
        date: new Date(),
        type: "REFUND",
        category: "Refunds",
        description: `Refund — ${order.orderNumber}`,
        referenceType: "ORDER",
        referenceId: order.id,
        moneyIn: 0,
        moneyOut: order.amountPaid,
        balance: Math.round((last - order.amountPaid) * 100) / 100,
        paymentMethod: order.paymentMethod,
        userId: params.session.id,
      },
    });
  }

  // 3. Mark order cancelled
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", amountPaid: 0, paymentStatus: "UNPAID" },
  });

  await writeAudit(businessId, params.session, "Order cancelled", "Order", order.id, `${order.orderNumber} cancelled.${params.reason ? ` Reason: ${params.reason}` : ""}`);
}

export async function updateOrderStatus(params: {
  session: CreatedBy;
  orderId: string;
  status: string;
}) {
  const businessId = requireBusiness(params.session);
  const order = await prisma.order.findUnique({ where: { id: params.orderId }, include: { items: true } });
  if (!order || order.businessId !== businessId) throw new Error("Order not found");

  const target = params.status as string;

  if (target === "COMPLETED" && order.status !== "COMPLETED") {
    await completeOrder({ session: params.session, orderId: order.id });
    return;
  }
  if (target === "CANCELLED" && order.status !== "CANCELLED") {
    await cancelOrder({ session: params.session, orderId: order.id });
    return;
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: target as any } });
  await writeAudit(businessId, params.session, "Order status updated", "Order", order.id, `${order.orderNumber} → ${target}`);
}

// ===== PRODUCTS =====

export async function createProduct(params: {
  session: CreatedBy;
  name: string;
  sku?: string | null;
  categoryId?: string | null;
  sellingPrice: number;
  costPrice: number;
  reorderLevel?: number;
  supplier?: string | null;
  openingStock?: number;
}) {
  const businessId = requireBusiness(params.session);
  const product = await prisma.product.create({
    data: {
      businessId,
      name: params.name,
      sku: params.sku?.trim() || null,
      categoryId: params.categoryId || null,
      sellingPrice: params.sellingPrice,
      costPrice: params.costPrice,
      reorderLevel: params.reorderLevel ?? 0,
      supplier: params.supplier || null,
      currentStock: params.openingStock ?? 0,
    },
  });

  if ((params.openingStock ?? 0) > 0) {
    await prisma.inventoryMovement.create({
      data: {
        businessId,
        productId: product.id,
        productName: product.name,
        type: "ADJUSTMENT",
        quantity: params.openingStock!,
        balanceAfter: params.openingStock!,
        referenceType: "OPENING_STOCK",
        notes: "Opening stock",
        userId: params.session.id,
      },
    });
  }

  await writeAudit(businessId, params.session, "Product created", "Product", product.id, `${product.name} created.`);
  return product;
}

export async function updateProduct(params: {
  session: CreatedBy;
  id: string;
  name: string;
  sku?: string | null;
  categoryId?: string | null;
  sellingPrice: number;
  costPrice: number;
  reorderLevel?: number;
  supplier?: string | null;
  status?: string;
}) {
  const businessId = requireBusiness(params.session);
  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.businessId !== businessId) throw new Error("Product not found");

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: params.name,
      sku: params.sku?.trim() || null,
      categoryId: params.categoryId || null,
      sellingPrice: params.sellingPrice,
      costPrice: params.costPrice,
      reorderLevel: params.reorderLevel ?? 0,
      supplier: params.supplier || null,
      status: (params.status as any) ?? existing.status,
    },
  });

  await writeAudit(businessId, params.session, "Product edited", "Product", product.id, `${product.name} updated.`);
  return product;
}

export async function adjustInventory(params: {
  session: CreatedBy;
  productId: string;
  quantity: number; // signed
  type: string;
  notes?: string;
}) {
  const businessId = requireBusiness(params.session);
  const product = await prisma.product.findUnique({ where: { id: params.productId } });
  if (!product || product.businessId !== businessId) throw new Error("Product not found");

  const newStock = Math.max(0, product.currentStock + params.quantity);
  await prisma.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
  const movement = await prisma.inventoryMovement.create({
    data: {
      businessId,
      productId: product.id,
      productName: product.name,
      type: (params.type as any) ?? "ADJUSTMENT",
      quantity: params.quantity,
      balanceAfter: newStock,
      referenceType: "MANUAL",
      notes: params.notes || "Manual adjustment",
      userId: params.session.id,
    },
  });

  await writeAudit(businessId, params.session, "Inventory adjusted", "Product", product.id, `${product.name} adjusted by ${params.quantity}.`);
  return movement;
}

// ===== PURCHASES =====

export async function createPurchase(params: {
  session: CreatedBy;
  supplierId?: string | null;
  items: { productId?: string | null; productName: string; quantity: number; unitCost: number }[];
  paymentStatus?: string;
  paymentMethod?: string | null;
  amountPaid?: number;
  notes?: string | null;
  purchaseDate?: Date;
}) {
  const businessId = requireBusiness(params.session);
  if (!params.items.length) throw new Error("Purchase must have at least one item");

  const totalCost = params.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const amountPaid = Math.max(0, Number(params.amountPaid ?? 0));
  const paymentStatus = params.paymentStatus ?? (totalCost <= amountPaid ? "PAID" : amountPaid > 0 ? "PARTIALLY_PAID" : "UNPAID");

  const purchase = await prisma.purchase.create({
    data: {
      businessId,
      purchaseNumber: generateNumber("PUR"),
      supplierId: params.supplierId || null,
      purchaseDate: params.purchaseDate ?? new Date(),
      status: "PENDING",
      paymentStatus: (paymentStatus as any) ?? "UNPAID",
      paymentMethod: (params.paymentMethod as any) || null,
      totalCost,
      amountPaid,
      notes: params.notes,
      userId: params.session.id,
      items: {
        create: params.items.map((i) => ({
          productId: i.productId || null,
          productName: i.productName,
          quantity: i.quantity,
          unitCost: i.unitCost,
          lineTotal: i.quantity * i.unitCost,
        })),
      },
    },
  });

  await writeAudit(businessId, params.session, "Purchase created", "Purchase", purchase.id, `Purchase ${purchase.purchaseNumber} created (${totalCost}).`);
  return purchase;
}

export async function receivePurchase(params: { session: CreatedBy; purchaseId: string }) {
  const businessId = requireBusiness(params.session);
  const purchase = await prisma.purchase.findUnique({
    where: { id: params.purchaseId },
    include: { items: true },
  });
  if (!purchase || purchase.businessId !== businessId) throw new Error("Purchase not found");
  if (purchase.status === "RECEIVED") throw new Error("Purchase already received");
  if (purchase.status === "CANCELLED") throw new Error("Purchase is cancelled");

  // 1. Increase inventory
  for (const item of purchase.items) {
    if (item.productId) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        const newStock = product.currentStock + item.quantity;
        await prisma.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
        await prisma.inventoryMovement.create({
          data: {
            businessId,
            productId: product.id,
            productName: product.name,
            type: "PURCHASE",
            quantity: item.quantity,
            balanceAfter: newStock,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            notes: `Received ${purchase.purchaseNumber}`,
            userId: params.session.id,
          },
        });
      }
    }
  }

  // 2. Record money out if paid
  if (purchase.amountPaid > 0) {
    const last = await getLastBalance(businessId);
    await prisma.financialTransaction.create({
      data: {
        businessId,
        date: new Date(),
        type: "PURCHASE",
        category: "Purchases",
        description: `Purchase — ${purchase.purchaseNumber}`,
        referenceType: "PURCHASE",
        referenceId: purchase.id,
        moneyIn: 0,
        moneyOut: purchase.amountPaid,
        balance: Math.round((last - purchase.amountPaid) * 100) / 100,
        paymentMethod: purchase.paymentMethod,
        userId: params.session.id,
      },
    });
  }

  await prisma.purchase.update({ where: { id: purchase.id }, data: { status: "RECEIVED" } });
  await writeAudit(businessId, params.session, "Purchase received", "Purchase", purchase.id, `${purchase.purchaseNumber} received into inventory.`);
  await checkLowStock(businessId);
}

export async function cancelPurchase(params: { session: CreatedBy; purchaseId: string }) {
  const businessId = requireBusiness(params.session);
  const purchase = await prisma.purchase.findUnique({ where: { id: params.purchaseId } });
  if (!purchase || purchase.businessId !== businessId) throw new Error("Purchase not found");
  if (purchase.status === "RECEIVED") throw new Error("Cannot cancel a received purchase");

  await prisma.purchase.update({ where: { id: purchase.id }, data: { status: "CANCELLED" } });
  await writeAudit(businessId, params.session, "Purchase cancelled", "Purchase", purchase.id, `${purchase.purchaseNumber} cancelled.`);
}

// ===== EXPENSES =====

export async function createExpense(params: {
  session: CreatedBy;
  category: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  date?: Date;
  notes?: string | null;
  receiptUrl?: string | null;
}) {
  const businessId = requireBusiness(params.session);
  const expense = await prisma.expense.create({
    data: {
      businessId,
      expenseNumber: generateNumber("EXP"),
      category: params.category,
      description: params.description,
      amount: params.amount,
      paymentMethod: (params.paymentMethod as any) ?? "CASH",
      date: params.date ?? new Date(),
      notes: params.notes,
      receiptUrl: params.receiptUrl,
      userId: params.session.id,
    },
  });

  const last = await getLastBalance(businessId);
  await prisma.financialTransaction.create({
    data: {
      businessId,
      date: expense.date,
      type: "EXPENSE",
      category: params.category,
      description: params.description,
      referenceType: "EXPENSE",
      referenceId: expense.id,
      moneyIn: 0,
      moneyOut: params.amount,
      balance: Math.round((last - params.amount) * 100) / 100,
      paymentMethod: (params.paymentMethod as any) ?? "CASH",
      userId: params.session.id,
    },
  });

  await writeAudit(businessId, params.session, "Expense created", "Expense", expense.id, `${params.category}: ${params.amount} — ${params.description}`);

  if (params.amount >= 50000) {
    await notify(businessId, "large_expense", "Large expense", `Expense of ${params.amount} recorded (${params.category}).`);
  }
  return expense;
}

// ===== CUSTOMERS =====

export async function createCustomer(params: {
  session: CreatedBy;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  const businessId = requireBusiness(params.session);
  const customer = await prisma.customer.create({
    data: {
      businessId,
      name: params.name,
      phone: params.phone || null,
      email: params.email || null,
      notes: params.notes || null,
    },
  });
  await writeAudit(businessId, params.session, "Customer created", "Customer", customer.id, `${customer.name} added.`);
  return customer;
}

export async function updateCustomer(params: {
  session: CreatedBy;
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  const businessId = requireBusiness(params.session);
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      name: params.name,
      phone: params.phone || null,
      email: params.email || null,
      notes: params.notes || null,
    },
  });
  await writeAudit(businessId, params.session, "Customer edited", "Customer", customer.id, `${customer.name} updated.`);
  return customer;
}

// ===== SUPPLIERS =====

export async function createSupplier(params: {
  session: CreatedBy;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  const businessId = requireBusiness(params.session);
  const supplier = await prisma.supplier.create({
    data: {
      businessId,
      name: params.name,
      phone: params.phone || null,
      email: params.email || null,
      notes: params.notes || null,
    },
  });
  await writeAudit(businessId, params.session, "Supplier created", "Supplier", supplier.id, `${supplier.name} added.`);
  return supplier;
}

// ===== FINANCE: record manual adjustment =====

export async function recordFinancialAdjustment(params: {
  session: CreatedBy;
  type: string;
  description: string;
  moneyIn: number;
  moneyOut: number;
  paymentMethod?: string;
  category?: string;
}) {
  const businessId = requireBusiness(params.session);
  const last = await getLastBalance(businessId);
  const tx = await prisma.financialTransaction.create({
    data: {
      businessId,
      type: params.type as any,
      category: params.category ?? "Adjustment",
      description: params.description,
      referenceType: "MANUAL",
      moneyIn: params.moneyIn,
      moneyOut: params.moneyOut,
      balance: Math.round((last + params.moneyIn - params.moneyOut) * 100) / 100,
      paymentMethod: (params.paymentMethod as any) ?? null,
      date: new Date(),
      userId: params.session.id,
    },
  });
  await writeAudit(businessId, params.session, "Financial adjustment", "Transaction", tx.id, params.description);
  return tx;
}