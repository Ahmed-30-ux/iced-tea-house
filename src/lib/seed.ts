import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 0) {
  return Math.round((Math.random() * (max - min) + min) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function randomDate(startDays: number, endDays: number) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(startDays, endDays));
  d.setHours(randomInt(9, 21), randomInt(0, 59), randomInt(0, 59));
  return d;
}

function generateOrderNumber(i: number) {
  const d = new Date(Date.now() - randomInt(0, 30) * 86400000);
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `ORD-${stamp}-${String(1000 + i).padStart(4, "0")}`;
}

async function main() {
  console.log("Seeding database...");
  // Clean up
  await prisma.$executeRawUnsafe("DELETE FROM Notification");
  await prisma.$executeRawUnsafe("DELETE FROM AuditLog");
  await prisma.$executeRawUnsafe("DELETE FROM Sale");
  await prisma.$executeRawUnsafe("DELETE FROM Payment");
  await prisma.$executeRawUnsafe("DELETE FROM FinancialTransaction");
  await prisma.$executeRawUnsafe("DELETE FROM InventoryMovement");
  await prisma.$executeRawUnsafe("DELETE FROM Expense");
  await prisma.$executeRawUnsafe("DELETE FROM PurchaseItem");
  await prisma.$executeRawUnsafe("DELETE FROM Purchase");
  await prisma.$executeRawUnsafe("DELETE FROM Supplier");
  await prisma.$executeRawUnsafe("DELETE FROM OrderItem");
  await prisma.$executeRawUnsafe("DELETE FROM \"Order\"");
  await prisma.$executeRawUnsafe("DELETE FROM Customer");
  await prisma.$executeRawUnsafe("DELETE FROM Product");
  await prisma.$executeRawUnsafe("DELETE FROM Category");
  await prisma.$executeRawUnsafe("DELETE FROM User");
  await prisma.$executeRawUnsafe("DELETE FROM Business");

  // Business
  const business = await prisma.business.create({
    data: {
      name: "Iced Tea House",
      tagline: "Your business. One connected dashboard.",
      instagram: "@icedteahouse",
      currency: "PKR",
      isDemo: true,
    },
  });

  // Users
  const passwordHash = await bcrypt.hash("password123", 10);
  const owner = await prisma.user.create({
    data: {
      businessId: business.id,
      name: "Ali Khan",
      email: "owner@icedteahouse.com",
      passwordHash,
      role: "OWNER",
    },
  });
  const manager = await prisma.user.create({
    data: {
      businessId: business.id,
      name: "Sara Ahmed",
      email: "manager@icedteahouse.com",
      passwordHash,
      role: "MANAGER",
    },
  });
  const staff = await prisma.user.create({
    data: {
      businessId: business.id,
      name: "Hassan Raza",
      email: "staff@icedteahouse.com",
      passwordHash,
      role: "STAFF",
    },
  });

  // Categories
  const cats = await Promise.all([
    prisma.category.create({ data: { businessId: business.id, name: "Iced Teas", description: "Our signature iced tea collection" } }),
    prisma.category.create({ data: { businessId: business.id, name: "Specialty Drinks", description: "Premium blended and flavored drinks" } }),
    prisma.category.create({ data: { businessId: business.id, name: "Add-ons", description: "Extra toppings, shots, and extras" } }),
    prisma.category.create({ data: { businessId: business.id, name: "Snacks", description: "Light bites and accompaniments" } }),
  ]);

  // Products
  const productData = [
    { name: "Classic Iced Tea", sku: "CIT-500", catId: cats[0].id, price: 350, cost: 85, stock: 180, reorder: 40, supplier: "TeaCo Pakistan" },
    { name: "Peach Iced Tea", sku: "PIT-500", catId: cats[0].id, price: 400, cost: 110, stock: 150, reorder: 35, supplier: "TeaCo Pakistan" },
    { name: "Lemon Iced Tea", sku: "LIT-500", catId: cats[0].id, price: 380, cost: 95, stock: 120, reorder: 30, supplier: "TeaCo Pakistan" },
    { name: "Mint Iced Tea", sku: "MIT-500", catId: cats[0].id, price: 370, cost: 90, stock: 90, reorder: 25, supplier: "TeaCo Pakistan" },
    { name: "Berry Iced Tea", sku: "BIT-500", catId: cats[0].id, price: 420, cost: 130, stock: 75, reorder: 20, supplier: "FruitFarm Lahore" },
    { name: "Honey Iced Tea", sku: "HIT-500", catId: cats[0].id, price: 390, cost: 100, stock: 65, reorder: 20, supplier: "TeaCo Pakistan" },
    { name: "Mango Iced Tea", sku: "MGIT-750", catId: cats[0].id, price: 450, cost: 140, stock: 100, reorder: 25, supplier: "FruitFarm Lahore" },
    { name: "Rose Iced Tea", sku: "RIT-500", catId: cats[0].id, price: 380, cost: 95, stock: 55, reorder: 20, supplier: "TeaCo Pakistan" },
    { name: "Large Iced Tea (750ml)", sku: "LIT-750", catId: cats[0].id, price: 500, cost: 120, stock: 200, reorder: 50, supplier: "TeaCo Pakistan" },
    { name: "Small Iced Tea (300ml)", sku: "SIT-300", catId: cats[0].id, price: 250, cost: 65, stock: 250, reorder: 60, supplier: "TeaCo Pakistan" },
    { name: "Passion Fruit Smoothie", sku: "PFS-500", catId: cats[1].id, price: 550, cost: 180, stock: 40, reorder: 15, supplier: "FruitFarm Lahore" },
    { name: "Strawberry Lemonade", sku: "SLE-500", catId: cats[1].id, price: 480, cost: 150, stock: 30, reorder: 12, supplier: "FruitFarm Lahore" },
    { name: "Coconut Water Fresh", sku: "CWF-500", catId: cats[1].id, price: 420, cost: 160, stock: 20, reorder: 10, supplier: "FruitFarm Lahore" },
    { name: "Extra Boba Toppings", sku: "EBT-ADD", catId: cats[2].id, price: 60, cost: 15, stock: 500, reorder: 100, supplier: "BobaSupplies PK" },
    { name: "Whipped Cream Shot", sku: "WCS-ADD", catId: cats[2].id, price: 50, cost: 12, stock: 200, reorder: 50, supplier: "General Supply Co" },
    { name: "Brown Sugar Drizzle", sku: "BSD-ADD", catId: cats[2].id, price: 40, cost: 8, stock: 180, reorder: 40, supplier: "General Supply Co" },
    { name: "Cheese Foam Top", sku: "CFT-ADD", catId: cats[2].id, price: 80, cost: 25, stock: 60, reorder: 15, supplier: "General Supply Co" },
    { name: "Butter Croissant", sku: "BCR-SNK", catId: cats[3].id, price: 280, cost: 100, stock: 50, reorder: 15, supplier: "FreshBake Karachi" },
    { name: "Chicken Wrap", sku: "CHW-SNK", catId: cats[3].id, price: 350, cost: 140, stock: 30, reorder: 10, supplier: "FreshBake Karachi" },
  ];

  const products = [];
  for (const pd of productData) {
    const p = await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: pd.catId,
        name: pd.name,
        sku: pd.sku,
        sellingPrice: pd.price,
        costPrice: pd.cost,
        currentStock: pd.stock,
        reorderLevel: pd.reorder,
        supplier: pd.supplier,
      },
    });
    products.push({ ...p, reorderLevel: pd.reorder, currentStock: pd.stock });
  }

  // Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { businessId: business.id, name: "TeaCo Pakistan", phone: "0321-5550101", email: "orders@teaco.pk" } }),
    prisma.supplier.create({ data: { businessId: business.id, name: "FruitFarm Lahore", phone: "0300-5550202", email: "supply@fruitfarm.pk" } }),
    prisma.supplier.create({ data: { businessId: business.id, name: "BobaSupplies PK", phone: "0312-5550303", email: "sales@bobasupplies.pk" } }),
    prisma.supplier.create({ data: { businessId: business.id, name: "General Supply Co", phone: "0333-5550404", email: "info@gensupply.pk" } }),
    prisma.supplier.create({ data: { businessId: business.id, name: "FreshBake Karachi", phone: "0345-5550505", email: "orders@freshbake.pk" } }),
  ]);

  // Customers
  const customerData = [
    { name: "Fatima Shah", phone: "0300-1234567", email: "fatima@email.com" },
    { name: "Omar Malik", phone: "0321-2345678", email: "omar.malik@email.com" },
    { name: "Zara Patel", phone: "0333-3456789", email: "zara.p@email.com" },
    { name: "Bilal Husain", phone: "0345-4567890", email: "bilal.h@email.com" },
    { name: "Ayesha Khan", phone: "0312-5678901", email: "ayesha.k@email.com" },
    { name: "Danish Rehman", phone: "0300-6789012", email: "danish.r@email.com" },
    { name: "Nadia Yousuf", phone: "0321-7890123", email: "nadia.y@email.com" },
    { name: "Kamran Ali", phone: "0333-8901234", email: "kamran.a@email.com" },
    { name: "Sana Mirza", phone: "0345-9012345", email: "sana.m@email.com" },
    { name: "Ahmed Naveed", phone: "0312-0123456", email: "ahmed.n@email.com" },
    { name: "Walk-in Customer", phone: null, email: null },
  ];

  const customers = [];
  for (const cd of customerData) {
    const c = await prisma.customer.create({
      data: { businessId: business.id, ...cd },
    });
    customers.push(c);
  }

  // Generate orders, sales, financial transactions, inventory movements
  console.log("Generating orders...");
  let financialBalance = 0;
  let orderIndex = 0;

  // Generate 80 orders over the past 30 days
  for (let day = 30; day >= 0; day--) {
    const ordersCount = day === 0 ? randomInt(5, 8) : randomInt(2, 6);
    for (let j = 0; j < ordersCount; j++) {
      orderIndex++;
      const itemsCount = randomInt(1, 4);
      const orderItems = [];
      let subtotal = 0;
      let totalCogs = 0;

      for (let k = 0; k < itemsCount; k++) {
        const prod = products[randomInt(0, Math.min(products.length - 1, 9))]; // bias toward tea products
        const qty = randomInt(1, 3);
        const unitPrice = prod.sellingPrice;
        const costPrice = prod.costPrice;
        subtotal += qty * unitPrice;
        totalCogs += qty * costPrice;
        orderItems.push({ productId: prod.id, productName: prod.name, quantity: qty, unitPrice, costPrice, lineTotal: qty * unitPrice });
      }

      const discount = orderItems.length > 2 ? randomInt(0, Math.floor(subtotal * 0.1)) : 0;
      const total = subtotal - discount;
      const isPaid = Math.random() > 0.15; // 85% paid
      const isCompleted = Math.random() > 0.1; // 90% completed

      const paymentMethod = ["CASH", "CASH", "CASH", "CARD", "BANK_TRANSFER"][randomInt(0, 4)];
      const paymentStatus = isPaid ? "PAID" : randomInt(0, 1) === 0 ? "UNPAID" : "PARTIALLY_PAID";
      const orderStatus = isCompleted ? "COMPLETED" : ["PENDING", "CONFIRMED", "PREPARING"][randomInt(0, 2)];
      const customer = customers[randomInt(0, customers.length - 1)];
      const orderDate = randomDate(day + 1, day);

      const order = await prisma.order.create({
        data: {
          businessId: business.id,
          orderNumber: generateOrderNumber(orderIndex),
          customerId: customer.id,
          orderDate,
          status: orderStatus as any,
          paymentStatus: paymentStatus as any,
          paymentMethod: paymentMethod as any,
          subtotal,
          discount,
          total,
          totalCogs: isCompleted ? totalCogs : 0,
          grossProfit: isCompleted ? Math.round((total - totalCogs) * 100) / 100 : 0,
          amountPaid: isPaid ? total : Math.random() > 0.5 ? Math.round(total * 0.5) : 0,
          userId: [owner.id, manager.id, staff.id][randomInt(0, 2)],
        },
      });

      for (const item of orderItems) {
        await prisma.orderItem.create({
          data: { orderId: order.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, costPrice: item.costPrice, lineTotal: item.lineTotal },
        });
      }

      if (orderStatus === "COMPLETED") {
        // Sales records
        for (const item of orderItems) {
          await prisma.sale.create({
            data: {
              businessId: business.id,
              orderId: order.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              revenue: item.lineTotal,
              cost: item.costPrice * item.quantity,
              profit: item.lineTotal - item.costPrice * item.quantity,
              date: orderDate,
            },
          });
        }

        // Deduct inventory
        for (const item of orderItems) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            product.currentStock = Math.max(0, product.currentStock - item.quantity);
          }
          // Inventory movement
          const lastMovement = await prisma.inventoryMovement.findFirst({
            where: { businessId: business.id, productId: item.productId },
            orderBy: { createdAt: "desc" },
          });
          const balance = lastMovement ? lastMovement.balanceAfter : products.find((p) => p.id === item.productId)?.currentStock ?? 0;
          const newBal = balance - item.quantity;
          await prisma.inventoryMovement.create({
            data: {
              businessId: business.id,
              productId: item.productId,
              productName: item.productName,
              type: "SALE",
              quantity: -item.quantity,
              balanceAfter: Math.max(0, newBal),
              referenceType: "ORDER",
              referenceId: order.id,
              notes: `Sold on ${order.orderNumber}`,
              userId: owner.id,
            },
          });
        }

        // Financial transaction for revenue
        if (isPaid) {
          financialBalance = Math.round((financialBalance + total) * 100) / 100;
          await prisma.financialTransaction.create({
            data: {
              businessId: business.id,
              date: orderDate,
              type: "SALE",
              category: "Sales",
              description: `Sale — ${order.orderNumber}`,
              referenceType: "ORDER",
              referenceId: order.id,
              moneyIn: total,
              moneyOut: 0,
              balance: financialBalance,
              paymentMethod: paymentMethod as any,
              userId: owner.id,
            },
          });
        }
      }
    }
  }

  // Update actual stock in DB based on our in-memory tracking
  for (const p of products) {
    await prisma.product.update({ where: { id: p.id }, data: { currentStock: Math.max(0, p.currentStock - randomInt(10, 50)) } });
  }

  // Purchases (some received, some pending)
  console.log("Generating purchases...");
  for (let i = 0; i < 8; i++) {
    const supplier = suppliers[randomInt(0, suppliers.length - 1)];
    const itemsCount = randomInt(1, 3);
    const purchaseItems: { productId: string; productName: string; quantity: number; unitCost: number; lineTotal: number }[] = [];
    let totalCost = 0;

    for (let k = 0; k < itemsCount; k++) {
      const prod = products[randomInt(0, 9)];
      const qty = randomInt(20, 100);
      const unitCost = prod.costPrice;
      totalCost += qty * unitCost;
      purchaseItems.push({ productId: prod.id, productName: prod.name, quantity: qty, unitCost, lineTotal: qty * unitCost });
    }

    const isReceived = i < 6;
    const isPaid = isReceived && Math.random() > 0.3;
    const amountPaid = isPaid ? totalCost : randomInt(0, 1) === 0 ? Math.round(totalCost * 0.5) : 0;

    const purchase = await prisma.purchase.create({
      data: {
        businessId: business.id,
        purchaseNumber: `PUR-${String(2401 + i).padStart(4, "0")}`,
        supplierId: supplier.id,
        purchaseDate: randomDate(30, 5),
        status: isReceived ? "RECEIVED" : "PENDING",
        paymentStatus: isPaid ? "PAID" : amountPaid > 0 ? "PARTIALLY_PAID" : "UNPAID",
        totalCost,
        amountPaid,
        userId: owner.id,
      },
    });

    for (const item of purchaseItems) {
      await prisma.purchaseItem.create({
        data: { purchaseId: purchase.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitCost: item.unitCost, lineTotal: item.lineTotal },
      });
    }

    if (isReceived && amountPaid > 0) {
      financialBalance = Math.round((financialBalance - amountPaid) * 100) / 100;
      await prisma.financialTransaction.create({
        data: {
          businessId: business.id,
          date: purchase.purchaseDate,
          type: "PURCHASE",
          category: "Purchases",
          description: `Purchase — ${purchase.purchaseNumber}`,
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          moneyIn: 0,
          moneyOut: amountPaid,
          balance: financialBalance,
          userId: owner.id,
        },
      });
    }

    if (isReceived) {
      for (const item of purchaseItems) {
        const product = products.find((p) => p.id === item.productId);
        if (product) product.currentStock += item.quantity;
        const lastMovement = await prisma.inventoryMovement.findFirst({
          where: { businessId: business.id, productId: item.productId },
          orderBy: { createdAt: "desc" },
        });
        const newBal = (lastMovement?.balanceAfter ?? 0) + item.quantity;
        await prisma.inventoryMovement.create({
          data: {
            businessId: business.id,
            productId: item.productId,
            productName: item.productName,
            type: "PURCHASE",
            quantity: item.quantity,
            balanceAfter: newBal,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            notes: `Received ${purchase.purchaseNumber}`,
            userId: owner.id,
          },
        });
      }
    }
  }

  // Expenses
  console.log("Generating expenses...");
  const expenseCategories = [
    { category: "Rent", descs: ["Monthly shop rent", "Storage room rent"], amounts: [45000, 12000] },
    { category: "Utilities", descs: ["Electricity bill", "Water bill", "Internet bill", "Gas bill"], amounts: [8500, 2000, 3500, 2800] },
    { category: "Salaries", descs: ["Staff salary - Ali", "Staff salary - Hassan", "Staff salary - Amira"], amounts: [25000, 20000, 18000] },
    { category: "Marketing", descs: ["Instagram promotion", "Flyer printing", "Google Ads"], amounts: [15000, 5000, 8000] },
    { category: "Transport", descs: ["Delivery fuel", "Supplier transport", "Driver salary"], amounts: [4000, 3500, 15000] },
    { category: "Packaging", descs: ["Cups bulk order", "Plastic straws", "Paper bags", "Lids and seals"], amounts: [12000, 4000, 6000, 3500] },
    { category: "Maintenance", descs: ["Fridge service", "AC repair", "Shelf replacement"], amounts: [8000, 15000, 6000] },
    { category: "Supplies", descs: ["Cleaning supplies", "Tissue and napkins", "Ice purchase"], amounts: [3000, 2000, 4500] },
  ];

  for (let day = 30; day >= 0; day--) {
    const expCount = randomInt(0, 2);
    for (let i = 0; i < expCount; i++) {
      const cat = expenseCategories[randomInt(0, expenseCategories.length - 1)];
      const descIdx = randomInt(0, cat.descs.length - 1);
      const amount = cat.amounts[descIdx] + randomInt(-500, 1000);
      const date = randomDate(day + 1, day);
      const paymentMethod = ["CASH", "BANK_TRANSFER", "CASH"][randomInt(0, 2)];

      const expense = await prisma.expense.create({
        data: {
          businessId: business.id,
          expenseNumber: `EXP-${String(24000 + orderIndex + i + 1).padStart(4, "0")}`,
          category: cat.category,
          description: cat.descs[descIdx],
          amount: Math.max(500, amount),
          paymentMethod: paymentMethod as any,
          date,
          userId: [owner.id, manager.id][randomInt(0, 1)],
        },
      });

      financialBalance = Math.round((financialBalance - expense.amount) * 100) / 100;
      await prisma.financialTransaction.create({
        data: {
          businessId: business.id,
          date,
          type: "EXPENSE",
          category: cat.category,
          description: expense.description,
          referenceType: "EXPENSE",
          referenceId: expense.id,
          moneyIn: 0,
          moneyOut: expense.amount,
          balance: financialBalance,
          paymentMethod: paymentMethod as any,
          userId: expense.userId,
        },
      });
    }
  }

  // Update final product stocks
  for (const p of products) {
    const stock = Math.max(0, p.currentStock + randomInt(-20, 20));
    await prisma.product.update({ where: { id: p.id }, data: { currentStock: stock } });
  }

  // Notifications
  const lowProducts = products.filter((p) => p.currentStock <= p.reorderLevel);
  for (const p of lowProducts.slice(0, 3)) {
    await prisma.notification.create({
      data: { businessId: business.id, type: "low_stock", title: "Low stock alert", message: `${p.name} is below reorder level (${p.currentStock} remaining).` },
    });
  }

  // Some unpaid order notifications
  const unpaidOrders = await prisma.order.findMany({ where: { businessId: business.id, paymentStatus: "UNPAID" }, take: 3 });
  for (const o of unpaidOrders) {
    await prisma.notification.create({
      data: { businessId: business.id, type: "unpaid_order", title: "Unpaid order", message: `Order ${o.orderNumber} is still unpaid.` },
    });
  }

  // Audit logs
  await prisma.auditLog.create({
    data: { businessId: business.id, userId: owner.id, userName: "Ali Khan", action: "System seeded", entityType: "System", entityId: null, details: "Demo data generated for Iced Tea House." },
  });

  console.log(`Seed complete.`);
  console.log(`Business: ${business.name} (${business.id})`);
  console.log(`Owner login: owner@icedteahouse.com / password123`);
  console.log(`Manager login: manager@icedteahouse.com / password123`);
  console.log(`Staff login: staff@icedteahouse.com / password123`);
}

export async function seedDatabase() {
  await main();
  return { ok: true };
}
