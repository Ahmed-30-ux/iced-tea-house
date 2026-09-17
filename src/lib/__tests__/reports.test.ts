import { describe, it, expect, vi, afterEach } from 'vitest'
import { reportRange } from '@/lib/reports'

describe('reportRange', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('"today" returns start and end of today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15, 14, 30, 0))

    const range = reportRange('today')
    expect(range.from.getFullYear()).toBe(2025)
    expect(range.from.getMonth()).toBe(5)
    expect(range.from.getDate()).toBe(15)
    expect(range.from.getHours()).toBe(0)
    expect(range.from.getMinutes()).toBe(0)

    expect(range.to.getHours()).toBe(23)
    expect(range.to.getMinutes()).toBe(59)
    expect(range.to.getSeconds()).toBe(59)
    expect(range.to.getMilliseconds()).toBe(999)
  })

  it('"week" returns Monday of current week', () => {
    vi.useFakeTimers()
    // Wednesday June 18, 2025
    vi.setSystemTime(new Date(2025, 5, 18, 10, 0, 0))

    const range = reportRange('week')
    // Monday should be June 16
    expect(range.from.getDay()).toBe(1) // Monday
    expect(range.from.getDate()).toBe(16)
    expect(range.from.getHours()).toBe(0)
  })

  it('"month" returns first of current month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15, 10, 0, 0))

    const range = reportRange('month')
    expect(range.from.getFullYear()).toBe(2025)
    expect(range.from.getMonth()).toBe(5) // June
    expect(range.from.getDate()).toBe(1)
  })

  it('"lastMonth" returns full previous month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15, 10, 0, 0)) // June 15

    const range = reportRange('lastMonth')
    // from: May 1
    expect(range.from.getFullYear()).toBe(2025)
    expect(range.from.getMonth()).toBe(4) // May
    expect(range.from.getDate()).toBe(1)

    // to: May 31 23:59:59.999
    expect(range.to.getFullYear()).toBe(2025)
    expect(range.to.getMonth()).toBe(4) // May
    expect(range.to.getDate()).toBe(31)
    expect(range.to.getHours()).toBe(23)
    expect(range.to.getMinutes()).toBe(59)
    expect(range.to.getSeconds()).toBe(59)
  })

  it('"custom" with explicit dates', () => {
    const range = reportRange('custom', '2025-03-01', '2025-03-31')
    expect(range.from.getFullYear()).toBe(2025)
    expect(range.from.getMonth()).toBe(2) // March
    expect(range.from.getDate()).toBe(1)

    expect(range.to.getFullYear()).toBe(2025)
    expect(range.to.getMonth()).toBe(2)
    expect(range.to.getDate()).toBe(31)
  })

  it('"custom" without dates defaults to start of month to now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15, 10, 0, 0))

    const range = reportRange('custom')
    expect(range.from.getDate()).toBe(1)
    expect(range.from.getMonth()).toBe(5) // June
  })

  it('"unknown" key defaults to start of month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15, 10, 0, 0))

    const range = reportRange('nonexistent')
    expect(range.from.getDate()).toBe(1)
    expect(range.from.getMonth()).toBe(5) // June
  })

  it('from is always <= to', () => {
    for (const key of ['today', 'week', 'month', 'lastMonth']) {
      const range = reportRange(key)
      expect(range.from.getTime()).toBeLessThanOrEqual(range.to.getTime())
    }
  })

  it('"week" on Monday returns that same Monday', () => {
    vi.useFakeTimers()
    // Monday June 16, 2025
    vi.setSystemTime(new Date(2025, 5, 16, 10, 0, 0))

    const range = reportRange('week')
    expect(range.from.getDay()).toBe(1)
    expect(range.from.getDate()).toBe(16)
  })

  it('"week" on Sunday returns previous Monday', () => {
    vi.useFakeTimers()
    // Sunday June 22, 2025
    vi.setSystemTime(new Date(2025, 5, 22, 10, 0, 0))

    const range = reportRange('week')
    expect(range.from.getDay()).toBe(1)
    // Monday should be June 16
    expect(range.from.getDate()).toBe(16)
  })
})
