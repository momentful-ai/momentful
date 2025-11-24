import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getReplicatePredictionStatus } from '../../shared/replicate.js';
import { uploadFromExternalUrl } from '../../shared/storage.js';
import { supabase } from '../../shared/supabase.js';

// Re-export for backward compatibility
export { getReplicatePredictionStatus };

// Helper to extract image URL from Replicate output
function extractImageUrlFromPrediction(prediction: { output?: string | string[] }): string | null {
  if (!prediction.output) return null;
  if (typeof prediction.output === 'string') return prediction.output;
  if (Array.isArray(prediction.output) && prediction.output.length > 0) {
    return typeof prediction.output[0] === 'string' ? prediction.output[0] : null;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id, userId, projectId, prompt, lineageId, parentId } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prediction id' });
  }

  try {
    const prediction = await getReplicatePredictionStatus(id);

    if (prediction?.error) {
      return res.status(500).json({ detail: prediction.error });
    }

    // If prediction succeeded and we have metadata, auto-upload and create DB record
    if (prediction.status === 'succeeded' && userId && projectId && prompt) {
      const imageUrl = extractImageUrlFromPrediction(prediction);
      
      if (imageUrl) {
        try {
          // Upload image to Supabase
          const uploadResult = await uploadFromExternalUrl(
            'user-uploads',
            imageUrl,
            userId as string,
            projectId as string,
            'image'
          );

          // Create database record
          const { data: createdImage, error: dbError } = await supabase
            .from('edited_images')
            .insert({
              project_id: projectId as string,
              user_id: userId as string,
              prompt: prompt as string,
              context: { productName: prompt },
              ai_model: 'flux-pro',
              storage_path: uploadResult.storagePath,
              width: uploadResult.width || 0,
              height: uploadResult.height || 0,
              lineage_id: lineageId as string || null,
              parent_id: parentId as string || null,
            })
            .select()
            .single();

          if (dbError) {
            console.error('Failed to create database record:', dbError);
            // Still return success with storage path even if DB insert fails
          }

          // Return prediction with storage path
          return res.status(200).json({
            ...prediction,
            storagePath: uploadResult.storagePath,
            width: uploadResult.width,
            height: uploadResult.height,
            editedImageId: createdImage?.id,
          });
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          // Return prediction without storage path if upload fails
          return res.status(200).json({
            ...prediction,
            uploadError: uploadError instanceof Error ? uploadError.message : 'Upload failed',
          });
        }
      }
    }

    return res.status(200).json(prediction);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get Replicate prediction status',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
