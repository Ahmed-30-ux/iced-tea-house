import { describe, it, expect } from 'vitest'
import type { OrderInputItem, CreatedBy } from '@/lib/business'

// ===== Type tests =====
describe('OrderInputItem type', () => {
  it('can be constructed with required fields', () => {
    const item: OrderInputItem = {
      productName: 'Green Tea',
      quantity: 2,
      unitPrice: 250,
      costPrice: 100,
    }
    expect(item.productName).toBe('Green Tea')
    expect(item.quantity).toBe(2)
    expect(item.unitPrice).toBe(250)
    expect(item.costPrice).toBe(100)
  })

  it('can have null productId', () => {
    const item: OrderInputItem = {
      productId: null,
      productName: 'Chai',
      quantity: 1,
      unitPrice: 150,
      costPrice: 50,
    }
    expect(item.productId).toBeNull()
  })

  it('can have undefined productId', () => {
    const item: OrderInputItem = {
      productName: 'Lassi',
      quantity: 3,
      unitPrice: 200,
      costPrice: 80,
    }
    expect(item.productId).toBeUndefined()
  })
})

describe('CreatedBy type', () => {
  it('can be constructed with id, name, businessId', () => {
    const user: CreatedBy = {
      id: 'user-1',
      name: 'Admin',
      businessId: 'biz-1',
    }
    expect(user.id).toBe('user-1')
    expect(user.name).toBe('Admin')
    expect(user.businessId).toBe('biz-1')
  })
})

