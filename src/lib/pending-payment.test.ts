import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  forgetPendingPayment,
  readPendingPayment,
  rememberPendingPayment,
} from '@/lib/pending-payment'

/**
 * The hosted-checkout hand-off is the only thing tying a customer who left the
 * site to the payment we opened for them. If it silently fails, they return to a
 * blank "no payment in progress" screen — so the failure modes are pinned here.
 */

const RECORD = {
  paymentUuid: 'pay_123',
  orderUuid: 'ord_456',
  orderNumber: 'ORD-1',
  paymentMethod: 'safepay',
}

describe('pending payment hand-off', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('round-trips a hand-off', () => {
    rememberPendingPayment(RECORD)

    const read = readPendingPayment()

    expect(read).toMatchObject(RECORD)
    expect(typeof read?.startedAt).toBe('number')
  })

  it('returns null when nothing was remembered', () => {
    expect(readPendingPayment()).toBeNull()
  })

  it('expires a hand-off older than a day and clears it', () => {
    rememberPendingPayment({ ...RECORD, startedAt: 1_000 })

    // 25 hours later.
    expect(readPendingPayment(1_000 + 25 * 60 * 60 * 1000)).toBeNull()
    // The stale record is dropped, not left to resurface.
    expect(window.sessionStorage.getItem('htashop.pending_payment')).toBeNull()
  })

  it('still accepts a hand-off from within the last day', () => {
    rememberPendingPayment({ ...RECORD, startedAt: 1_000 })

    expect(readPendingPayment(1_000 + 23 * 60 * 60 * 1000)).toMatchObject(RECORD)
  })

  it('discards a malformed record instead of throwing', () => {
    window.sessionStorage.setItem('htashop.pending_payment', '{not json')

    expect(readPendingPayment()).toBeNull()
    expect(window.sessionStorage.getItem('htashop.pending_payment')).toBeNull()
  })

  it('discards a record that is missing identifiers', () => {
    window.sessionStorage.setItem(
      'htashop.pending_payment',
      JSON.stringify({ orderUuid: 'ord_456', startedAt: Date.now() })
    )

    expect(readPendingPayment()).toBeNull()
  })

  it('forgets on demand', () => {
    rememberPendingPayment(RECORD)
    forgetPendingPayment()

    expect(readPendingPayment()).toBeNull()
  })

  it('survives storage being unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => rememberPendingPayment(RECORD)).not.toThrow()
  })
})
