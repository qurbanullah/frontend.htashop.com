import { useCallback, useRef, useState } from 'react'
import { storageApi } from '@/api/storage'

const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024
const MULTIPART_THRESHOLD = 100 * 1024 * 1024

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  key: string
  url?: string
  bucket?: string
  original_filename?: string
  metadata?: { size: number; content_type: string; last_modified: string; etag: string }
  variants?: Record<string, string> // suffix → object key (thumb, small, medium, large, original)
}

export interface UseS3UploadOptions {
  directory: string
  chunkSize?: number
  uploadFilename?: string | ((file: File) => string)
  onProgress?: (progress: UploadProgress) => void
  onComplete?: (result: UploadResult) => void
  onError?: (error: Error) => void
}

interface MultipartUploadState {
  uploadId: string
  key: string
  bucket: string
  totalParts: number
  uploadedParts: { PartNumber: number; ETag: string }[]
}

function batchUploadedBytes(
  batchStart: number,
  partCount: number,
  chunkSize: number,
  fileSize: number
): number {
  let bytes = 0
  for (let i = 0; i < partCount; i += 1) {
    const pn = batchStart + i
    bytes += Math.min(pn * chunkSize, fileSize) - (pn - 1) * chunkSize
  }
  return bytes
}

async function uploadBatches(
  file: File,
  chunkSize: number,
  contentType: string,
  key: string,
  uploadId: string,
  totalParts: number,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number) => void
): Promise<{ PartNumber: number; ETag: string }[]> {
  const uploadedParts: { PartNumber: number; ETag: string }[] = []
  const batchSize = 5
  let totalUploaded = 0

  for (let batchStart = 1; batchStart <= totalParts; batchStart += batchSize) {
    if (signal.aborted) throw new Error('Upload cancelled')

    const batchEnd = Math.min(batchStart + batchSize - 1, totalParts)
    const partNumbers = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i)
    const urlsData = await storageApi.getMultipartPartUrls(key, uploadId, partNumbers)

    if (!urlsData.success || !urlsData.data) {
      throw new Error('Failed to get part upload URLs')
    }

    const uploadPromises = urlsData.data.urls.map((partData) => {
      const start = (partData.part_number - 1) * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      return uploadPart(
        partData.url,
        partData.part_number,
        file.slice(start, end),
        contentType,
        totalUploaded,
        file.size,
        signal,
        onProgress
      )
    })

    const parts = await Promise.all(uploadPromises)
    totalUploaded += batchUploadedBytes(batchStart, parts.length, chunkSize, file.size)
    onProgress(totalUploaded, file.size)
    uploadedParts.push(...parts)
  }

  return uploadedParts
}

function uploadPart(
  url: string,
  partNumber: number,
  chunk: Blob,
  contentType: string,
  totalUploaded: number,
  fileSize: number,
  signal: AbortSignal | null,
  onProgress: (loaded: number, total: number) => void
): Promise<{ PartNumber: number; ETag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.timeout = 120000
    xhr.upload.onprogress = (e) => {
      onProgress(totalUploaded + e.loaded, fileSize)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          PartNumber: partNumber,
          ETag: xhr.getResponseHeader('ETag')?.replace(/"/g, '') || '',
        })
      } else {
        reject(new Error(`Part ${partNumber} upload failed`))
      }
    }
    xhr.onerror = () => reject(new Error(`Part ${partNumber} network error`))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    signal?.addEventListener('abort', () => xhr.abort())
    xhr.send(chunk)
  })
}

