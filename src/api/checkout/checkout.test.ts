import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkoutApi } from '@/api/checkout'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/api/client', () => ({ default: mocks }))

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response
}

describe('checkoutApi.status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the checkout availability flag', async () => {
    mocks.get.mockResolvedValue(
      jsonResponse({
        success: true,
        message: 'ok',
        data: { enabled: false, message: 'Checkout is paused for verification.' },
      })
    )

    const status = await checkoutApi.status()

    expect(mocks.get).toHaveBeenCalledWith('checkout/status', { throwHttpErrors: false })
    expect(status).toEqual({
      enabled: false,
      message: 'Checkout is paused for verification.',
    })
  })

  it('surfaces the API message when checkout is blocked', async () => {
    mocks.get.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        message: 'Checkout is paused for payment verification.',
        checkout_enabled: false,
      }),
    } as unknown as Response)

    await expect(checkoutApi.status()).rejects.toThrow('paused for payment verification')
  })
})
