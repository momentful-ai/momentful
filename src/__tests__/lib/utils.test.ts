import { describe, it, expect } from 'vitest';
import { mergeName, formatFileSize, formatDuration, formatDate, formatDateTime, getErrorMessage } from '../../lib/utils';

/**
 * Test interface for mock Replicate errors
 */
interface MockReplicateError extends Error {
  name: string;
  title?: string;
  detail?: string;
}

describe('utils', () => {
  describe('mergeName', () => {
    it('merges class names correctly', () => {
      expect(mergeName('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      const condition = false;
      expect(mergeName('foo', condition && 'bar', 'baz')).toBe('foo baz');
    });

    it('handles undefined and null', () => {
      expect(mergeName('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('handles empty strings', () => {
      expect(mergeName('foo', '', 'bar')).toBe('foo bar');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(999)).toBe('999 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(5120)).toBe('5.0 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('handles large file sizes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1024.0 MB');
      expect(formatFileSize(1024 * 1024 * 1024 * 2)).toBe('2048.0 MB');
    });
  });

  describe('formatDuration', () => {
    it('returns empty string for null', () => {
      expect(formatDuration(null)).toBe('');
    });

    it('formats seconds correctly', () => {
      expect(formatDuration(0)).toBe(''); // 0 is falsy, returns empty string
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(59)).toBe('0:59');
    });

    it('formats minutes and seconds correctly', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3661)).toBe('61:01');
    });

    it('handles decimal seconds by flooring', () => {
      expect(formatDuration(30.9)).toBe('0:30');
      expect(formatDuration(90.7)).toBe('1:30');
    });
  });

  describe('formatDate', () => {
    it('formats date with default options', () => {
      const date = '2025-01-15T10:30:00Z';
      const result = formatDate(date);
      // Result depends on locale, but should contain date parts
      expect(result).toContain('2025');
      expect(result).toContain('Jan');
    });

    it('formats date with custom options', () => {
      const date = '2025-01-15T10:30:00Z';
      const result = formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(result).toContain('2025');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    it('handles different date formats', () => {
      const date1 = '2025-01-15';
      const date2 = '2025-01-15T10:30:00.000Z';
      const date3 = 'January 15, 2025';

      // All should produce valid dates
      expect(() => formatDate(date1)).not.toThrow();
      expect(() => formatDate(date2)).not.toThrow();
      expect(() => formatDate(date3)).not.toThrow();
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = '2025-01-15T14:30:00Z';
      const result = formatDateTime(date);
      
      // Should contain date parts
      expect(result).toContain('2025');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      // Should contain time (may be in different format based on locale)
      expect(result.length).toBeGreaterThan(10);
    });

    it('handles different time zones', () => {
      const date = '2025-01-15T14:30:00Z';
      const result = formatDateTime(date);
      // Should format without throwing
      expect(() => formatDateTime(date)).not.toThrow();
      expect(result).toBeDefined();
    });

    it('formats midnight correctly', () => {
      const date = '2025-01-15T00:00:00Z';
      const result = formatDateTime(date);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getErrorMessage', () => {
    it('returns the error message for generic errors', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('returns default message for non-error values', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage('string')).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(42)).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage({})).toBe('An unexpected error occurred. Please try again.');
    });

    it('handles ReplicatePaymentError with title and detail', () => {
      const error = new Error('Payment required') as MockReplicateError;
      error.name = 'ReplicatePaymentError';
      error.title = 'Monthly spend limit reached';
      error.detail = 'You\'ve hit your monthly spend limit. You can change or remove your limit at https://replicate.com/account/billing#limits. If you have recently increased your limit, please wait a few minutes before trying again.';

      expect(getErrorMessage(error)).toBe('Monthly spend limit reached: You\'ve hit your monthly spend limit. You can change or remove your limit at https://replicate.com/account/billing#limits. If you have recently increased your limit, please wait a few minutes before trying again.');
    });

    it('handles ReplicatePaymentError with only detail', () => {
      const error = new Error('Payment required') as MockReplicateError;
      error.name = 'ReplicatePaymentError';
      error.detail = 'You\'ve hit your monthly spend limit.';

      expect(getErrorMessage(error)).toBe('You\'ve hit your monthly spend limit.');
    });

    it('handles ReplicatePaymentError with only title', () => {
      const error = new Error('Payment required') as MockReplicateError;
      error.name = 'ReplicatePaymentError';
      error.title = 'Monthly spend limit reached';

      expect(getErrorMessage(error)).toBe('Monthly spend limit reached. You can change or remove your limit at https://replicate.com/account/billing#limits.');
    });

    it('handles ReplicatePaymentError with no title or detail', () => {
      const error = new Error('Payment required') as MockReplicateError;
      error.name = 'ReplicatePaymentError';

      expect(getErrorMessage(error)).toBe('Payment required');
    });

    it('handles ReplicateAPIError with title and detail', () => {
      const error = new Error('Rate limit exceeded') as MockReplicateError;
      error.name = 'ReplicateAPIError';
      error.title = 'Too Many Requests';
      error.detail = 'Rate limit exceeded. Please try again later.';

      expect(getErrorMessage(error)).toBe('Too Many Requests: Rate limit exceeded. Please try again later.');
    });

    it('handles ReplicateAPIError with only detail', () => {
      const error = new Error('Rate limit exceeded') as MockReplicateError;
      error.name = 'ReplicateAPIError';
      error.detail = 'Rate limit exceeded. Please try again later.';

      expect(getErrorMessage(error)).toBe('Rate limit exceeded. Please try again later.');
    });

    it('handles ReplicateAPIError with only title', () => {
      const error = new Error('Rate limit exceeded') as MockReplicateError;
      error.name = 'ReplicateAPIError';
      error.title = 'Too Many Requests';

      expect(getErrorMessage(error)).toBe('Too Many Requests');
    });

    it('handles ReplicateAPIError with no title or detail', () => {
      const error = new Error('Rate limit exceeded') as MockReplicateError;
      error.name = 'ReplicateAPIError';

      expect(getErrorMessage(error)).toBe('Rate limit exceeded');
    });

    it('handles errors that are not Replicate-specific', () => {
      const error = new Error('Network connection failed');
      expect(getErrorMessage(error)).toBe('Network connection failed');
    });

    it('handles errors with empty message', () => {
      const error = new Error('');
      expect(getErrorMessage(error)).toBe('');
    });
  });
});

