import { FileText, UploadCloud, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface FileUploadProps {
  file: File | null
  onChange: (f: File | null) => void
  accept?: string
  maxSizeMB?: number
  label?: string
  helpText?: string
  required?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  onChange,
  accept = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  maxSizeMB = 10,
  label = 'Manuscript File',
  helpText,
  required = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const inputId = React.useId()
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setError(null)
  }, [])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    if (!f) return
    if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Max ${maxSizeMB} MB.`)
      return
    }
    setError(null)
    onChange(f)
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const openFileDialog = () => inputRef.current?.click()

  const removeFile = () => onChange(null)

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block font-medium text-gray-700 text-sm dark:text-gray-200"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag & drop is a pointer-only enhancement; the Select file button is the accessible path */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          'mt-2 flex items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="h-8 w-8 text-gray-400" />
            <div className="text-gray-600 text-sm dark:text-gray-400">
              Drag & drop a file here, or
            </div>
            <Button variant="outline" size="sm" onClick={openFileDialog} type="button">
              Select file
            </Button>
            {helpText && <div className="mt-2 text-gray-500 text-xs">{helpText}</div>}
            <div className="mt-1 text-gray-400 text-xs">
              Allowed: PDF, DOC, DOCX — Max {maxSizeMB} MB
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-gray-500" />
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm dark:text-gray-100">
                  {file.name}
                </div>
                <div className="text-gray-500 text-xs">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={openFileDialog} type="button">
                Replace
              </Button>
              <Button variant="outline" size="sm" onClick={removeFile} type="button">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-red-600 text-xs">{error}</p>}
    </div>
  )
}

export default FileUpload
