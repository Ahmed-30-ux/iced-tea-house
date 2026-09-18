import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string().min(1, "Product name required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  instructions: z.string().nullable().optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
  discount: z.number().nonnegative().optional(),
  paymentMethod: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  amountPaid: z.number().nonnegative().optional(),
  status: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  orderType: z.string().nullable().optional(),
  isComplimentary: z.boolean().optional(),
  source: z.string().nullable().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name required"),
  sku: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  sellingPrice: z.number().nonnegative("Price must be >= 0"),
  costPrice: z.number().nonnegative("Cost must be >= 0"),
  reorderLevel: z.number().nonnegative().optional(),
  supplier: z.string().nullable().optional(),
  openingStock: z.number().nonnegative().optional(),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string(),
  status: z.string().optional(),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().nullable().optional(),
        productName: z.string().min(1),
        quantity: z.number().positive(),
        unitCost: z.number().nonnegative(),
      })
    )
    .min(1),
  paymentStatus: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  amountPaid: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

export const createExpenseSchema = z.object({
  category: z.string().min(1, "Category required"),
  description: z.string().min(1, "Description required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string().optional(),
  notes: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().nullable().optional(),
  email: z.string().email().or(z.literal("")).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});

export function parseForm(formData: FormData) {
  const obj: Record<string, any> = {};
  for (const [k, v] of formData.entries()) {
    obj[k] = v;
  }
  return obj;
}