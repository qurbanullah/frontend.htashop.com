import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'

export const storageApi = {
  async getPresignedUrl(
    filename: string,
    contentType: string,
    directory: string,
    fileSize?: number
  ) {
    const res = await api.post('storage/upload/presigned-url', {
      json: { filename, content_type: contentType, directory, max_file_size: fileSize },
      headers: authHeaders(),
    })
    return parseApiResponse<{
      url: string
      key: string
      upload_id?: string
      original_filename?: string
      bucket?: string
    }>(res)
  },

  async verifyUpload(key: string) {
    return parseApiResponse(
      await api.post('storage/verify', { json: { key }, headers: authHeaders() })
    )
  },

  async initiateMultipart(
    filename: string,
    contentType: string,
    directory: string,
    fileSize: number,
    chunkSize: number
  ) {
    const res = await api.post('storage/upload/multipart/initiate', {
      json: {
        filename,
        content_type: contentType,
        directory,
        file_size: fileSize,
        chunk_size: chunkSize,
      },
      headers: authHeaders(),
    })
    return parseApiResponse<{
      url: string
      key: string
      upload_id: string
      total_parts: number
      original_filename?: string
      bucket?: string
    }>(res)
  },

  async getMultipartPartUrls(key: string, uploadId: string, partNumbers: number[]) {
    const res = await api.post('storage/upload/multipart/part-urls', {
      json: { key, upload_id: uploadId, part_numbers: partNumbers },
      headers: authHeaders(),
    })
    return parseApiResponse<{ urls: Array<{ part_number: number; url: string }> }>(res)
  },

  async completeMultipart(
    key: string,
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[]
  ) {
    return parseApiResponse(
      await api.post('storage/upload/multipart/complete', {
        json: { key, upload_id: uploadId, parts },
        headers: authHeaders(),
      })
    )
  },

  async abortMultipart(key: string, uploadId: string) {
    return parseApiResponse(
      await api.post('storage/upload/multipart/abort', {
        json: { key, upload_id: uploadId },
        headers: authHeaders(),
      })
    )
  },

  async generateDownloadUrl(key: string, expiresIn = 3600) {
    return parseApiResponse<{ url: string }>(
      await api.post('storage/generate-url', {
        json: { key, expires_in: expiresIn },
        headers: authHeaders(),
      })
    )
  },
}
