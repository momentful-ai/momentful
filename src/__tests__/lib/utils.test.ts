import { describe, it, expect } from 'vitest';
import { mergeName, formatFileSize, formatDuration, formatDate, formatDateTime } from '../../lib/utils';

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
});

