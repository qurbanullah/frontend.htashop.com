import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, reloadOnceForChunkError } from '@/lib/chunk-reload'

describe('chunk load recovery', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('recognizes the browser and bundler chunk-load failures', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://htashop.com/assets/Home-x.js'
        )
      )
    ).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Failed to load module script'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/x.css'))).toBe(true)
    expect(isChunkLoadError(Object.assign(new Error('boom'), { name: 'ChunkLoadError' }))).toBe(
      true
    )
  })

  it('ignores ordinary application errors', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError(new TypeError('NetworkError when attempting to fetch resource.'))).toBe(
      false
    )
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError('something broke')).toBe(false)
  })

  it('reloads once, then suppresses a loop inside the guard window', () => {
    const reload = vi.fn()

    expect(reloadOnceForChunkError(reload, 1_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)

    expect(reloadOnceForChunkError(reload, 2_000)).toBe(false)
    expect(reloadOnceForChunkError(reload, 10_999)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)

    // A later deploy may recover the same way.
    expect(reloadOnceForChunkError(reload, 11_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('does not reload when it cannot persist the loop guard', () => {
    const reload = vi.fn()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    expect(reloadOnceForChunkError(reload, 1_000)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
