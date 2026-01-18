/**
 * Tests for lib/hooks/useKeyboardShortcuts.ts
 *
 * Tests keyboard shortcut handling including:
 * - useKeyboardShortcuts hook
 * - useShortcutHint hook
 * - Shortcut detection and callbacks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

import { useKeyboardShortcuts, useShortcutHint } from '@/lib/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/navigation';

describe('useKeyboardShortcuts', () => {
  let mockRouter: { push: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRouter = { push: vi.fn() };
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const dispatchKeyEvent = (
    key: string,
    options: {
      metaKey?: boolean;
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
    } = {}
  ) => {
    const event = new KeyboardEvent('keydown', {
      key,
      metaKey: options.metaKey || false,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  describe('initialization', () => {
    it('should return shortcuts array', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.shortcuts).toBeDefined();
      expect(Array.isArray(result.current.shortcuts)).toBe(true);
      expect(result.current.shortcuts.length).toBeGreaterThan(0);
    });

    it('should add keydown event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useKeyboardShortcuts());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should remove keydown event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('Cmd+K - Command Palette', () => {
    it('should call onCommandPalette when Cmd+K is pressed', () => {
      const onCommandPalette = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onCommandPalette })
      );

      act(() => {
        dispatchKeyEvent('k', { metaKey: true });
      });

      expect(onCommandPalette).toHaveBeenCalled();
    });

    it('should call onCommandPalette when Ctrl+K is pressed', () => {
      const onCommandPalette = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onCommandPalette })
      );

      act(() => {
        dispatchKeyEvent('k', { ctrlKey: true });
      });

      expect(onCommandPalette).toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('should call onEscape when Escape is pressed', () => {
      const onEscape = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onEscape })
      );

      act(() => {
        dispatchKeyEvent('Escape');
      });

      expect(onEscape).toHaveBeenCalled();
    });
  });

  describe('Cmd+N - New Test', () => {
    it('should call onNewTest when Cmd+N is pressed', () => {
      const onNewTest = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onNewTest })
      );

      act(() => {
        dispatchKeyEvent('n', { metaKey: true });
      });

      expect(onNewTest).toHaveBeenCalled();
    });
  });

  describe('Cmd+Shift+R - Run All Tests', () => {
    it('should call onRunAllTests when Cmd+Shift+R is pressed', () => {
      const onRunAllTests = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onRunAllTests })
      );

      act(() => {
        dispatchKeyEvent('r', { metaKey: true, shiftKey: true });
      });

      expect(onRunAllTests).toHaveBeenCalled();
    });
  });

  describe('Cmd+Shift+D - Toggle Dark Mode', () => {
    it('should call onToggleDarkMode when Cmd+Shift+D is pressed', () => {
      const onToggleDarkMode = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onToggleDarkMode })
      );

      act(() => {
        dispatchKeyEvent('d', { metaKey: true, shiftKey: true });
      });

      expect(onToggleDarkMode).toHaveBeenCalled();
    });
  });

  describe('/ - Focus Search', () => {
    it('should call onFocusSearch when / is pressed', () => {
      const onFocusSearch = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onFocusSearch })
      );

      act(() => {
        dispatchKeyEvent('/');
      });

      expect(onFocusSearch).toHaveBeenCalled();
    });
  });

  describe('Go-to shortcuts (g + key)', () => {
    it('should navigate to dashboard on g+d', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('d');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to dashboard on g+g', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('g');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to projects on g+p', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('p');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/projects');
    });

    it('should navigate to tests on g+t', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('t');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/tests');
    });

    it('should navigate to reports on g+r', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('r');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/reports');
    });

    it('should navigate to settings on g+s', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('s');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/settings');
    });

    it('should navigate to healing on g+h', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('h');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/healing');
    });

    it('should navigate to activity on g+a', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('a');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/activity');
    });

    it('should navigate to flaky on g+f', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      act(() => {
        dispatchKeyEvent('f');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/flaky');
    });

    it('should timeout g listener after 1.5 seconds', () => {
      renderHook(() => useKeyboardShortcuts());

      act(() => {
        dispatchKeyEvent('g');
      });

      // Advance time past the timeout
      act(() => {
        vi.advanceTimersByTime(1600);
      });

      act(() => {
        dispatchKeyEvent('d');
      });

      // Should not navigate because timeout expired
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('enabled option', () => {
    it('should not trigger shortcuts when enabled is false', () => {
      const onCommandPalette = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onCommandPalette, enabled: false })
      );

      act(() => {
        dispatchKeyEvent('k', { metaKey: true });
      });

      expect(onCommandPalette).not.toHaveBeenCalled();
    });

    it('should trigger shortcuts when enabled is true (default)', () => {
      const onCommandPalette = vi.fn();

      renderHook(() =>
        useKeyboardShortcuts({ onCommandPalette })
      );

      act(() => {
        dispatchKeyEvent('k', { metaKey: true });
      });

      expect(onCommandPalette).toHaveBeenCalled();
    });
  });
});

describe('useShortcutHint', () => {
  beforeEach(() => {
    // Mock navigator.platform
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect Mac platform', () => {
    const { result } = renderHook(() => useShortcutHint());

    expect(result.current.isMac).toBe(true);
    expect(result.current.modKey).toBe('\u2318'); // Command symbol
  });

  it('should format shortcut with meta key', () => {
    const { result } = renderHook(() => useShortcutHint());

    const formatted = result.current.formatShortcut({ key: 'k', meta: true });

    expect(formatted).toContain('\u2318'); // Command symbol
    expect(formatted).toContain('K');
  });

  it('should format shortcut with shift key', () => {
    const { result } = renderHook(() => useShortcutHint());

    const formatted = result.current.formatShortcut({
      key: 'r',
      meta: true,
      shift: true,
    });

    expect(formatted).toContain('\u21E7'); // Shift symbol
    expect(formatted).toContain('R');
  });

  it('should format shortcut with alt key on Mac', () => {
    const { result } = renderHook(() => useShortcutHint());

    const formatted = result.current.formatShortcut({
      key: 'a',
      alt: true,
    });

    expect(formatted).toContain('\u2325'); // Option symbol
    expect(formatted).toContain('A');
  });

  describe('Windows/Linux platform', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });
    });

    it('should detect non-Mac platform', () => {
      const { result } = renderHook(() => useShortcutHint());

      expect(result.current.isMac).toBe(false);
      expect(result.current.modKey).toBe('Ctrl');
    });

    it('should format shortcut with Ctrl on Windows', () => {
      const { result } = renderHook(() => useShortcutHint());

      const formatted = result.current.formatShortcut({ key: 'k', meta: true });

      expect(formatted).toContain('Ctrl');
      expect(formatted).toContain('K');
    });

    it('should format shortcut with Alt on Windows', () => {
      const { result } = renderHook(() => useShortcutHint());

      const formatted = result.current.formatShortcut({
        key: 'a',
        alt: true,
      });

      expect(formatted).toContain('Alt');
      expect(formatted).toContain('A');
    });
  });
});
