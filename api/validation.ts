import { z } from 'zod';

export const createJobSchema = z.object({
  mode: z.enum(['image-to-video', 'text-to-video']),
  promptText: z.string().optional(),
  promptImage: z.string().url().optional(),
});
