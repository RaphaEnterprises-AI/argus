/**
 * Tests for lib/utils.ts
 *
 * Tests utility functions including:
 * - cn (class name merger)
 * - formatDuration
 * - formatDate
 * - getStatusColor
 * - getStatusBgColor
 */

import { describe, it, expect } from 'vitest';
import { cn, formatDuration, formatDate, getStatusColor, getStatusBgColor } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
    });

    it('should handle undefined and null values', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    it('should handle objects with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should return empty string for no arguments', () => {
      expect(cn()).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds under 60 with decimal', () => {
      expect(formatDuration(5.5)).toBe('5.5s');
      expect(formatDuration(0.1)).toBe('0.1s');
      expect(formatDuration(59.9)).toBe('59.9s');
    });

    it('should format exactly 60 seconds as 1 minute', () => {
      expect(formatDuration(60)).toBe('1m 0s');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(125.7)).toBe('2m 6s');
    });

    it('should handle large durations', () => {
      expect(formatDuration(3600)).toBe('60m 0s');
      expect(formatDuration(7380)).toBe('123m 0s');
    });

    it('should handle zero seconds', () => {
      expect(formatDuration(0)).toBe('0.0s');
    });

    it('should round remaining seconds for minutes display', () => {
      expect(formatDuration(65.7)).toBe('1m 6s');
    });
  });

  describe('formatDate', () => {
    it('should format Date objects', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date);
      // Format depends on locale, just check it returns a non-empty string
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should format ISO date strings', () => {
      const formatted = formatDate('2024-03-15T14:30:00');
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should include month abbreviation', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Mar/);
    });

    it('should include day number', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/15/);
    });

    it('should include time', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('getStatusColor', () => {
    it('should return green for passed status', () => {
      expect(getStatusColor('passed')).toBe('text-green-500');
      expect(getStatusColor('PASSED')).toBe('text-green-500');
      expect(getStatusColor('Passed')).toBe('text-green-500');
    });

    it('should return red for failed status', () => {
      expect(getStatusColor('failed')).toBe('text-red-500');
      expect(getStatusColor('FAILED')).toBe('text-red-500');
    });

    it('should return blue for running status', () => {
      expect(getStatusColor('running')).toBe('text-blue-500');
      expect(getStatusColor('RUNNING')).toBe('text-blue-500');
    });

    it('should return yellow for pending status', () => {
      expect(getStatusColor('pending')).toBe('text-yellow-500');
      expect(getStatusColor('PENDING')).toBe('text-yellow-500');
    });

    it('should return muted for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('text-muted-foreground');
      expect(getStatusColor('cancelled')).toBe('text-muted-foreground');
      expect(getStatusColor('')).toBe('text-muted-foreground');
    });
  });

  describe('getStatusBgColor', () => {
    it('should return green background for passed status', () => {
      expect(getStatusBgColor('passed')).toBe('bg-green-500/10');
      expect(getStatusBgColor('PASSED')).toBe('bg-green-500/10');
    });

    it('should return red background for failed status', () => {
      expect(getStatusBgColor('failed')).toBe('bg-red-500/10');
      expect(getStatusBgColor('FAILED')).toBe('bg-red-500/10');
    });

    it('should return blue background for running status', () => {
      expect(getStatusBgColor('running')).toBe('bg-blue-500/10');
      expect(getStatusBgColor('RUNNING')).toBe('bg-blue-500/10');
    });

    it('should return yellow background for pending status', () => {
      expect(getStatusBgColor('pending')).toBe('bg-yellow-500/10');
      expect(getStatusBgColor('PENDING')).toBe('bg-yellow-500/10');
    });

    it('should return muted background for unknown status', () => {
      expect(getStatusBgColor('unknown')).toBe('bg-muted');
      expect(getStatusBgColor('cancelled')).toBe('bg-muted');
      expect(getStatusBgColor('')).toBe('bg-muted');
    });
  });
});
