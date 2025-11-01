import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getReplicatePredictionStatus } from '../../shared/replicate.js';

// Re-export for backward compatibility
export { getReplicatePredictionStatus };


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prediction id' });
  }

  try {
    const prediction = await getReplicatePredictionStatus(id);

    if (prediction?.error) {
      return res.status(500).json({ detail: prediction.error });
    }

    return res.status(200).json(prediction);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get Replicate prediction status',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
