export interface UserGenerationLimits {
  imagesRemaining: number;
  videosRemaining: number;
  imagesLimit: number;
  videosLimit: number;
}

/**
 * Fetch user's generation limits from the API
 */
export async function getUserGenerationLimits(userId: string): Promise<UserGenerationLimits> {
  const response = await fetch(`/api/generation-limits?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use the status text
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
