import JSZip from 'jszip';
import { database } from './database';

/**
 * Downloads a single file from a URL
 * @param url - The URL of the file to download
 * @param filename - The filename to use for the downloaded file
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

interface BulkDownloadItem {
  url: string;
  filename: string;
}

/**
 * Downloads a file by storage path, resolving signed URLs as needed
 * Includes retry logic for expired URLs
 * @param storagePath - The storage path of the file to download
 * @param filename - The filename to use for the downloaded file
 * @param bucket - The storage bucket (defaults to 'user-uploads')
 */
export async function downloadFileByStoragePath(
  storagePath: string,
  filename: string,
  bucket: string = 'user-uploads'
): Promise<void> {
  try {
    // Check if it's already a full URL (e.g., external video URLs)
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      await downloadFile(storagePath, filename);
      return;
    }

    // For storage paths, get signed URL with retry logic for expired URLs
    let signedUrl = await database.storage.getSignedUrl(bucket, storagePath);

    // Try to download - check for expired URL (403/401)
    const response = await fetch(signedUrl);

    if (response.status === 403 || response.status === 401) {
      // URL expired, get fresh one and retry download
      signedUrl = await database.storage.getSignedUrl(bucket, storagePath);
      await downloadFile(signedUrl, filename);
    } else if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    } else {
      // Success - proceed with download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error('Error downloading file by storage path:', error);
    throw error;
  }
}

/**
 * Downloads multiple files as a ZIP archive
 * @param items - Array of items to download, each with url and filename
 * @param zipFilename - The name for the ZIP file (without .zip extension)
 * @param onProgress - Optional callback for progress updates (current, total)
 */
export async function downloadBulkAsZip(
  items: BulkDownloadItem[],
  zipFilename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (items.length === 0) {
    throw new Error('No items to download');
  }

  try {
    const zip = new JSZip();

    // Download each file and add to zip
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      onProgress?.(i + 1, items.length);

      try {
        const response = await fetch(item.url);
        if (!response.ok) {
          console.warn(`Failed to fetch ${item.filename}: ${response.statusText}`);
          continue;
        }

        const blob = await response.blob();
        zip.file(item.filename, blob);
      } catch (error) {
        console.error(`Error fetching ${item.filename}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      // Metadata contains progress info for ZIP creation
      if (onProgress && metadata.percent) {
        // We've already downloaded files, so this is just the ZIP creation phase
        // Report as additional progress beyond file count
      }
    });

    // Download the ZIP file
    const downloadUrl = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${zipFilename}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }
}