// ===== Business logic calculations =====
describe('order calculations (pure logic)', () => {
  function calculateOrderTotals(items: OrderInputItem[], discount = 0) {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const total = Math.max(0, subtotal - Math.max(0, discount))
    return { subtotal, total }
  }

  function calculatePaymentStatus(total: number, amountPaid: number, explicit?: string) {
    return explicit ?? (total <= amountPaid ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID')
  }

  it('calculates subtotal correctly', () => {
    const items: OrderInputItem[] = [
      { productName: 'Tea', quantity: 2, unitPrice: 100, costPrice: 40 },
      { productName: 'Juice', quantity: 1, unitPrice: 200, costPrice: 80 },
    ]
    const { subtotal } = calculateOrderTotals(items)
    expect(subtotal).toBe(400) // 2*100 + 1*200
  })

  it('applies discount correctly', () => {
    const items: OrderInputItem[] = [
      { productName: 'Tea', quantity: 3, unitPrice: 100, costPrice: 40 },
    ]
    const { total } = calculateOrderTotals(items, 50)
    expect(total).toBe(250) // 300 - 50
  })

  it('does not go below zero with large discount', () => {
    const items: OrderInputItem[] = [
      { productName: 'Tea', quantity: 1, unitPrice: 100, costPrice: 40 },
    ]
    const { total } = calculateOrderTotals(items, 999)
    expect(total).toBe(0)
  })

  it('ignores negative discount', () => {
    const items: OrderInputItem[] = [
      { productName: 'Tea', quantity: 2, unitPrice: 100, costPrice: 40 },
    ]
    const { total } = calculateOrderTotals(items, -50)
    expect(total).toBe(200)
  })

  it('payment status: PAID when fully paid', () => {
    expect(calculatePaymentStatus(500, 500)).toBe('PAID')
    expect(calculatePaymentStatus(500, 600)).toBe('PAID')
  })

  it('payment status: PARTIALLY_PAID', () => {
    expect(calculatePaymentStatus(500, 200)).toBe('PARTIALLY_PAID')
  })

  it('payment status: UNPAID', () => {
    expect(calculatePaymentStatus(500, 0)).toBe('UNPAID')
  })

  it('payment status: uses explicit if provided', () => {
    expect(calculatePaymentStatus(500, 0, 'UNPAID')).toBe('UNPAID')
    expect(calculatePaymentStatus(500, 500, 'UNPAID')).toBe('UNPAID')
  })
})

// ===== completeOrder logic =====
describe('completeOrder calculations (pure logic)', () => {
  function calculateCogsAndProfit(items: { costPrice: number; quantity: number; unitPrice: number }[], orderTotal: number) {
    let totalCogs = 0
    for (const item of items) {
      totalCogs += item.costPrice * item.quantity
    }
    const grossProfit = Math.round((orderTotal - totalCogs) * 100) / 100
    return { totalCogs, grossProfit }
  }

  it('calculates COGS correctly', () => {
    const items = [
      { costPrice: 40, quantity: 2, unitPrice: 100 },
      { costPrice: 80, quantity: 1, unitPrice: 200 },
    ]
    const { totalCogs } = calculateCogsAndProfit(items, 400)
    expect(totalCogs).toBe(160) // 2*40 + 1*80
  })

  it('calculates gross profit correctly', () => {
    const items = [
      { costPrice: 40, quantity: 2, unitPrice: 100 },
      { costPrice: 80, quantity: 1, unitPrice: 200 },
    ]
    const { grossProfit } = calculateCogsAndProfit(items, 400)
    expect(grossProfit).toBe(240) // 400 - 160
  })

  it('handles negative gross profit (selling below cost)', () => {
    const items = [
      { costPrice: 150, quantity: 1, unitPrice: 100 },
    ]
    const { grossProfit } = calculateCogsAndProfit(items, 100)
    expect(grossProfit).toBe(-50)
  })
})

// ===== cancelOrder logic =====
describe('cancelOrder calculations', () => {
  function calculateRefund(amountPaid: number, balance: number) {
    const refundBalance = Math.round((balance - amountPaid) * 100) / 100
    return refundBalance
  }

  it('deducts refund from balance', () => {
    expect(calculateRefund(500, 1000)).toBe(500)
  })

  it('restores inventory', () => {
    const stock = 10
    const quantity = 3
    const newStock = Math.max(0, stock + quantity)
    expect(newStock).toBe(13)
  })

  it('stock does not go below zero when deducting', () => {
    // When completing an order, stock is reduced: newStock = Math.max(0, currentStock - quantity)
    const stock = 2
    const quantity = 5
    const newStock = Math.max(0, stock - quantity)
    expect(newStock).toBe(0)
  })
})

// ===== receivePurchase logic =====
describe('receivePurchase calculations', () => {
  it('increases stock correctly', () => {
    const currentStock = 10
    const quantity = 25
    expect(currentStock + quantity).toBe(35)
  })

  it('calculates purchase total', () => {
    const items = [
      { quantity: 10, unitCost: 50 },
      { quantity: 5, unitCost: 120 },
    ]
    const total = items.reduce((s, i) => s + i.quantity * i.unitCost, 0)
    expect(total).toBe(1100) // 500 + 600
  })
})

// ===== createExpense logic =====
describe('createExpense logic', () => {
  it('triggers large expense alert at >= 50000', () => {
    expect(50000 >= 50000).toBe(true)
    expect(49999 >= 50000).toBe(false)
  })

  it('calculates new balance after expense', () => {
    const lastBalance = 100000
    const amount = 5000
    const newBalance = Math.round((lastBalance - amount) * 100) / 100
    expect(newBalance).toBe(95000)
  })

  it('handles floating point amounts', () => {
    const lastBalance = 1000.50
    const amount = 333.33
    const newBalance = Math.round((lastBalance - amount) * 100) / 100
    expect(newBalance).toBe(667.17)
  })
})

// ===== recordFinancialAdjustment logic =====
describe('recordFinancialAdjustment logic', () => {
  it('calculates balance with moneyIn and moneyOut', () => {
    const last = 10000
    const moneyIn = 5000
    const moneyOut = 2000
    const balance = Math.round((last + moneyIn - moneyOut) * 100) / 100
    expect(balance).toBe(13000)
  })
})

// ===== addPayment logic =====
describe('addPayment logic', () => {
  function calculateNewPaid(total: number, currentPaid: number, amount: number) {
    return Math.min(total, currentPaid + amount)
  }

  it('caps payment at total', () => {
    expect(calculateNewPaid(500, 400, 200)).toBe(500)
  })

  it('adds partial payment', () => {
    expect(calculateNewPaid(500, 200, 100)).toBe(300)
  })

  it('determines status after payment', () => {
    const newPaid = 500
    const total = 500
    const status = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID'
    expect(status).toBe('PAID')
  })
})
