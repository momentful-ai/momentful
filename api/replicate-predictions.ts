import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createReplicatePrediction } from './replicate/predictions/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { version, input } = req.body;

    if (!version || !input) {
      return res.status(400).json({
        error: 'Missing required fields: version and input'
      });
    }

    const prediction = await createReplicatePrediction({ version, input });
    return res.status(201).json(prediction);
  } catch {
    return res.status(500).json({
      error: 'Failed to create Replicate prediction'
    });
  }
}
