/**
 * Tests for lib/hooks/useToast.ts
 *
 * Tests the toast hook and its associated functions including:
 * - reducer
 * - toast function
 * - useToast hook
 * - Convenience methods (success, error, warning, info)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { reducer, toast, useToast } from '@/lib/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    describe('ADD_TOAST', () => {
      it('should add a toast to the state', () => {
        const newToast = {
          id: '1',
          title: 'Test Toast',
          description: 'Test description',
          open: true,
        };

        const result = reducer(initialState, {
          type: 'ADD_TOAST',
          toast: newToast,
        });

        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0]).toEqual(newToast);
      });

      it('should add new toasts at the beginning', () => {
        const existingState = {
          toasts: [{ id: '1', title: 'First', open: true }],
        };

        const result = reducer(existingState, {
          type: 'ADD_TOAST',
          toast: { id: '2', title: 'Second', open: true },
        });

        expect(result.toasts[0].id).toBe('2');
        expect(result.toasts[1].id).toBe('1');
      });

      it('should limit toasts to 5 (TOAST_LIMIT)', () => {
        const existingState = {
          toasts: [
            { id: '1', title: 'Toast 1', open: true },
            { id: '2', title: 'Toast 2', open: true },
            { id: '3', title: 'Toast 3', open: true },
            { id: '4', title: 'Toast 4', open: true },
            { id: '5', title: 'Toast 5', open: true },
          ],
        };

        const result = reducer(existingState, {
          type: 'ADD_TOAST',
          toast: { id: '6', title: 'Toast 6', open: true },
        });

        expect(result.toasts).toHaveLength(5);
        expect(result.toasts[0].id).toBe('6');
        expect(result.toasts.find((t) => t.id === '5')).toBeUndefined();
      });
    });

    describe('UPDATE_TOAST', () => {
      it('should update an existing toast', () => {
        const existingState = {
          toasts: [{ id: '1', title: 'Original', open: true }],
        };

        const result = reducer(existingState, {
          type: 'UPDATE_TOAST',
          toast: { id: '1', title: 'Updated' },
        });

        expect(result.toasts[0].title).toBe('Updated');
        expect(result.toasts[0].open).toBe(true);
      });

      it('should not update non-matching toast', () => {
        const existingState = {
          toasts: [{ id: '1', title: 'Original', open: true }],
        };

        const result = reducer(existingState, {
          type: 'UPDATE_TOAST',
          toast: { id: '2', title: 'Updated' },
        });

        expect(result.toasts[0].title).toBe('Original');
      });
    });

    describe('DISMISS_TOAST', () => {
      it('should set open to false for specific toast', () => {
        const existingState = {
          toasts: [
            { id: '1', title: 'Toast 1', open: true },
            { id: '2', title: 'Toast 2', open: true },
          ],
        };

        const result = reducer(existingState, {
          type: 'DISMISS_TOAST',
          toastId: '1',
        });

        expect(result.toasts[0].open).toBe(false);
        expect(result.toasts[1].open).toBe(true);
      });

      it('should dismiss all toasts when toastId is undefined', () => {
        const existingState = {
          toasts: [
            { id: '1', title: 'Toast 1', open: true },
            { id: '2', title: 'Toast 2', open: true },
          ],
        };

        const result = reducer(existingState, {
          type: 'DISMISS_TOAST',
        });

        expect(result.toasts[0].open).toBe(false);
        expect(result.toasts[1].open).toBe(false);
      });
    });

    describe('REMOVE_TOAST', () => {
      it('should remove a specific toast', () => {
        const existingState = {
          toasts: [
            { id: '1', title: 'Toast 1', open: true },
            { id: '2', title: 'Toast 2', open: true },
          ],
        };

        const result = reducer(existingState, {
          type: 'REMOVE_TOAST',
          toastId: '1',
        });

        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0].id).toBe('2');
      });

      it('should remove all toasts when toastId is undefined', () => {
        const existingState = {
          toasts: [
            { id: '1', title: 'Toast 1', open: true },
            { id: '2', title: 'Toast 2', open: true },
          ],
        };

        const result = reducer(existingState, {
          type: 'REMOVE_TOAST',
        });

        expect(result.toasts).toHaveLength(0);
      });
    });
  });

  describe('toast function', () => {
    it('should create a toast and return controls', () => {
      const result = toast({ title: 'Test Toast' });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(result).toHaveProperty('update');
      expect(typeof result.id).toBe('string');
      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    });

    it('should generate unique IDs', () => {
      const result1 = toast({ title: 'Toast 1' });
      const result2 = toast({ title: 'Toast 2' });

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('toast.success', () => {
    it('should create a success toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast.success({ title: 'Success!' });
      });

      // After state update
      expect(result.current.toasts.length).toBeGreaterThan(0);
      const successToast = result.current.toasts.find(
        (t) => t.title === 'Success!'
      );
      expect(successToast?.variant).toBe('success');
    });
  });

  describe('toast.error', () => {
    it('should create an error toast with destructive variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast.error({ title: 'Error!' });
      });

      const errorToast = result.current.toasts.find(
        (t) => t.title === 'Error!'
      );
      expect(errorToast?.variant).toBe('destructive');
    });
  });

  describe('toast.warning', () => {
    it('should create a warning toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast.warning({ title: 'Warning!' });
      });

      const warningToast = result.current.toasts.find(
        (t) => t.title === 'Warning!'
      );
      expect(warningToast?.variant).toBe('warning');
    });
  });

  describe('toast.info', () => {
    it('should create an info toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast.info({ title: 'Info!' });
      });

      const infoToast = result.current.toasts.find(
        (t) => t.title === 'Info!'
      );
      expect(infoToast?.variant).toBe('info');
    });
  });

  describe('useToast hook', () => {
    it('should return initial state with empty toasts', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toBeDefined();
      expect(result.current.toast).toBe(toast);
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should update state when toast is added', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = toast({ title: 'New Toast' });
        toastId = toastResult.id;
      });

      // Verify the specific toast was added
      const addedToast = result.current.toasts.find((t) => t.id === toastId);
      expect(addedToast).toBeDefined();
      expect(addedToast?.title).toBe('New Toast');
    });

    it('should allow dismissing a specific toast', async () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = toast({ title: 'Dismissable' });
        toastId = toastResult.id;
      });

      act(() => {
        result.current.dismiss(toastId!);
      });

      const dismissedToast = result.current.toasts.find(
        (t) => t.id === toastId
      );
      expect(dismissedToast?.open).toBe(false);
    });

    it('should allow dismissing all toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Toast 1' });
        toast({ title: 'Toast 2' });
      });

      act(() => {
        result.current.dismiss();
      });

      result.current.toasts.forEach((t) => {
        expect(t.open).toBe(false);
      });
    });

    it('should cleanup listener on unmount', () => {
      const { unmount } = renderHook(() => useToast());

      // Should not throw
      unmount();
    });
  });

  describe('toast auto-dismiss', () => {
    it('should schedule removal after TOAST_REMOVE_DELAY on dismiss', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = toast({ title: 'Auto Remove' });
        toastId = toastResult.id;
      });

      // Dismiss the toast
      act(() => {
        result.current.dismiss(toastId!);
      });

      // Toast should still exist but be closed
      expect(result.current.toasts.find((t) => t.id === toastId)).toBeDefined();
      expect(result.current.toasts.find((t) => t.id === toastId)?.open).toBe(false);

      // Advance timer by TOAST_REMOVE_DELAY (5000ms) + buffer
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // Toast should be removed after delay (use synchronous assertion with fake timers)
      expect(result.current.toasts.find((t) => t.id === toastId)).toBeUndefined();
    });
  });

  describe('update function', () => {
    it('should update toast properties', () => {
      const { result } = renderHook(() => useToast());

      let toastControls: ReturnType<typeof toast>;
      act(() => {
        toastControls = toast({ title: 'Original Title' });
      });

      act(() => {
        toastControls!.update({ title: 'Updated Title', description: 'New desc' });
      });

      const updatedToast = result.current.toasts.find(
        (t) => t.id === toastControls!.id
      );
      expect(updatedToast?.title).toBe('Updated Title');
      expect(updatedToast?.description).toBe('New desc');
    });
  });
});
