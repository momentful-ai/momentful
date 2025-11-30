import ffmpeg from 'fluent-ffmpeg';
import { supabase } from './supabase.js';

// Set ffmpeg path to the static binary for serverless environments
// Import ffmpeg-static synchronously and handle type casting
import ffmpegStatic from 'ffmpeg-static';
ffmpeg.setFfmpegPath(String(ffmpegStatic));

/**
 * Extract a thumbnail from a video URL
 * @param videoUrl - The URL of the video to extract thumbnail from
 * @param outputPath - The local file path where the thumbnail should be saved (temporary)
 * @returns Promise that resolves when thumbnail extraction is complete
 */
export function extractThumbnail(videoUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .on('end', () => resolve())
      .on('error', reject)
      .screenshots({
        timestamps: ['1'], // Take thumbnail at 1 second
        filename: outputPath,
        size: '320x?', // 320px width, maintain aspect ratio
      });
  });
}

/**
 * Generate a thumbnail from a video URL and upload it to Supabase storage
 * @param videoUrl - The URL of the video to generate thumbnail from
 * @param userId - The user ID for storage path organization
 * @param projectId - The project ID for storage path organization
 * @param videoId - The video ID for unique thumbnail naming
 * @returns Promise that resolves with the storage path of the uploaded thumbnail
 */
export async function generateAndUploadThumbnail(
  videoUrl: string,
  userId: string,
  projectId: string,
  videoId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `thumbnail-${videoId}-${timestamp}.jpg`;
  const tempFilePath = `/tmp/${fileName}`; // Use /tmp for Vercel serverless functions

  try {
    // Extract thumbnail from video
    await extractThumbnail(videoUrl, tempFilePath);

    // Upload thumbnail to Supabase storage
    // First, we need to read the file and upload it using the service role client
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(tempFilePath);

    const storagePath = `${userId}/${projectId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(storagePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });
    console.log('UPLOAD of Thumbnail was SUCCESSFUL. STORAGE PATH:', storagePath);
    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error('Thumbnail upload failed - no data returned');
    }

    // Clean up temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary thumbnail file:', cleanupError);
    }

    return storagePath;
  } catch (error) {
    // Clean up temporary file on error
    try {
      const fs = await import('fs');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary thumbnail file on error:', cleanupError);
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during thumbnail generation');
  }
}