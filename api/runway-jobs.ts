import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createJobSchema } from './validation.js';
import { createVideoTask } from './runway/jobs/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const task = await createVideoTask(parsed.data);
    return res.status(200).json({ taskId: task.id, status: 'processing' });
  } catch {
    return res.status(500).json({ error: 'Failed to create Runway task' });
  }
}
