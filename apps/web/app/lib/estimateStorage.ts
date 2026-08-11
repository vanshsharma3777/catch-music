// lib/storageQuota.ts

export interface StorageStatus {
  usageMB: number;
  quotaMB: number;
  remainingMB: number;
  isLowStorage: boolean;
}

const LOW_STORAGE_THRESHOLD_MB = 3;

/**
 * Estimates storage usage using the StorageManager API.
 * Triggers a custom warning callback if remaining storage is below 3MB.
 */
export async function checkStorageQuota(
  onLowStorageWarning?: (status: StorageStatus) => void
): Promise<StorageStatus | null> {
  if (typeof window === "undefined" || !("navigator" in window) || !("storage" in navigator)) {
    console.warn("StorageManager API is not supported in this browser/environment.");
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage || 0;
    const quotaBytes = estimate.quota || 0;

    const usageMB = usageBytes / (1024 * 1024);
    const quotaMB = quotaBytes / (1024 * 1024);
    const remainingMB = Math.max(0, quotaMB - usageMB);

    const isLowStorage = remainingMB < LOW_STORAGE_THRESHOLD_MB;

    const status: StorageStatus = {
      usageMB: Number(usageMB.toFixed(2)),
      quotaMB: Number(quotaMB.toFixed(2)),
      remainingMB: Number(remainingMB.toFixed(2)),
      isLowStorage,
    };

    if (isLowStorage && onLowStorageWarning) {
      onLowStorageWarning(status);
    }

    return status;
  } catch (error) {
    console.error("Failed to estimate storage quota:", error);
    return null;
  }
}
