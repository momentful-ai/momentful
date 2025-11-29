import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRunwayTask } from '../../shared/runway.js';
import { extractErrorMessage, getStatusCodeFromError } from '../../shared/utils.js';
import { uploadFromExternalUrl } from '../../shared/storage.js';
import { generateAndUploadThumbnail } from '../../shared/thumbnail.js';
import { supabase } from '../../shared/supabase.js';

// Re-export for backward compatibility
export { getRunwayTask };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // Extract ID from query parameters (Vercel API routes pass dynamic params in query)
  const id = req.query?.id as string;
  if (!id) return res.status(400).json({ error: 'Missing task id' });

  try {
    const task = await getRunwayTask(id);
    console.log('task', task);

    // If task succeeded, find the video record and upload
    if (task.status === 'SUCCEEDED' && task.output) {
      const videoUrl = typeof task.output === 'string'
        ? task.output
        : Array.isArray(task.output)
          ? task.output[0]
          : null;

      if (videoUrl) {
        // Find the video record by runway_task_id
        const { data: videoRecord, error: findError } = await supabase
          .from('generated_videos')
          .select('*')
          .eq('runway_task_id', id)
          .eq('status', 'processing')
          .single();

        if (!findError && videoRecord) {
          try {
            // Upload video to Supabase
            const uploadResult = await uploadFromExternalUrl(
              'generated-videos',
              videoUrl,
              videoRecord.user_id,
              videoRecord.project_id,
              'video'
            );

            // Generate and upload thumbnail
            let thumbnailStoragePath: string | null = null;
            try {
              thumbnailStoragePath = await generateAndUploadThumbnail(
                videoUrl,
                videoRecord.user_id,
                videoRecord.project_id,
                videoRecord.id
              );
            } catch (thumbnailError) {
              console.error('Failed to generate thumbnail, continuing without it:', thumbnailError);
              // Continue without thumbnail - don't fail the entire video upload
            }

            // Update video record with storage path, thumbnail URL, and status
            const { error: updateError } = await supabase
              .from('generated_videos')
              .update({
                storage_path: uploadResult.storagePath,
                thumbnail_url: thumbnailStoragePath,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', videoRecord.id);

            if (updateError) {
              console.error('Failed to update video record:', updateError);
            }

            return res.status(200).json({
              id: task.id,
              status: task.status,
              output: task.output ?? null,
              progress: task.progress ?? null,
              failure: task.failure ?? null,
              failureCode: task.failureCode ?? null,
              createdAt: task.createdAt ?? null,
              storagePath: uploadResult.storagePath,
              thumbnailPath: thumbnailStoragePath,
              videoId: videoRecord.id,
            });
          } catch (uploadError) {
            console.error('Failed to upload video:', uploadError);
            // Update status to failed
            await supabase
              .from('generated_videos')
              .update({
                status: 'failed',
              })
              .eq('id', videoRecord.id);
            // Return task info without storagePath to indicate upload failure
            return res.status(200).json({
              id: task.id,
              status: task.status,
              output: task.output ?? null,
              progress: task.progress ?? null,
              failure: task.failure ?? null,
              failureCode: task.failureCode ?? null,
              createdAt: task.createdAt ?? null,
              uploadError: uploadError instanceof Error ? uploadError.message : 'Upload failed',
            });
          }
        }
      }
    }

    // If task failed, update video record status
    if (task.status === 'FAILED') {
      const { data: videoRecord } = await supabase
        .from('generated_videos')
        .select('id')
        .eq('runway_task_id', id)
        .eq('status', 'processing')
        .single();

      if (videoRecord) {
        await supabase
          .from('generated_videos')
          .update({
            status: 'failed',
          })
          .eq('id', videoRecord.id);
      }
    }

    return res.status(200).json({
      id: task.id,
      status: task.status,
      output: task.output ?? null,
      progress: task.progress ?? null,
      failure: task.failure ?? null,
      failureCode: task.failureCode ?? null,
      createdAt: task.createdAt ?? null,
    });
  } catch (error) {
    console.error('Error retrieving task:', error);

    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = 'Failed to retrieve task';

    if (error instanceof Error) {
      // Try to extract meaningful error message from the error response
      errorMessage = extractErrorMessage(error.message, 'Failed to retrieve task');
      statusCode = getStatusCodeFromError(error.message);
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
}
