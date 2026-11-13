import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n/config'
import { quoteApi } from '@/api/quotes'
import { ProductQuoteModal } from './ProductQuoteModal'
import { QuoteModal } from './QuoteModal'

vi.mock('@/api/industries', () => ({
  industriesApi: {
    list: vi.fn().mockResolvedValue([{ id: 7, code: 'semiconductors', name: 'Semiconductors' }]),
  },
}))

vi.mock('@/api/countries', () => ({
  countriesApi: {
    list: vi.fn().mockResolvedValue([{ id: 1, name: 'Pakistan', code: 'PK', code_alpha3: 'PAK' }]),
  },
}))

vi.mock('@/api/catalog', () => ({
  catalogApi: {
    products: vi.fn().mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'Raspberry Pi 5',
          route_key: 'raspberry-pi-5-xyz',
          seller_sku: 'HTA-RPI5',
          part_number: 'SC1111',
          model_number: 'RPI5',
          gtin: null,
          barcode: null,
          price: 20000,
          sale_price: null,
          currency: 'PKR',
          image_url: null,
          brands: [{ id: 1, uuid: 'b1', name: 'Raspberry Pi', slug: 'raspberry-pi' }],
        },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 8, total: 1, from: 1, to: 1 },
    }),
  },
}))

vi.mock('@/api/quotes', () => ({
  quoteApi: {
    submit: vi.fn().mockResolvedValue({ uuid: 'quote-1', reference_number: 'QR-42' }),
  },
}))

const PRODUCT = {
  id: 5,
  name: 'Arduino UNO R3',
  routeKey: 'arduino-uno-r3-abc123',
  sku: 'HTA-ARDUINO-UNO',
  partNumber: 'A000066',
  modelNumber: 'UNO-R3',
  gtin: '0123456789012',
  manufacturer: 'Arduino',
  brand: 'Arduino',
  variantName: 'ATmega328P',
  quantity: 3,
  unitPrice: 4500,
  currency: 'PKR',
  imageUrl: null,
}

const CARD_PRODUCT = {
  id: 11,
  uuid: '11111111-1111-1111-1111-111111111111',
  name: 'Arduino Uno',
  slug: 'arduino-uno',
  route_key: 'arduino-uno-11111111',
  seller_sku: 'HTA-UNO',
  part_number: 'PN-1',
  model_number: null,
  gtin: null,
  barcode: null,
  summary: null,
  status: 'active',
  is_active: true,
  price: 1200,
  sale_price: null,
  currency: 'PKR',
  image_url: null,
  brands: [{ id: 1, uuid: 'b1', name: 'Arduino', slug: 'arduino' }],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function renderModal(overrides: Partial<Parameters<typeof QuoteModal>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/products/arduino-uno-r3-abc123']}>
        <QuoteModal isOpen onClose={vi.fn()} product={PRODUCT} {...overrides} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** Completes step one and moves to the contact step. */
function goToUserStep() {
  fireEvent.change(screen.getByLabelText('What do you need? *'), {
    target: { value: 'Please quote 3 units including delivery to Lahore.' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Next/ }))
}

/** The send button lives in the footer and is associated with the form by id. */
function submitQuoteForm() {
  const form = document.getElementById('quote-form')
  if (!form) throw new Error('quote form was not rendered')
  fireEvent.submit(form)
}

/** Fills every required contact field on step two. */
async function fillContactFields() {
  fireEvent.change(screen.getByLabelText('First name *'), { target: { value: 'Ahmed' } })
  fireEvent.change(screen.getByLabelText('Last name *'), { target: { value: 'Khan' } })
  fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'ahmed@example.test' } })
  fireEvent.change(screen.getByLabelText('Organization *'), { target: { value: 'AgriTech' } })
  fireEvent.change(screen.getByLabelText('Job title *'), { target: { value: 'Engineer' } })
  fireEvent.change(screen.getByLabelText('City *'), { target: { value: 'Lahore' } })
  fireEvent.change(screen.getByLabelText('Postal code *'), { target: { value: '54000' } })

  const country = screen.getByLabelText('Country *')
  await screen.findByRole('option', { name: 'Pakistan' })
  fireEvent.change(country, { target: { value: 'Pakistan' } })
}

