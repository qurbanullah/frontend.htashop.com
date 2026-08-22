import * as React from 'react'
import { Button } from './button'
import { X, FileText, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setError(null)
  }, [file])

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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          'mt-2 flex items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-800'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="w-8 h-8 text-gray-400" />
            <div className="text-sm text-gray-600 dark:text-gray-400">Drag & drop a file here, or</div>
            <Button variant="outline" size="sm" onClick={openFileDialog} type="button">
              Select file
            </Button>
            {helpText && <div className="text-xs text-gray-500 mt-2">{helpText}</div>}
            <div className="text-xs text-gray-400 mt-1">Allowed: PDF, DOC, DOCX — Max {maxSizeMB} MB</div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-gray-500" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={openFileDialog} type="button">
                Replace
              </Button>
              <Button variant="outline" size="sm" onClick={removeFile} type="button">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default FileUpload