export function useS3Upload(options: UseS3UploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const multipartStateRef = useRef<MultipartUploadState | null>(null)

  // Keep the latest options in a ref so memoized callbacks never need it in deps.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const resolveUploadFilename = useCallback((file: File): string => {
    const { uploadFilename } = optionsRef.current
    if (typeof uploadFilename === 'function') {
      const resolved = uploadFilename(file)?.trim()
      if (resolved) return resolved
    }
    if (typeof uploadFilename === 'string') {
      const resolved = uploadFilename.trim()
      if (resolved) return resolved
    }
    return file.name
  }, [])

  const updateProgress = useCallback((loaded: number, total: number) => {
    const data: UploadProgress = {
      loaded,
      total,
      percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
    }
    setProgress(data)
    optionsRef.current.onProgress?.(data)
  }, [])

  const simpleUpload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const uploadFilename = resolveUploadFilename(file)
      const contentType = file.type || 'application/octet-stream'

      const presigned = await storageApi.getPresignedUrl(
        uploadFilename,
        contentType,
        optionsRef.current.directory,
        file.size
      )
      if (!presigned.success || !presigned.data) {
        throw new Error(presigned.message || 'Failed to get upload URL')
      }

      const { url, key, original_filename } = presigned.data
      abortControllerRef.current = new AbortController()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url, true)
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.timeout = 120000

        xhr.upload.onprogress = (e) => {
          if (e.total && e.loaded === e.total) setFinalizing(true)
          if (e.total) updateProgress(e.loaded, e.total)
        }
        xhr.onload = () => {
          setFinalizing(false)
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed with status ${xhr.status}`))
        }
        xhr.ontimeout = () => {
          setFinalizing(false)
          reject(new Error('Upload timed out.'))
        }
        xhr.onerror = () => {
          setFinalizing(false)
          reject(new Error('Upload network error'))
        }
        xhr.onabort = () => {
          setFinalizing(false)
          reject(new Error('Upload cancelled'))
        }
        abortControllerRef.current?.signal.addEventListener('abort', () => xhr.abort())
        xhr.send(file)
      })

      // Optional: verify upload with backend
      try {
        const verifyData = await storageApi.verifyUpload(key)
        if (verifyData.success && verifyData.data) {
          return {
            key,
            original_filename: original_filename || uploadFilename,
            ...(verifyData.data as Record<string, unknown>),
          } as UploadResult
        }
      } catch {
        /* verification is optional */
      }

      return {
        key,
        original_filename: original_filename || uploadFilename,
        metadata: {
          size: file.size,
          content_type: contentType,
          last_modified: new Date().toISOString(),
          etag: '',
        },
      }
    },
    [resolveUploadFilename, updateProgress]
  )

  const multipartUpload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const chunkSize = optionsRef.current.chunkSize || DEFAULT_CHUNK_SIZE
      const uploadFilename = resolveUploadFilename(file)
      const contentType = file.type || 'application/octet-stream'

      const initiate = await storageApi.initiateMultipart(
        uploadFilename,
        contentType,
        optionsRef.current.directory,
        file.size,
        chunkSize
      )
      if (!initiate.success || !initiate.data) {
        throw new Error(initiate.message || 'Failed to initiate upload')
      }

      const { upload_id, key, total_parts, original_filename } = initiate.data
      multipartStateRef.current = {
        uploadId: upload_id,
        key,
        bucket: initiate.data.bucket || '',
        totalParts: total_parts,
        uploadedParts: [],
      }
      abortControllerRef.current = new AbortController()

      const uploadedParts = await uploadBatches(
        file,
        chunkSize,
        contentType,
        key,
        upload_id,
        total_parts,
        abortControllerRef.current.signal,
        updateProgress
      )
      multipartStateRef.current.uploadedParts.push(...uploadedParts)

      const completeData = await storageApi.completeMultipart(key, upload_id, uploadedParts)
      if (!completeData.success) throw new Error('Failed to complete upload')

      multipartStateRef.current = null

      return {
        key,
        original_filename: original_filename || uploadFilename,
        ...(completeData.data as Record<string, unknown>),
      } as UploadResult
    },
    [resolveUploadFilename, updateProgress]
  )

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      if (uploading) throw new Error('Upload already in progress')
      try {
        setUploading(true)
        setError(null)
        setResult(null)
        updateProgress(0, file.size)
        const uploadResult =
          file.size > MULTIPART_THRESHOLD ? await multipartUpload(file) : await simpleUpload(file)
        setResult(uploadResult)
        optionsRef.current.onComplete?.(uploadResult)
        return uploadResult
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        optionsRef.current.onError?.(e)
        return null
      } finally {
        setUploading(false)
        setFinalizing(false)
        abortControllerRef.current = null
      }
    },
    // options is intentionally excluded — accessed via optionsRef
    [uploading, updateProgress, simpleUpload, multipartUpload]
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (multipartStateRef.current) {
      const state = multipartStateRef.current
      multipartStateRef.current = null
      storageApi.abortMultipart(state.key, state.uploadId).catch(() => {})
    }
    setUploading(false)
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress({ loaded: 0, total: 0, percentage: 0 })
    setError(null)
    setResult(null)
    abortControllerRef.current = null
    multipartStateRef.current = null
  }, [])

  return { upload, cancel, reset, uploading, finalizing, progress, error, result }
}
