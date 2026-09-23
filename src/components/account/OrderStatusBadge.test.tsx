import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n/config'
import { OrderStatusBadge } from './OrderStatusBadge'

/**
 * The badge is the only place order statuses become human-readable, so it is the
 * one that has to prove the translation lookup actually resolves.
 */

/** Language changes re-render mounted trees, so they must run inside `act`. */
const setLang = (lng: string) =>
  act(async () => {
    await i18n.changeLanguage(lng)
  })

describe('OrderStatusBadge', () => {
  afterEach(async () => {
    await setLang('en')
  })

  it('renders the translated label for a known status', async () => {
    await setLang('en')
    render(<OrderStatusBadge status="shipped" />)
    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  it('translates known statuses into Urdu', async () => {
    await setLang('ur')
    render(<OrderStatusBadge status="delivered" />)
    expect(screen.getByText('ڈیلیور ہو گیا')).toBeInTheDocument()
  })

  it('translates known statuses into German', async () => {
    await setLang('de')
    render(<OrderStatusBadge status="cancelled" />)
    expect(screen.getByText('Storniert')).toBeInTheDocument()
  })

  it('falls back to the raw status for values we have no label for', async () => {
    await setLang('en')
    render(<OrderStatusBadge status="awaiting_stock" />)
    expect(screen.getByText('Awaiting_stock')).toBeInTheDocument()
  })

  it('never renders a raw i18n key', async () => {
    await setLang('ur')
    const { container } = render(<OrderStatusBadge status="refunded" />)
    expect(container.textContent).not.toContain('account.')
  })
})
