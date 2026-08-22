import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useS3Upload, type UploadResult } from "@/hooks/storage/useS3Upload";

export interface S3FileUploadProps {
  directory: string;
  accept?: string;
  maxSize?: number; // in bytes
  uploadFilename?: string | ((file: File) => string);
  value?: UploadResult | null;
  onChange?: (result: UploadResult | null) => void;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  chunkSize?: number;
  showProgress?: boolean;
}

/**
 * S3FileUpload Component
 *
 * Handles direct-to-S3 file uploads with progress tracking and validation.
 * Supports both simple and multipart uploads automatically based on file size.
 *
 * @example
 * ```tsx
 * const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
 *
 * <S3FileUpload
 *   directory="journals/jd/manuscripts/JD-2026-00001/submission/manuscript"
 *   accept=".pdf,.doc,.docx"
 *   maxSize={25 * 1024 * 1024} // 25MB
 *   value={uploadResult}
 *   onChange={setUploadResult}
 *   label="Manuscript File"
 *   description="Upload your manuscript in PDF or Word format"
 *   required
 * />
 * ```
 */
export function S3FileUpload({
  directory,
  accept = "*",
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
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, cancel, uploading, finalizing, progress } = useS3Upload({
    directory,
    chunkSize,
    uploadFilename,
    onProgress: (_prog) => {
      // Progress is tracked automatically
    },
    onComplete: (result) => {
      setError(null);
      onChange?.(result);
    },
    onError: (err) => {
      setError(err.message);
      onChange?.(null);
    },
  });

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type if accept is specified
    if (accept && accept !== "*") {
      const acceptedTypes = accept
        .split(",")
        .map((t) => t.trim().toLowerCase());
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();

      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExt === type;
        }
        if (type.includes("/*")) {
          return mimeType.startsWith(type.replace("/*", ""));
        }
        return mimeType === type;
      });

      if (!isAccepted) {
        return `File type not allowed. Accepted: ${accept}`;
      }
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Start upload
    await upload(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !uploading) {
        setIsDragging(true);
      }
    },
    [disabled, uploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, uploading],
  );

  const handleRemove = () => {
    setError(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    cancel();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-2 my-4", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* Upload Area */}
      {!value && !uploading && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-300 dark:border-red-600",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />

          <Upload className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {accept !== "*" && `${accept.toUpperCase()} • `}
            Max {formatFileSize(maxSize)}
          </p>
        </div>
      )}

      {/* Uploading State */}
      {uploading && showProgress && (
        <div className="p-4 space-y-3 border border-blue-300 rounded-lg dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0 space-x-3">
              <Loader2 className="w-5 h-5 text-blue-500 shrink-0 animate-spin" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate dark:text-gray-300">
                  {finalizing ? "Finalizing upload..." : "Uploading..."}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {finalizing
                    ? "Waiting for server confirmation"
                    : `${progress.percentage}% • ${formatFileSize(progress.loaded)} of ${formatFileSize(progress.total)}`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="shrink-0"
            >
              Cancel
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-300 ease-out bg-blue-500 ${finalizing ? "animate-pulse" : ""}`}
              style={{ width: finalizing ? "100%" : `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Uploaded File Display */}
      {value && !uploading && (
        <div className="p-4 border border-green-300 rounded-lg dark:border-green-600 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center flex-1 min-w-0 space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 dark:text-green-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                  {value.original_filename}
                </p>
                {value.metadata && value.metadata.size != null && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatFileSize(value.metadata.size)}
                  </p>
                )}
                {/* <p className="mt-1 text-xs text-gray-500 truncate dark:text-gray-500">
                  S3 Key: {value.key}
                </p> */}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 border border-red-300 rounded-lg dark:border-red-600 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
