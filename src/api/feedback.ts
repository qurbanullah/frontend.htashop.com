import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export type FeedbackType = 'feedback' | 'suggestion' | 'feature_request' | 'bug_report'

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

export interface FeedbackSubmitPayload {
  type: FeedbackType
  name: string
  email: string
  subject: string
  message: string
  priority?: FeedbackPriority
  page_url?: string
}

export interface FeedbackSubmission {
  uuid: string
  status: string
  [key: string]: unknown
}

/**
 * Submit a public feedback / suggestion / feature request / bug report.
 */
export const feedbackApi = {
  async submit(payload: FeedbackSubmitPayload): Promise<FeedbackSubmission> {
    const res = await api.post('feedback', {
      json: payload,
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<FeedbackSubmission>(res)
    return body.data as FeedbackSubmission
  },
}
