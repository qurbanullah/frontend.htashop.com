import { CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type UploadProgress, type UploadResult, useS3Upload } from '@/hooks/storage/useS3Upload'
import { cn } from '@/lib/utils'

export interface S3FileUploadProps {
  directory: string
  accept?: string
  maxSize?: number // in bytes
  uploadFilename?: string | ((file: File) => string)
  value?: UploadResult | null
  onChange?: (result: UploadResult | null) => void
  label?: string
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
  chunkSize?: number
  showProgress?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

function validateFile(file: File, maxSize: number, accept: string): string | null {
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return `File size exceeds ${maxSizeMB}MB limit`
  }

  // Check file type if accept is specified
  if (accept && accept !== '*') {
    const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase())
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`
    const mimeType = file.type.toLowerCase()

    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileExt === type
      }
      if (type.includes('/*')) {
        return mimeType.startsWith(type.replace('/*', ''))
      }
      return mimeType === type
    })

    if (!isAccepted) {
      return `File type not allowed. Accepted: ${accept}`
    }
  }

  return null
}

// ── Sub-components (kept module-level so the main component stays branch-light) ──

interface UploadDropzoneProps {
  isDragging: boolean
  disabled: boolean
  error: string | null
  accept: string
  maxSize: number
  onClick: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

function UploadDropzone({
  isDragging,
  disabled,
  error,
  accept,
  maxSize,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: UploadDropzoneProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
        disabled && 'cursor-not-allowed opacity-50',
        error && 'border-red-300 dark:border-red-600'
      )}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
        <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or
        drag and drop
      </p>
      <p className="mt-1 text-gray-500 text-xs dark:text-gray-500">
        {accept !== '*' && `${accept.toUpperCase()} • `}
        Max {formatFileSize(maxSize)}
      </p>
    </button>
  )
}

function UploadProgressPanel({
  finalizing,
  progress,
  onCancel,
}: {
  finalizing: boolean
  progress: UploadProgress
  onCancel: () => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-900/20">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-700 text-sm dark:text-gray-300">
              {finalizing ? 'Finalizing upload...' : 'Uploading...'}
            </p>
            <p className="text-gray-500 text-xs dark:text-gray-400">
              {finalizing
                ? 'Waiting for server confirmation'
                : `${progress.percentage}% • ${formatFileSize(progress.loaded)} of ${formatFileSize(progress.total)}`}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
          Cancel
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full bg-blue-500 transition-all duration-300 ease-out ${finalizing ? 'animate-pulse' : ''}`}
          style={{ width: finalizing ? '100%' : `${progress.percentage}%` }}
        />
      </div>
    </div>
  )
}

function UploadedFilePanel({
  value,
  onRemove,
  disabled,
}: {
  value: UploadResult
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900/20">
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
              {value.original_filename}
            </p>
            {value.metadata && value.metadata.size != null && (
              <p className="text-gray-600 text-xs dark:text-gray-400">
                {formatFileSize(value.metadata.size)}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * S3FileUpload Component
 *
 * Handles direct-to-S3 file uploads with progress tracking and validation.
 * Supports both simple and multipart uploads automatically based on file size.
 */
export function S3FileUpload({
  directory,
  accept = '*',
  maxSize = 100 * 1024 * 1024, // 100MB default
  uploadFilename,
  value,
  onChange,
  label,
  description,
  required = false,
  disabled = false,
  className,
  chunkSize,
  showProgress = true,
}: S3FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const { upload, cancel, uploading, finalizing, progress } = useS3Upload({
    directory,
    chunkSize,
    uploadFilename,
    onProgress: (_prog) => {
      // Progress is tracked automatically
    },
    onComplete: (result) => {
      setError(null)
      onChange?.(result)
    },
    onError: (err) => {
      setError(err.message)
      onChange?.(null)
    },
  })

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null)

      const validationError = validateFile(file, maxSize, accept)
      if (validationError) {
        setError(validationError)
        return
      }

      // Start upload
      await upload(file)
    },
    [upload, maxSize, accept]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled && !uploading) {
        setIsDragging(true)
      }
    },
    [disabled, uploading]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled || uploading) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [disabled, uploading, handleFileSelect]
  )

  const handleRemove = () => {
    setError(null)
    onChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    cancel()
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('my-4 space-y-2', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block font-medium text-gray-700 text-sm dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {description && <p className="text-gray-500 text-sm dark:text-gray-400">{description}</p>}

      {/* Upload Area */}
      {!value && !uploading && (
        <UploadDropzone
          isDragging={isDragging}
          disabled={disabled}
          error={error}
          accept={accept}
          maxSize={maxSize}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}

      {/* Uploading State */}
      {uploading && showProgress && (
        <UploadProgressPanel finalizing={finalizing} progress={progress} onCancel={handleCancel} />
      )}

      {/* Uploaded File Display */}
      {value && !uploading && (
        <UploadedFilePanel value={value} onRemove={handleRemove} disabled={disabled} />
      )}

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  )
}
