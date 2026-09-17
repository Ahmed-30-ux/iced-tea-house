import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatPercent,
  relativeTime,
  truncate,
  initials,
  generateNumber,
  startOfDay,
  endOfDay,
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
} from '@/lib/utils'

// ===== formatCurrency =====
describe('formatCurrency', () => {
  it('formats positive PKR amount', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1,500')
    // en-PK locale renders PKR as "Rs"
    expect(result).toMatch(/Rs|PKR/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })

  it('handles null', () => {
    const result = formatCurrency(null)
    expect(result).toContain('0')
  })

  it('handles undefined', () => {
    const result = formatCurrency(undefined)
    expect(result).toContain('0')
  })

  it('formats decimal amounts with 2 fraction digits', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1,234.56')
  })

  it('formats whole numbers with 0 fraction digits', () => {
    const result = formatCurrency(1000)
    expect(result).not.toMatch(/,00$/)
  })
})

// ===== formatNumber =====
describe('formatNumber', () => {
  it('formats integer with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats with decimal digits', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57')
  })

  it('handles null', () => {
    expect(formatNumber(null)).toBe('0')
  })

  it('handles undefined', () => {
    expect(formatNumber(undefined)).toBe('0')
  })

  it('defaults to 0 decimal places for whole numbers', () => {
    expect(formatNumber(100)).toBe('100')
  })
})

// ===== formatDate =====
describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date(2025, 0, 15) // Jan 15 2025
    const result = formatDate(d)
    expect(result).toBe('Jan 15, 2025')
  })

  it('formats an ISO string', () => {
    const result = formatDate('2025-06-20T10:30:00Z')
    expect(result).toContain('Jun')
    expect(result).toContain('2025')
  })

  it('returns em dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns em dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns em dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('supports custom format', () => {
    const d = new Date(2025, 2, 5)
    expect(formatDate(d, 'yyyy-MM-dd')).toBe('2025-03-05')
  })
})

// ===== formatDateTime =====
describe('formatDateTime', () => {
  it('formats with time component', () => {
    const d = new Date(2025, 0, 15, 14, 30)
    const result = formatDateTime(d)
    expect(result).toContain('Jan 15, 2025')
    expect(result).toContain('2:30 PM')
  })

  it('returns em dash for null', () => {
    expect(formatDateTime(null)).toBe('—')
  })
})

// ===== formatPercent =====
describe('formatPercent', () => {
  it('formats positive with + prefix', () => {
    expect(formatPercent(12.5)).toBe('+12.5%')
  })

  it('formats negative without + prefix', () => {
    expect(formatPercent(-5.3)).toBe('-5.3%')
  })

  it('formats zero with + prefix', () => {
    expect(formatPercent(0)).toBe('+0.0%')
  })

  it('handles null', () => {
    expect(formatPercent(null)).toBe('+0.0%')
  })

  it('handles undefined', () => {
    expect(formatPercent(undefined)).toBe('+0.0%')
  })
})

// ===== relativeTime =====
describe('relativeTime', () => {
  it('returns em dash for null', () => {
    expect(relativeTime(null)).toBe('—')
  })

  it('returns "just now" for very recent', () => {
    const now = new Date()
    expect(relativeTime(now)).toBe('just now')
  })

  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60000)
    expect(relativeTime(d)).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const d = new Date(Date.now() - 3 * 3600000)
    expect(relativeTime(d)).toBe('3h ago')
  })

  it('returns days ago', () => {
    const d = new Date(Date.now() - 7 * 86400000)
    expect(relativeTime(d)).toBe('7d ago')
  })

  it('returns formatted date for old dates', () => {
    const d = new Date(2023, 0, 1)
    const result = relativeTime(d)
    expect(result).toContain('2023')
  })
})

// ===== truncate =====
describe('truncate', () => {
  it('returns same string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and adds ellipsis', () => {
    const result = truncate('hello world', 5)
    expect(result).toBe('hell…')
    expect(result.length).toBe(5)
  })

  it('defaults to 60 chars', () => {
    const short = 'a'.repeat(50)
    expect(truncate(short)).toBe(short)
    const long = 'a'.repeat(100)
    expect(truncate(long).length).toBe(60)
  })
})

