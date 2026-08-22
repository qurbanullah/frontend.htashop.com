import { useState, useCallback, useRef } from "react";
import { storageApi } from "@/api/storage";

const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024;
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  key: string;
  url?: string;
  bucket?: string;
  original_filename?: string;
  metadata?: { size: number; content_type: string; last_modified: string; etag: string };
  variants?: Record<string, string>; // suffix → object key (thumb, small, medium, large, original)
}

export interface UseS3UploadOptions {
  directory: string;
  chunkSize?: number;
  uploadFilename?: string | ((file: File) => string);
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

interface MultipartUploadState {
  uploadId: string;
  key: string;
  bucket: string;
  totalParts: number;
  uploadedParts: { PartNumber: number; ETag: string }[];
}

export function useS3Upload(options: UseS3UploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const multipartStateRef = useRef<MultipartUploadState | null>(null);

  const resolveUploadFilename = (file: File): string => {
    const { uploadFilename } = options;
    if (typeof uploadFilename === "function") {
      const resolved = uploadFilename(file)?.trim();
      if (resolved) return resolved;
    }
    if (typeof uploadFilename === "string") {
      const resolved = uploadFilename.trim();
      if (resolved) return resolved;
    }
    return file.name;
  };

  const updateProgress = useCallback(
    (loaded: number, total: number) => {
      const data: UploadProgress = { loaded, total, percentage: total > 0 ? Math.round((loaded / total) * 100) : 0 };
      setProgress(data);
      options.onProgress?.(data);
    },
    [options],
  );

  const simpleUpload = async (file: File): Promise<UploadResult> => {
    const uploadFilename = resolveUploadFilename(file);
    const contentType = file.type || "application/octet-stream";

    const presigned = await storageApi.getPresignedUrl(uploadFilename, contentType, options.directory, file.size);
    if (!presigned.success || !presigned.data) {
      throw new Error(presigned.message || "Failed to get upload URL");
    }

    const { url, key, original_filename } = presigned.data;
    abortControllerRef.current = new AbortController();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.timeout = 120000;

      xhr.upload.onprogress = (e) => {
        if (e.total && e.loaded === e.total) setFinalizing(true);
        if (e.total) updateProgress(e.loaded, e.total);
      };
      xhr.onload = () => {
        setFinalizing(false);
        xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.ontimeout = () => { setFinalizing(false); reject(new Error("Upload timed out.")); };
      xhr.onerror = () => { setFinalizing(false); reject(new Error("Upload network error")); };
      xhr.onabort = () => { setFinalizing(false); reject(new Error("Upload cancelled")); };
      abortControllerRef.current!.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(file);
    });

    // Optional: verify upload with backend
    try {
      const verifyData = await storageApi.verifyUpload(key);
      if (verifyData.success && verifyData.data) {
        return {
          key,
          original_filename: original_filename || uploadFilename,
          ...(verifyData.data as Record<string, unknown>),
        } as UploadResult;
      }
    } catch { /* verification is optional */ }

    return {
      key,
      original_filename: original_filename || uploadFilename,
      metadata: {
        size: file.size,
        content_type: contentType,
        last_modified: new Date().toISOString(),
        etag: "",
      },
    };
  };

  const multipartUpload = async (file: File): Promise<UploadResult> => {
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    const uploadFilename = resolveUploadFilename(file);
    const contentType = file.type || "application/octet-stream";

    const initiate = await storageApi.initiateMultipart(uploadFilename, contentType, options.directory, file.size, chunkSize);
    if (!initiate.success || !initiate.data) {
      throw new Error(initiate.message || "Failed to initiate upload");
    }

    const { upload_id, key, total_parts, original_filename } = initiate.data;
    multipartStateRef.current = {
      uploadId: upload_id,
      key,
      bucket: initiate.data.bucket || "",
      totalParts: total_parts,
      uploadedParts: [],
    };
    abortControllerRef.current = new AbortController();

    const batchSize = 5;
    let totalUploaded = 0;

    for (let batchStart = 1; batchStart <= total_parts; batchStart += batchSize) {
      if (abortControllerRef.current.signal.aborted) throw new Error("Upload cancelled");

      const batchEnd = Math.min(batchStart + batchSize - 1, total_parts);
      const partNumbers = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);
      const urlsData = await storageApi.getMultipartPartUrls(key, upload_id, partNumbers);

      if (!urlsData.success || !urlsData.data) {
        throw new Error("Failed to get part upload URLs");
      }

      const urls: Array<{ part_number: number; url: string }> = urlsData.data.urls;

      const uploadPromises = urls.map((partData) => {
        const partNumber = partData.part_number;
        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        return new Promise<{ PartNumber: number; ETag: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", partData.url, true);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.timeout = 120000;
          xhr.upload.onprogress = (e) => { updateProgress(totalUploaded + e.loaded, file.size); };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ PartNumber: partNumber, ETag: xhr.getResponseHeader("ETag")?.replace(/"/g, "") || "" });
            } else {
              reject(new Error(`Part ${partNumber} upload failed`));
            }
          };
          xhr.onerror = () => reject(new Error(`Part ${partNumber} network error`));
          xhr.onabort = () => reject(new Error("Upload cancelled"));
          abortControllerRef.current!.signal.addEventListener("abort", () => xhr.abort());
          xhr.send(chunk);
        });
      });

      const parts = await Promise.all(uploadPromises);
      totalUploaded += parts.reduce((sum, _, idx) => {
        const pn = batchStart + idx;
        return sum + (Math.min(pn * chunkSize, file.size) - (pn - 1) * chunkSize);
      }, 0);
      updateProgress(totalUploaded, file.size);
      multipartStateRef.current.uploadedParts.push(...parts);
    }

    const completeData = await storageApi.completeMultipart(key, upload_id, multipartStateRef.current.uploadedParts);
    if (!completeData.success) throw new Error("Failed to complete upload");

    multipartStateRef.current = null;

    return {
      key,
      original_filename: original_filename || uploadFilename,
      ...(completeData.data as Record<string, unknown>),
    } as UploadResult;
  };

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      if (uploading) throw new Error("Upload already in progress");
      try {
        setUploading(true);
        setError(null);
        setResult(null);
        updateProgress(0, file.size);
        const uploadResult = file.size > MULTIPART_THRESHOLD ? await multipartUpload(file) : await simpleUpload(file);
        setResult(uploadResult);
        options.onComplete?.(uploadResult);
        return uploadResult;
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        options.onError?.(e);
        return null;
      } finally {
        setUploading(false);
        setFinalizing(false);
        abortControllerRef.current = null;
      }
    },
    [uploading, options],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (multipartStateRef.current) {
      const state = multipartStateRef.current;
      multipartStateRef.current = null;
      storageApi.abortMultipart(state.key, state.uploadId).catch(() => {});
    }
    setUploading(false);
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
    setResult(null);
    abortControllerRef.current = null;
    multipartStateRef.current = null;
  }, []);

  return { upload, cancel, reset, uploading, finalizing, progress, error, result };
}
