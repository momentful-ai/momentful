/**
 * Shared utility functions for API endpoints
 */

/**
 * Extract meaningful error message from API error responses
 * Handles various error formats and extracts the actual error message
 */
export function extractErrorMessage(errorMessage: string, defaultMessage: string = 'Operation failed'): string {
  // If it's already a clean error message, return it
  if (!errorMessage.includes('HTTP') && !errorMessage.includes('{') && !errorMessage.includes('"')) {
    return errorMessage;
  }

  // Try to extract from HTTP error format: "HTTP 400: Bad Request - {"error":"message"}"
  if (errorMessage.includes('HTTP')) {
    const httpMatch = errorMessage.match(/HTTP \d+: ([^{]*)/);
    if (httpMatch && httpMatch[1]) {
      // Remove trailing " -" if present
      return httpMatch[1].trim().replace(/\s*-\s*$/, '');
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

  // If we can't extract a meaningful message, clean and return
  const cleaned = errorMessage.replace(/HTTP \d+: /, '').trim();
  // If cleaning resulted in empty or just a colon, return default
  return cleaned && cleaned !== ':' ? cleaned : defaultMessage;
}

/**
 * Determine HTTP status code from error message
 */
export function getStatusCodeFromError(errorMessage: string): number {
  if (errorMessage.includes('HTTP 4')) {
    return 400;
  }
  if (errorMessage.includes('HTTP 5')) {
    return 500;
  }
  return 500;
}

