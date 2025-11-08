import { z } from 'zod';
import { supportedImageRatios } from './shared/runway.js';

// Convert Set to array for Zod enum
const supportedImageRatiosArray = Array.from(supportedImageRatios) as [string, ...string[]];

export const createJobSchema = z
  .object({
    mode: z.enum(['image-to-video', 'image-generation']),
    promptText: z.string().optional(),
    promptImage: z.string().url().optional(),
    model: z.string().optional(),
    ratio: z.enum(supportedImageRatiosArray).optional(),
  })
  .refine(
    (data) => {
      if (data.mode === 'image-generation') {
        return !!data.promptText && !!data.promptImage && !!data.ratio;
      }
      return true;
    },
    {
      message: 'promptText, promptImage, and ratio are required for image-generation mode',
    }
  );
