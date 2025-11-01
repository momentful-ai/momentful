import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRunwayTask } from '../../shared/runway.js';
import { extractErrorMessage, getStatusCodeFromError } from '../../shared/utils.js';

// Re-export for backward compatibility
export { getRunwayTask };
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // Extract ID from query parameters (Vercel API routes pass dynamic params in query)
  const id = req.query?.id as string;
  if (!id) return res.status(400).json({ error: 'Missing task id' });

  try {
    const task = await getRunwayTask(id);
    console.log('task', task);
    return res.status(200).json({
      id: task.id,
      status: task.status,
      output: task.output ?? null,
      progress: task.progress ?? null,
      failure: task.failure ?? null,
      failureCode: task.failureCode ?? null,
      createdAt: task.createdAt ?? null,
    });
  } catch (error) {
    console.error('Error retrieving task:', error);

    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = 'Failed to retrieve task';

    if (error instanceof Error) {
      // Try to extract meaningful error message from the error response
      errorMessage = extractErrorMessage(error.message, 'Failed to retrieve task');
      statusCode = getStatusCodeFromError(error.message);
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
}
