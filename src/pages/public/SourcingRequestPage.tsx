import { CheckCircle2, Loader2, Package, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type BomLineInput, bomApi } from '@/api/bom'
import { Seo } from '@/components/seo/Seo'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isApiError } from '@/lib/api-response'

interface LineState {
  id: number
  part_name: string
  part_number: string
  quantity: number
  unit: string
  source_url: string
}

let nextLineId = 0
const createLine = (): LineState => ({
  id: nextLineId++,
  part_name: '',
  part_number: '',
  quantity: 1,
  unit: '',
  source_url: '',
})

function firstFieldError(error: unknown): string | undefined {
  if (!isApiError(error) || !error.errors) return undefined
  const values = Object.values(error.errors).flat()
  return values.length > 0 ? values[0] : undefined
}

export default function SourcingRequestPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineState[]>([createLine()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const addLine = () => setLines((previous) => [...previous, createLine()])
  const removeLine = (index: number) =>
    setLines((previous) => previous.filter((_, i) => i !== index))
  const updateLine = (index: number, patch: Partial<LineState>) =>
    setLines((previous) => previous.map((line, i) => (i === index ? { ...line, ...patch } : line)))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const cleanedLines: BomLineInput[] = lines
      .filter((line) => line.part_name.trim() !== '')
      .map((line) => ({
        part_name: line.part_name.trim(),
        part_number: line.part_number.trim() || null,
        quantity: Math.max(1, line.quantity),
        unit: line.unit.trim() || null,
        source_url: line.source_url.trim() || null,
      }))

    if (cleanedLines.length === 0) {
      setError(t('sourcing.error_no_lines'))
      return
    }

    setSubmitting(true)
    try {
      const result = await bomApi.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        title: title.trim() || null,
        notes: notes.trim() || null,
        lines: cleanedLines,
      })
      setReference(result.reference_number)
    } catch (submitError) {
      const message =
        firstFieldError(submitError) ??
        (submitError instanceof Error ? submitError.message : t('sourcing.error_generic'))
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    return (
      <div className="shell mx-auto max-w-2xl px-4 py-12">
        <Seo title={t('sourcing.title')} noindex />
        <div className="rounded-2xl border border-gray-200 p-8 text-center dark:border-gray-800">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" aria-hidden="true" />
          <h1 className="mt-4 font-bold text-2xl text-gray-900 dark:text-white">
            {t('sourcing.success_title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t('sourcing.success_body', { reference })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="shell mx-auto max-w-3xl px-4 py-12">
      <Seo title={t('sourcing.title')} noindex />

      <h1 className="font-bold text-3xl text-gray-900 dark:text-white">{t('sourcing.title')}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{t('sourcing.subtitle')}</p>

      {error && (
        <Alert tone="error" className="mt-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bom-name">{t('sourcing.name_label')}</Label>
              <Input
                id="bom-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('sourcing.name_placeholder')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bom-email">{t('sourcing.email_label')}</Label>
              <Input
                id="bom-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('sourcing.email_placeholder')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bom-phone">{t('sourcing.phone_label')}</Label>
              <Input
                id="bom-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t('sourcing.phone_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bom-company">{t('sourcing.company_label')}</Label>
              <Input
                id="bom-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder={t('sourcing.company_placeholder')}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bom-title">{t('sourcing.project_label')}</Label>
            <Input
              id="bom-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('sourcing.project_placeholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bom-notes">{t('sourcing.notes_label')}</Label>
            <Textarea
              id="bom-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('sourcing.notes_placeholder')}
              rows={3}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg dark:text-white">
                {t('sourcing.lines_title')}
              </h2>
              <p className="text-gray-500 text-sm dark:text-gray-400">{t('sourcing.lines_hint')}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('sourcing.add_line')}
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <Package className="mt-1 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`bom-part-${index}`}>{t('sourcing.part_name_label')}</Label>
                      <Input
                        id={`bom-part-${index}`}
                        value={line.part_name}
                        onChange={(event) => updateLine(index, { part_name: event.target.value })}
                        placeholder={t('sourcing.part_name_placeholder')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bom-part-number-${index}`}>
                        {t('sourcing.part_number_label')}
                      </Label>
                      <Input
                        id={`bom-part-number-${index}`}
                        value={line.part_number}
                        onChange={(event) => updateLine(index, { part_number: event.target.value })}
                        placeholder={t('sourcing.part_number_placeholder')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bom-source-${index}`}>
                        {t('sourcing.source_url_label')}
                      </Label>
                      <Input
                        id={`bom-source-${index}`}
                        value={line.source_url}
                        onChange={(event) => updateLine(index, { source_url: event.target.value })}
                        placeholder={t('sourcing.source_url_placeholder')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bom-qty-${index}`}>{t('sourcing.quantity_label')}</Label>
                      <Input
                        id={`bom-qty-${index}`}
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(index, { quantity: Number(event.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bom-unit-${index}`}>{t('sourcing.unit_label')}</Label>
                      <Input
                        id={`bom-unit-${index}`}
                        value={line.unit}
                        onChange={(event) => updateLine(index, { unit: event.target.value })}
                        placeholder={t('sourcing.unit_placeholder')}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                    aria-label={t('sourcing.remove_line')}
                    className="shrink-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? t('sourcing.submitting') : t('sourcing.submit')}
        </Button>
      </form>
    </div>
  )
}
