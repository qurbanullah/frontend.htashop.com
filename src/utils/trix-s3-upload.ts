import { storageApi } from "@/api/storage";

/**
 * Upload an image to S3 via the backend's presigned URL flow.
 * Uses the standardized storageApi (ky client) — no raw fetch.
 *
 * The actual S3 PUT still uses XMLHttpRequest for progress tracking,
 * since ky/fetch don't support upload progress events.
 */
export async function uploadTrixImageToS3(
  file: File,
  progress?: (percent: number) => void,
): Promise<string> {
  // Step 1: Get presigned upload URL from backend
  const presigned = await storageApi.getPresignedUrl(
    file.name,
    file.type,
    "images/editor",
    file.size,
  );

  if (!presigned.success || !presigned.data?.url || !presigned.data?.key) {
    throw new Error(presigned.message || "Failed to get upload URL");
  }

  const { url: uploadUrl, key: s3Key } = presigned.data;

  // Step 2: Upload directly to S3 via XHR (needed for progress events)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    if (progress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) progress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

  // Step 3: Generate a download URL via the backend
  const downloadData = await storageApi.generateDownloadUrl(s3Key, 3600);

  if (downloadData.success && downloadData.data?.url) {
    return downloadData.data.url;
  }

  throw new Error("Failed to generate download URL for uploaded image");
}
