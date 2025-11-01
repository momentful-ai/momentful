import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRunwayTask } from './runway/jobs/[id].js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query?.id as string;
  if (!id) return res.status(400).json({ error: 'Missing task id' });

  try {
    const task = await getRunwayTask(id);
    return res.status(200).json({ id: task.id, status: task.status, output: task.output ?? null });
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve task' });
  }
}
