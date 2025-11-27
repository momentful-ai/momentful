import type { VercelRequest, VercelResponse } from '@vercel/node';
import RunwayML from '@runwayml/sdk';
import { createJobSchema } from '../../validation.js';
import {
  createVideoTask,
  createImageTask,
  Mode,
} from '../../shared/runway.js';
import { extractErrorMessage, getStatusCodeFromError } from '../../shared/utils.js';
import { convertStoragePathsToSignedUrls } from '../../shared/external-signed-urls.js';
import { supabase } from '../../shared/supabase.js';

// Re-export for backward compatibility
export { createVideoTask, createImageTask };
export type { Mode };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('req.body', req.body);
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    // Extract metadata (for video jobs)
    const { userId, projectId, name, aiModel, aspectRatio, cameraMovement, duration, sourceIds } = req.body;

    // Convert any storage paths to signed URLs for external provider access
    const processedData = await convertStoragePathsToSignedUrls(parsed.data);

    // Check generation limit for video generation (only for image-to-video mode)
    if (userId && processedData.mode === 'image-to-video') {
      try {
        const { data: limits, error: limitsError } = await supabase
          .from('user_generation_limits')
          .select('videos_remaining')
          .eq('user_id', userId)
          .single();

        // If no record exists, create one with defaults
        let videosRemaining = 5;
        if (limitsError || !limits) {
          const { data: newLimits } = await supabase
            .from('user_generation_limits')
            .insert({
              user_id: userId,
              images_remaining: 10,
              videos_remaining: 5,
              images_limit: 10,
              videos_limit: 5,
            })
            .select()
            .single();
          videosRemaining = newLimits?.videos_remaining ?? 5;
        } else {
          videosRemaining = limits.videos_remaining;
        }

        if (videosRemaining <= 0) {
          return res.status(403).json({
            error: 'Video generation limit reached',
            message: `You've maxed out your video credits :(
Message the Momentful crew at hello@momentful.ai to unlock more.`,
          });
        }

        // Decrement the count before creating the job
        const { error: decrementError } = await supabase
          .from('user_generation_limits')
          .update({ videos_remaining: videosRemaining - 1 })
          .eq('user_id', userId);

        if (decrementError) {
          console.error('Failed to decrement video generation limit:', decrementError);
          // Continue with generation even if decrement fails, but log the error
        }
      } catch (limitCheckError) {
        console.error('Error during generation limit check:', limitCheckError);
        // Continue with generation even if limit check fails
      }
    }

    let task;

    if (processedData.mode === 'image-generation') {
      if (!processedData.promptImage) {
        return res.status(400).json({ error: 'promptImage required for image-generation mode' });
      }
      if (!processedData.promptText) {
        return res.status(400).json({ error: 'promptText required for image-generation mode' });
      }
      if (!processedData.ratio) {
        return res.status(400).json({ error: 'ratio required for image-generation mode' });
      }
      task = await createImageTask({
        promptImage: processedData.promptImage,
        promptText: processedData.promptText,
        model: processedData.model,
        ratio: processedData.ratio as RunwayML.TextToImageCreateParams['ratio'],
      });
    } else {
      task = await createVideoTask({
        mode: processedData.mode,
        promptText: processedData.promptText,
        promptImage: processedData.promptImage,
        model: processedData.model,
        ratio: processedData.ratio,
        duration: processedData.duration,
      });

      // For video jobs, create DB record with status='processing'
      if (userId && projectId && name && aiModel && aspectRatio) {
        try {
          const { data: createdVideo, error: dbError } = await supabase
            .from('generated_videos')
            .insert({
              project_id: projectId.trim(),
              user_id: userId.trim(),
              name: name.trim(),
              ai_model: aiModel,
              aspect_ratio: aspectRatio,
              camera_movement: cameraMovement || null,
              duration: duration || null,
              runway_task_id: task.id,
              storage_path: null, // Will be set when job completes
              status: 'processing',
            })
            .select()
            .single();

          if (dbError) {
            console.error('Failed to create database record for video job:', dbError);
            // Don't fail the request if DB insert fails
          } else if (createdVideo && sourceIds && Array.isArray(sourceIds)) {
            // Create video sources
            await Promise.all(sourceIds.map(async (source: { type: string; id: string }, index: number) => {
              await supabase.from('video_sources').insert({
                video_id: createdVideo.id,
                source_type: source.type,
                source_id: source.id,
                sort_order: index,
              });
            }));
          }
        } catch (dbError) {
          console.error('Error creating video record:', dbError);
          // Continue even if DB insert fails
        }
      }
    }

    return res.status(200).json({ taskId: task.id, status: 'processing' });
  } catch (error) {
    console.error('Error creating Runway task:', error);

    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = 'Failed to create Runway task';

    if (error instanceof Error) {
      // Try to extract meaningful error message from the error response
      errorMessage = extractErrorMessage(error.message, 'Failed to create Runway task');
      statusCode = getStatusCodeFromError(error.message);
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
}
