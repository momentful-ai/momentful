import type { VercelRequest, VercelResponse } from '@vercel/node';
import RunwayML from '@runwayml/sdk';
import { config } from 'dotenv';

/**
 * Extract meaningful error message from Runway API error responses
 * Handles various error formats and extracts the actual error message
 */
function extractErrorMessage(errorMessage: string): string {
  // If it's already a clean error message, return it
  if (!errorMessage.includes('HTTP') && !errorMessage.includes('{') && !errorMessage.includes('"')) {
    return errorMessage;
  }

  // Try to extract from HTTP error format: "HTTP 400: Bad Request - {"error":"message"}"
  if (errorMessage.includes('HTTP')) {
    const httpMatch = errorMessage.match(/HTTP \d+: ([^{]*)/);
    if (httpMatch && httpMatch[1]) {
      return httpMatch[1].trim();
    }
  }

  // Try to extract from JSON error format
  try {
    // Look for JSON-like content in the error message
    const jsonMatch = errorMessage.match(/\{.*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) {
        return parsed.error;
      }
      if (parsed.message) {
        return parsed.message;
      }
    }
  } catch {
    // If JSON parsing fails, continue with other methods
  }

  // If we can't extract a meaningful message, return a cleaned version
  return errorMessage.replace(/HTTP \d+: /, '').trim() || 'Failed to retrieve task';
}


const apiKey = process.env.RUNWAYML_API_SECRET || config().parsed?.RUNWAYML_API_SECRET;

if (!apiKey) {
  console.warn('⚠️  RUNWAYML_API_SECRET not set. Runway features will not work in development.');
}

export const runway = new RunwayML({ apiKey: apiKey || 'dummy-key' });

export type Mode = 'image-to-video' | 'text-to-video';

export async function getRunwayTask(taskId: string) {
  // Check if API key is available
  if (!apiKey) {
    throw new Error('RUNWAYML_API_SECRET not configured. Please set your Runway API key.');
  }

  return await runway.tasks.retrieve(taskId);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // Extract ID from query parameters (Vercel API routes pass dynamic params in query)
  const id = req.query?.id as string;
  if (!id) return res.status(400).json({ error: 'Missing task id' });

  try {
    const task = await getRunwayTask(id);
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
      errorMessage = extractErrorMessage(error.message);

      // Determine status code based on error content
      if (error.message.includes('HTTP 4')) {
        statusCode = 400;
      } else if (error.message.includes('HTTP 5')) {
        statusCode = 500;
      }
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
}
