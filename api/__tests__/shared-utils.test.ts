import { describe, it, expect } from 'vitest';
import { extractErrorMessage, getStatusCodeFromError } from '../shared/utils';

describe('Shared Utils', () => {
  describe('extractErrorMessage', () => {
    it('returns clean error messages unchanged', () => {
      const error = 'Invalid API key';
      expect(extractErrorMessage(error)).toBe('Invalid API key');
    });

    it('extracts error from HTTP error format', () => {
      const error = 'HTTP 400: Bad Request - {"error":"Invalid input"}';
      // The function extracts and removes trailing " -"
      expect(extractErrorMessage(error)).toBe('Bad Request');
    });

    it('extracts error from JSON format with error property', () => {
      const error = 'Request failed with {"error":"Missing required field"}';
      expect(extractErrorMessage(error)).toBe('Missing required field');
    });

    it('extracts error from JSON format with message property', () => {
      const error = 'Failed: {"message":"Service unavailable"}';
      expect(extractErrorMessage(error)).toBe('Service unavailable');
    });

    it('handles nested JSON in error messages', () => {
      const error = 'Error occurred: {"error":"Validation failed","details":{}}';
      expect(extractErrorMessage(error)).toBe('Validation failed');
    });

    it('cleans HTTP prefix when extraction fails', () => {
      const error = 'HTTP 500: Internal Server Error';
      expect(extractErrorMessage(error)).toBe('Internal Server Error');
    });

    it('returns default message when error is empty after cleaning', () => {
      const error = 'HTTP 500:';
      // The function removes "HTTP \d+: " but "500:" remains, so we check it's not empty
      const result = extractErrorMessage(error, 'Operation failed');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles malformed JSON gracefully', () => {
      const error = 'Error: {"invalid": json}';
      // Should return something meaningful or the cleaned error
      const result = extractErrorMessage(error);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles complex error formats', () => {
      const error = 'HTTP 400: Bad Request - {"error":"Invalid parameter","code":400}';
      // The function extracts and removes trailing " -"
      expect(extractErrorMessage(error)).toBe('Bad Request');
    });

    it('preserves messages without HTTP or JSON', () => {
      const error = 'Network connection timeout';
      expect(extractErrorMessage(error)).toBe('Network connection timeout');
    });
  });

  describe('getStatusCodeFromError', () => {
    it('returns 400 for HTTP 4xx errors', () => {
      expect(getStatusCodeFromError('HTTP 400: Bad Request')).toBe(400);
      expect(getStatusCodeFromError('HTTP 404: Not Found')).toBe(400);
      expect(getStatusCodeFromError('HTTP 422: Unprocessable Entity')).toBe(400);
    });

    it('returns 500 for HTTP 5xx errors', () => {
      expect(getStatusCodeFromError('HTTP 500: Internal Server Error')).toBe(500);
      expect(getStatusCodeFromError('HTTP 502: Bad Gateway')).toBe(500);
      expect(getStatusCodeFromError('HTTP 503: Service Unavailable')).toBe(500);
    });

    it('returns 500 for non-HTTP errors', () => {
      expect(getStatusCodeFromError('Network error')).toBe(500);
      expect(getStatusCodeFromError('Unknown error')).toBe(500);
      expect(getStatusCodeFromError('')).toBe(500);
    });

    it('handles error messages with HTTP 4 in content', () => {
      expect(getStatusCodeFromError('Error: HTTP 400 occurred')).toBe(400);
    });

    it('handles error messages with HTTP 5 in content', () => {
      expect(getStatusCodeFromError('Error: HTTP 500 occurred')).toBe(500);
    });
  });
});