// ===== initials =====
describe('initials', () => {
  it('returns first letters of two words', () => {
    expect(initials('John Doe')).toBe('JD')
  })

  it('returns first letter of single word', () => {
    expect(initials('John')).toBe('J')
  })

  it('returns max 2 characters', () => {
    expect(initials('John Michael Doe')).toBe('JM')
  })

  it('handles lowercase', () => {
    expect(initials('john doe')).toBe('JD')
  })
})

// ===== generateNumber =====
describe('generateNumber', () => {
  it('starts with prefix', () => {
    const result = generateNumber('ORD')
    expect(result).toMatch(/^ORD-/)
  })

  it('has expected format prefix-YYMMDD-XXXX', () => {
    const result = generateNumber('PUR')
    const parts = result.split('-')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe('PUR')
    expect(parts[1]).toHaveLength(6) // YYMMDD
    expect(parts[2]).toHaveLength(4) // random 4 digits
  })

  it('generates unique numbers', () => {
    const nums = new Set(Array.from({ length: 100 }, () => generateNumber('ORD')))
    // With 4 random digits, collision is very unlikely
    expect(nums.size).toBeGreaterThan(95)
  })
})

// ===== startOfDay / endOfDay =====
describe('startOfDay', () => {
  it('sets time to midnight', () => {
    const d = new Date(2025, 5, 15, 14, 30, 45)
    const result = startOfDay(d)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
    expect(result.getDate()).toBe(15)
  })

  it('does not mutate original', () => {
    const d = new Date(2025, 5, 15, 14, 30)
    startOfDay(d)
    expect(d.getHours()).toBe(14)
  })
})

describe('endOfDay', () => {
  it('sets time to 23:59:59.999', () => {
    const d = new Date(2025, 5, 15, 10, 0)
    const result = endOfDay(d)
    expect(result.getHours()).toBe(23)
    expect(result.getMinutes()).toBe(59)
    expect(result.getSeconds()).toBe(59)
    expect(result.getMilliseconds()).toBe(999)
  })
})

// ===== startOfMonth =====
describe('startOfMonth', () => {
  it('returns first day of month at midnight', () => {
    const d = new Date(2025, 2, 15, 10, 30)
    const result = startOfMonth(d)
    expect(result.getDate()).toBe(1)
    expect(result.getMonth()).toBe(2) // March
    expect(result.getHours()).toBe(0)
  })
})

// ===== startOfWeek =====
describe('startOfWeek', () => {
  it('returns Monday of current week', () => {
    // Wed Jun 18 2025
    const d = new Date(2025, 5, 18)
    const result = startOfWeek(d)
    expect(result.getDay()).toBe(1) // Monday
    expect(result.getDate()).toBe(16)
  })

  it('wraps Sunday to previous Monday', () => {
    // Sunday Jun 22 2025
    const d = new Date(2025, 5, 22)
    const result = startOfWeek(d)
    expect(result.getDay()).toBe(1)
  })
})

// ===== addDays =====
describe('addDays', () => {
  it('adds days correctly', () => {
    const d = new Date(2025, 0, 1)
    const result = addDays(d, 10)
    expect(result.getDate()).toBe(11)
  })

  it('wraps months', () => {
    const d = new Date(2025, 0, 25)
    const result = addDays(d, 10)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getDate()).toBe(4)
  })
})

// ===== addMonths =====
describe('addMonths', () => {
  it('adds months correctly', () => {
    const d = new Date(2025, 0, 15)
    const result = addMonths(d, 3)
    expect(result.getMonth()).toBe(3) // April
  })

  it('wraps years', () => {
    const d = new Date(2025, 10, 1)
    const result = addMonths(d, 3)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(1) // February
  })
})

// ===== cn =====
describe('cn', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
  })

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'extra')
    expect(result).toContain('base')
    expect(result).not.toContain('hidden')
    expect(result).toContain('extra')
  })

  it('deduplicates tailwind classes', () => {
    const result = cn('px-4', 'px-8')
    expect(result).toBe('px-8')
  })
})
