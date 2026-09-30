import { describe, expect, it } from 'vitest'
import { deepLinkToPath, pushPayloadToPath } from '@/lib/deep-link'

describe('deepLinkToPath', () => {
  describe('custom scheme (htashop://)', () => {
    it('re-joins the parsed host onto the path', () => {
      expect(deepLinkToPath('htashop://products/some-slug')).toBe('/products/some-slug')
    })

    it('accepts a host-less form with a triple slash', () => {
      expect(deepLinkToPath('htashop:///products/some-slug')).toBe('/products/some-slug')
    })

    it('keeps the query string', () => {
      expect(deepLinkToPath('htashop://products/some-slug?ref=email')).toBe(
        '/products/some-slug?ref=email'
      )
    })

    it('accepts a top-level section link', () => {
      expect(deepLinkToPath('htashop://account/orders')).toBe('/account/orders')
    })
  })

  describe('App Links / Universal Links', () => {
    it('accepts the apex host', () => {
      expect(deepLinkToPath('https://htashop.com/products/some-slug')).toBe('/products/some-slug')
    })

    it('accepts the www host', () => {
      expect(deepLinkToPath('https://www.htashop.com/blogs/hello')).toBe('/blogs/hello')
    })

    it('keeps the query string so tracked links survive', () => {
      expect(deepLinkToPath('https://htashop.com/products?page=2')).toBe('/products?page=2')
    })

    it('maps a bare host to the home route', () => {
      expect(deepLinkToPath('https://htashop.com/')).toBe('/')
    })
  })

  describe('rejects anything the app does not own', () => {
    it('ignores another host', () => {
      expect(deepLinkToPath('https://evil.example.com/products/some-slug')).toBeNull()
    })

    it('ignores a lookalike host', () => {
      expect(deepLinkToPath('https://htashop.com.evil.example/products')).toBeNull()
    })

    it('ignores non-http schemes', () => {
      expect(deepLinkToPath('javascript:alert(1)')).toBeNull()
      expect(deepLinkToPath('file:///etc/passwd')).toBeNull()
    })

    it('ignores malformed input', () => {
      expect(deepLinkToPath('not a url')).toBeNull()
      expect(deepLinkToPath('')).toBeNull()
    })
  })
})

describe('pushPayloadToPath', () => {
  it('accepts an in-app path under data.link', () => {
    expect(pushPayloadToPath({ link: '/account/orders/abc-123' })).toBe('/account/orders/abc-123')
  })

  it('accepts a full deep link under data.url', () => {
    expect(pushPayloadToPath({ url: 'htashop://products/some-slug' })).toBe('/products/some-slug')
    expect(pushPayloadToPath({ url: 'https://htashop.com/blogs/hello' })).toBe('/blogs/hello')
  })

  it('accepts data.path and keeps the query string', () => {
    expect(pushPayloadToPath({ path: '/products?page=2' })).toBe('/products?page=2')
  })

  it('prefers data.link when several keys are present', () => {
    expect(pushPayloadToPath({ link: '/first', url: 'https://htashop.com/second' })).toBe('/first')
  })

  it('rejects a protocol-relative path instead of following it off-app', () => {
    expect(pushPayloadToPath({ link: '//evil.example.com/x' })).toBeNull()
  })

  it('returns null when there is nothing usable', () => {
    expect(pushPayloadToPath(undefined)).toBeNull()
    expect(pushPayloadToPath(null)).toBeNull()
    expect(pushPayloadToPath('a string')).toBeNull()
    expect(pushPayloadToPath({})).toBeNull()
    expect(pushPayloadToPath({ link: '   ' })).toBeNull()
    expect(pushPayloadToPath({ link: 42 })).toBeNull()
  })

  it('ignores a destination on a host we do not own', () => {
    expect(pushPayloadToPath({ url: 'https://evil.example.com/account' })).toBeNull()
    expect(pushPayloadToPath({ url: 'javascript:alert(1)' })).toBeNull()
  })
})