describe('QuoteModal', () => {
  beforeEach(() => {
    vi.mocked(quoteApi.submit).mockClear()
  })

  it('shows the product to quote and only the buyer-editable fields', () => {
    renderModal()

    expect(screen.getByText('Arduino UNO R3')).toBeInTheDocument()
    expect(screen.getByText('Arduino · HTA-ARDUINO-UNO · A000066')).toBeInTheDocument()
    expect(screen.getByText('Listed price: PKR 4,500')).toBeInTheDocument()

    expect(screen.getByLabelText('Product name *')).toHaveValue('Arduino UNO R3')
    expect(screen.getByLabelText(/Part No\./)).toHaveValue('A000066')
    expect(screen.getByLabelText('Quantity *')).toHaveValue(3)

    // Internal identifiers are sent with the request, not exposed as inputs.
    expect(screen.queryByLabelText('SKU')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Model No.')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('GTIN / barcode')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Manufacturer')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Target unit price')).not.toBeInTheDocument()
  })

  it('lets the buyer switch the product from the product card', async () => {
    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Change product' }))

    fireEvent.change(screen.getByPlaceholderText('Search by name, SKU or part number'), {
      target: { value: 'rasp' },
    })

    fireEvent.click(await screen.findByText('Raspberry Pi 5'))

    expect(screen.getByText('Raspberry Pi 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Product name *')).toHaveValue('Raspberry Pi 5')
    expect(screen.getByLabelText(/Part No\./)).toHaveValue('SC1111')
  })

  it('enables Next for a product opened from a catalogue card', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProductQuoteModal product={CARD_PRODUCT} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByLabelText('Product name *')).toHaveValue('Arduino Uno')
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
  })

  it('enables Next as soon as the product is chosen', () => {
    renderModal()

    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
  })

  it('returns to the product step when the description is missing on send', async () => {
    renderModal()

    // Step one only gates on the product, so the buyer can continue without a
    // description; the send action brings them back to fill it in.
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    await fillContactFields()
    submitQuoteForm()

    expect(
      await screen.findByText(
        'Tell us a little more about your requirement (at least 10 characters).'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What do you need?' })).toBeInTheDocument()
    expect(quoteApi.submit).not.toHaveBeenCalled()
  })

  it('blocks sending when contact details are missing', async () => {
    renderModal()
    goToUserStep()

    submitQuoteForm()

    expect(await screen.findByText('Please complete the required fields.')).toBeInTheDocument()
    expect(quoteApi.submit).not.toHaveBeenCalled()
  })

  it('submits the edited fields and the internal identifiers', async () => {
    renderModal()

    fireEvent.change(screen.getByLabelText(/Part No\./), {
      target: { value: 'A000066-CUSTOM' },
    })
    goToUserStep()
    await fillContactFields()

    submitQuoteForm()

    await waitFor(() => expect(quoteApi.submit).toHaveBeenCalledTimes(1))

    const payload = vi.mocked(quoteApi.submit).mock.calls[0]?.[0]

    if (!payload) throw new Error('quote payload was not submitted')

    expect(payload).toMatchObject({
      first_name: 'Ahmed',
      last_name: 'Khan',
      email: 'ahmed@example.test',
      organization: 'AgriTech',
      job_title: 'Engineer',
      country: 'Pakistan',
      city: 'Lahore',
      postal_code: '54000',
      quotable_type: 'App\\Models\\Product',
      quotable_id: 5,
    })
    expect(payload.requirements).toMatchObject({
      product_id: 5,
      product_name: 'Arduino UNO R3',
      part_number: 'A000066-CUSTOM',
      sku: 'HTA-ARDUINO-UNO',
      model_number: 'UNO-R3',
      gtin: '0123456789012',
      manufacturer: 'Arduino',
      brand: 'Arduino',
      variant_name: 'ATmega328P',
      quantity: 3,
    })
    expect(payload.requirements).not.toHaveProperty('target_price')

    expect(await screen.findByText(/QR-42/)).toBeInTheDocument()
  })
})
