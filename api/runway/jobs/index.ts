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

// Re-export for backward compatibility
export { createVideoTask, createImageTask };
export type { Mode };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('req.body', req.body);
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    // Convert any storage paths to signed URLs for external provider access
    const processedData = await convertStoragePathsToSignedUrls(parsed.data);

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
      });
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
