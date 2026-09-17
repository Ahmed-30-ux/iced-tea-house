import { describe, it, expect } from 'vitest'
import {
  orderItemSchema,
  createOrderSchema,
  createProductSchema,
  updateProductSchema,
  createPurchaseSchema,
  createExpenseSchema,
  createCustomerSchema,
  loginSchema,
  parseForm,
} from '@/lib/validations'

// ===== orderItemSchema =====
describe('orderItemSchema', () => {
  it('accepts valid item', () => {
    const result = orderItemSchema.safeParse({
      productName: 'Green Tea',
      quantity: 2,
      unitPrice: 250,
      costPrice: 100,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty productName', () => {
    const result = orderItemSchema.safeParse({
      productName: '',
      quantity: 1,
      unitPrice: 100,
      costPrice: 50,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero quantity', () => {
    const result = orderItemSchema.safeParse({
      productName: 'Tea',
      quantity: 0,
      unitPrice: 100,
      costPrice: 50,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative quantity', () => {
    const result = orderItemSchema.safeParse({
      productName: 'Tea',
      quantity: -1,
      unitPrice: 100,
      costPrice: 50,
    })
    expect(result.success).toBe(false)
  })

  it('allows negative unitPrice and costPrice (schema allows nonnegative)', () => {
    const result = orderItemSchema.safeParse({
      productName: 'Tea',
      quantity: 1,
      unitPrice: -10,
      costPrice: -5,
    })
    // nonnegative means >= 0, so negative should fail
    expect(result.success).toBe(false)
  })

  it('allows null productId', () => {
    const result = orderItemSchema.safeParse({
      productId: null,
      productName: 'Tea',
      quantity: 1,
      unitPrice: 100,
      costPrice: 50,
    })
    expect(result.success).toBe(true)
  })
})

// ===== createOrderSchema =====
describe('createOrderSchema', () => {
  it('accepts valid order with one item', () => {
    const result = createOrderSchema.safeParse({
      items: [
        { productName: 'Tea', quantity: 1, unitPrice: 100, costPrice: 50 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty items array', () => {
    const result = createOrderSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = createOrderSchema.safeParse({
      customerId: 'cust-1',
      items: [{ productName: 'Tea', quantity: 1, unitPrice: 100, costPrice: 50 }],
      discount: 50,
      paymentMethod: 'CASH',
      amountPaid: 100,
      notes: 'Test order',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative discount', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productName: 'Tea', quantity: 1, unitPrice: 100, costPrice: 50 }],
      discount: -10,
    })
    expect(result.success).toBe(false)
  })
})

// ===== createProductSchema =====
describe('createProductSchema', () => {
  it('accepts valid product', () => {
    const result = createProductSchema.safeParse({
      name: 'Green Tea',
      sellingPrice: 250,
      costPrice: 100,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createProductSchema.safeParse({
      name: '',
      sellingPrice: 250,
      costPrice: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = createProductSchema.safeParse({
      name: 'Tea',
      sellingPrice: -10,
      costPrice: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative cost', () => {
    const result = createProductSchema.safeParse({
      name: 'Tea',
      sellingPrice: 250,
      costPrice: -10,
    })
    expect(result.success).toBe(false)
  })
})

// ===== updateProductSchema =====
describe('updateProductSchema', () => {
  it('requires id field', () => {
    const result = updateProductSchema.safeParse({
      name: 'Tea',
      sellingPrice: 250,
      costPrice: 100,
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid update with id', () => {
    const result = updateProductSchema.safeParse({
      id: 'prod-1',
      name: 'Green Tea',
      sellingPrice: 250,
      costPrice: 100,
    })
    expect(result.success).toBe(true)
  })
})

// ===== createPurchaseSchema =====
describe('createPurchaseSchema', () => {
  it('accepts valid purchase', () => {
    const result = createPurchaseSchema.safeParse({
      items: [{ productName: 'Tea Leaves', quantity: 50, unitCost: 200 }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty items', () => {
    const result = createPurchaseSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it('rejects zero quantity', () => {
    const result = createPurchaseSchema.safeParse({
      items: [{ productName: 'Tea', quantity: 0, unitCost: 100 }],
    })
    expect(result.success).toBe(false)
  })
})

// ===== createExpenseSchema =====
describe('createExpenseSchema', () => {
  it('accepts valid expense', () => {
    const result = createExpenseSchema.safeParse({
      category: 'Rent',
      description: 'Monthly rent',
      amount: 50000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty category', () => {
    const result = createExpenseSchema.safeParse({
      category: '',
      description: 'Rent',
      amount: 50000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = createExpenseSchema.safeParse({
      category: 'Rent',
      description: '',
      amount: 50000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = createExpenseSchema.safeParse({
      category: 'Rent',
      description: 'Monthly rent',
      amount: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = createExpenseSchema.safeParse({
      category: 'Rent',
      description: 'Monthly rent',
      amount: -1000,
    })
    expect(result.success).toBe(false)
  })
})

// ===== createCustomerSchema =====
describe('createCustomerSchema', () => {
  it('accepts valid customer', () => {
    const result = createCustomerSchema.safeParse({ name: 'Ahmed' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCustomerSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid email', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Ahmed',
      email: 'ahmed@test.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Ahmed',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string as email (allows clearing)', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Ahmed',
      email: '',
    })
    expect(result.success).toBe(true)
  })
})

// ===== loginSchema =====
describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({
      email: 'admin@test.com',
      password: 'secret',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'bad',
      password: 'secret',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@test.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

// ===== parseForm =====
describe('parseForm', () => {
  it('converts FormData to plain object', () => {
    const fd = new FormData()
    fd.append('name', 'Ahmed')
    fd.append('email', 'ahmed@test.com')
    const result = parseForm(fd)
    expect(result.name).toBe('Ahmed')
    expect(result.email).toBe('ahmed@test.com')
  })

  it('handles empty FormData', () => {
    const fd = new FormData()
    const result = parseForm(fd)
    expect(Object.keys(result)).toHaveLength(0)
  })
})
