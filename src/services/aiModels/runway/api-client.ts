/**
 * Runway API client for video generation
 * Handles communication with Runway's API endpoints
 */

/**
 * Parse Runway API error responses to extract the actual error message
 * Handles nested JSON error format like: {"error": "400 {\"error\":\"message\",\"docUrl\":\"...\"}"}
 */
function parseRunwayError(errorData: unknown): string | null {
  if (!errorData || typeof errorData !== 'object') {
    return null;
  }

  // Type guard to check if it's a record-like object
  const errorObj = errorData as Record<string, unknown>;

  // Try to extract the error message from various possible formats
  if (errorObj.error) {
    const errorString = errorObj.error;

    // Check if it's a nested JSON format (e.g., "400 {\"error\":\"message\",\"docUrl\":\"...\"}")
    if (typeof errorString === 'string' && errorString.includes('{"error":')) {
      try {
        // Extract the JSON part from the string
        const jsonMatch = errorString.match(/\{.*\}/);
        if (jsonMatch) {
          const nestedError = JSON.parse(jsonMatch[0]);
          if (nestedError.error) {
            return nestedError.error;
          }
        }
      } catch {
        // If parsing fails, fall back to the original error string
      }
    }

    // If it's a simple error message, return it
    if (typeof errorString === 'string') {
      return errorString;
    }
  }

  // If errorData has a direct message property
  if (errorObj.message) {
    return errorObj.message as string;
  }

  return null;
}

export interface CreateJobRequest {
  mode: 'image-to-video' | 'image-generation';
  promptText?: string;
  promptImage?: string;
  model?: string;
  ratio?: string;
  userId?: string;
  projectId?: string;
  name?: string;
  aiModel?: string;
  aspectRatio?: string;
  cameraMovement?: string;
  lineageId?: string;
  sourceIds?: Array<{ type: string; id: string }>;
}

export interface CreateImageJobRequest {
  mode: 'image-generation';
  promptImage: string;
  promptText: string;
  model?: string;
  ratio: string;
}

export interface JobResponse {
  taskId: string;
  status: string;
}

export interface JobStatusResponse {
  id: string;
  status: string;
  output?: unknown;
  progress?: number | null;
  failure?: string | null;
  failureCode?: string | null;
  createdAt?: string | null;
  storagePath?: string;
  videoId?: string;
  uploadError?: string;
}

/**
 * Create a new video generation job
 */
export async function createRunwayJob(data: CreateJobRequest): Promise<JobResponse> {
  const response = await fetch('/api/runway/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = parseRunwayError(errorData) || errorMessage;
    } catch {
      // If response is not JSON, use the status text
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a new image generation job
 */
export async function createRunwayImageJob(data: CreateImageJobRequest): Promise<JobResponse> {
  return createRunwayJob(data);
}

/**
 * Get the status of a video generation job
 */
export async function getRunwayJobStatus(taskId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/runway/jobs/${taskId}`);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = parseRunwayError(errorData) || errorMessage;
    } catch {
      // If response is not JSON, use the status text
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    // For 404 errors, this might be expected for mock task IDs
    if (response.status === 404) {
      errorMessage = 'Task not found - this may be a mock task ID';
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Extract image URL from Runway job status response
 * Handles different output formats (string URL, array of URLs, or nested object)
 */
export function extractImageUrl(statusResponse: JobStatusResponse): string | null {
  if (!statusResponse.output) {
    return null;
  }

  // If output is a string URL, return it
  if (typeof statusResponse.output === 'string') {
    return statusResponse.output;
  }

  // If output is an array, return the first URL
  if (Array.isArray(statusResponse.output)) {
    if (statusResponse.output.length > 0) {
      const firstOutput = statusResponse.output[0];
      if (typeof firstOutput === 'string') {
        return firstOutput;
      }
      // Handle array of objects with URL property
      if (typeof firstOutput === 'object' && firstOutput !== null && 'url' in firstOutput) {
        return (firstOutput as { url: string }).url;
      }
    }
    return null;
  }

  // If output is an object, try to extract URL from common properties
  if (typeof statusResponse.output === 'object' && statusResponse.output !== null) {
    const outputObj = statusResponse.output as Record<string, unknown>;
    if ('url' in outputObj && typeof outputObj.url === 'string') {
      return outputObj.url;
    }
    if ('imageUrl' in outputObj && typeof outputObj.imageUrl === 'string') {
      return outputObj.imageUrl;
    }
    if ('image_url' in outputObj && typeof outputObj.image_url === 'string') {
      return outputObj.image_url;
    }
  }

  return null;
}

/**
 * Poll for job completion (example implementation)
 */
export async function pollJobStatus(
  taskId: string,
  onProgress?: (status: string, progress?: number) => void,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<JobStatusResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await getRunwayJobStatus(taskId);
      onProgress?.(status.status, status.progress || undefined);

      if (status.status === 'SUCCEEDED') {
        return status;
      }

      if (status.status === 'FAILED') {
        throw new Error('Job failed');
      }

      // Handle case where task is not found (mock task IDs)
      if (status.status === 'Task not found - this may be a mock task ID') {
        // For mock responses, assume the task completed successfully after a few attempts
        if (i > 2) {
          return {
            id: taskId,
            status: 'SUCCEEDED',
            output: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          };
        }
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error('Error polling job status:', error);
      throw error;
    }
  }

  throw new Error('Job polling timed out');
}

/**
 * Update video statuses from Runway for a project
 * Retrieves all videos with Runway task IDs and updates their status from Runway API
 */
export async function updateProjectVideoStatuses(projectId: string): Promise<void> {
  try {
    // Get all generated videos for the project from our database
    const response = await fetch(`/api/generated-videos?projectId=${projectId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch project videos: ${response.statusText}`);
    }

    const videos = await response.json();

    // Filter videos that have Runway task IDs
    const videosWithRunwayTasks = videos.filter((video: { runway_task_id?: string }) => video.runway_task_id);

    if (videosWithRunwayTasks.length === 0) {
      console.log('No videos with Runway task IDs found for project');
      return;
    }

    // Update each video's status from Runway
    for (const video of videosWithRunwayTasks) {
      try {
        const runwayStatus = await getRunwayJobStatus(video.runway_task_id);

        // Map Runway status to our status format
        let status: 'processing' | 'completed' | 'failed' = 'processing';
        if (runwayStatus.status === 'SUCCEEDED') {
          status = 'completed';
        } else if (runwayStatus.status === 'FAILED') {
          status = 'failed';
        }

        // Update the video in our database if status changed
        if (video.status !== status) {
          await fetch(`/api/generated-videos/${video.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status,
              storage_path: runwayStatus.output ? (typeof runwayStatus.output === 'string'
                ? runwayStatus.output
                : Array.isArray(runwayStatus.output)
                  ? runwayStatus.output[0]
                  : null) : null,
              duration: runwayStatus.progress || null,
            }),
          });
        }
      } catch (error) {
        console.error(`Failed to update status for video ${video.id}:`, error);
        // Continue with other videos even if one fails
      }
    }
  } catch (error) {
    console.error('Error updating project video statuses:', error);
    throw error;
  }
}
