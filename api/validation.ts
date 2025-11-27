import { z } from 'zod';
import RunwayML from '@runwayml/sdk';
import { supportedImageRatios } from './shared/runway.js';

export const createJobSchema = z
  .object({
    mode: z.enum(['image-to-video', 'image-generation']),
    promptText: z.string().optional(),
    promptImage: z.string().url().optional(),
    model: z.string().optional(),
    ratio: z.string().optional(),
    duration: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.mode === 'image-generation') {
        return !!data.promptText && !!data.promptImage && !!data.ratio && supportedImageRatios.has(data.ratio as RunwayML.TextToImageCreateParams['ratio']);
      }
      return true;
    },
    {
      message: 'promptText, promptImage, and ratio are required for image-generation mode, and ratio must be supported',
    }
  );
