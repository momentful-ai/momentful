import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function mergeName(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Interface for Replicate API errors with additional properties
 */
interface ReplicateError extends Error {
  name: string;
  title?: string;
  detail?: string;
}

/**
 * Extract meaningful error messages from different error types
 * Handles Replicate API errors and provides user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific Replicate errors
    const replicateError = error as ReplicateError;

    if (replicateError.name === 'ReplicatePaymentError') {
      if (replicateError.title && replicateError.detail) {
        return `${replicateError.title}: ${replicateError.detail}`;
      }
      if (replicateError.detail) {
        return replicateError.detail;
      }
      if (replicateError.title) {
        return `${replicateError.title}. You can change or remove your limit at https://replicate.com/account/billing#limits.`;
      }
      return error.message;
    }

    if (replicateError.name === 'ReplicateAPIError') {
      if (replicateError.title && replicateError.detail) {
        return `${replicateError.title}: ${replicateError.detail}`;
      }
      if (replicateError.detail) {
        return replicateError.detail;
      }
      if (replicateError.title) {
        return replicateError.title;
      }
      return error.message;
    }

    // Return the error message directly for other errors
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
