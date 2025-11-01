import { z } from 'zod';

const supportedImageRatios = [
  '1920:1080',
  '1080:1920',
  '1024:1024',
  '1360:768',
  '1080:1080',
  '1168:880',
  '1440:1080',
  '1080:1440',
  '1808:768',
  '2112:912',
  '1280:720',
  '720:1280',
  '720:720',
  '960:720',
  '720:960',
  '1680:720',
  '1344:768',
  '768:1344',
  '1184:864',
  '864:1184',
  '1536:672',
  '832x1248',
  '1248x832',
  '896x1152',
  '1152x896',
] as const;

export const createJobSchema = z
  .object({
    mode: z.enum(['image-to-video', 'text-to-video', 'image-generation']),
    promptText: z.string().optional(),
    promptImage: z.string().url().optional(),
    model: z.string().optional(),
    ratio: z.enum(supportedImageRatios).optional(),
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
