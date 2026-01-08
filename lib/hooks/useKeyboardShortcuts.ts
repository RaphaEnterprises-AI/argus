'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  { key: 'k', meta: true, description: 'Open command palette' },
  { key: 'n', meta: true, description: 'Create new test' },
  { key: 'r', meta: true, shift: true, description: 'Run all tests' },
  { key: 'd', meta: true, shift: true, description: 'Toggle dark mode' },
  { key: 'Escape', description: 'Close modals' },
  { key: '/', description: 'Focus search' },
  { key: 'g', description: 'Go to dashboard (press g twice)' },
  { key: 'p', description: 'Go to projects (press p after g)' },
  { key: 't', description: 'Go to tests (press t after g)' },
];

interface UseKeyboardShortcutsOptions {
  onCommandPalette?: () => void;
  onNewTest?: () => void;
  onRunAllTests?: () => void;
  onToggleDarkMode?: () => void;
  onEscape?: () => void;
  onFocusSearch?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onCommandPalette,
    onNewTest,
    onRunAllTests,
    onToggleDarkMode,
    onEscape,
    onFocusSearch,
    enabled = true,
  } = options;

  const router = useRouter();

  // Track 'g' key for go-to shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K - Command palette (always active)
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onCommandPalette?.();
        return;
      }

      // Escape - Close modals (always active)
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      // Skip other shortcuts if typing
      if (isTyping) return;

      // Cmd+N - New test
      if (event.key === 'n' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onNewTest?.();
        return;
      }

      // Cmd+Shift+R - Run all tests
      if (event.key === 'r' && (event.metaKey || event.ctrlKey) && event.shiftKey) {
        event.preventDefault();
        onRunAllTests?.();
        return;
      }

      // Cmd+Shift+D - Toggle dark mode
      if (event.key === 'd' && (event.metaKey || event.ctrlKey) && event.shiftKey) {
        event.preventDefault();
        onToggleDarkMode?.();
        return;
      }

      // / - Focus search
      if (event.key === '/') {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Quick navigation: g+key combinations
      if (event.key === 'g') {
        // Set up listener for next key
        const handleNextKey = (nextEvent: KeyboardEvent) => {
          document.removeEventListener('keydown', handleNextKey);

          switch (nextEvent.key) {
            case 'g':
            case 'd':
              router.push('/dashboard');
              break;
            case 'p':
              router.push('/projects');
              break;
            case 't':
              router.push('/tests');
              break;
            case 'r':
              router.push('/reports');
              break;
            case 's':
              router.push('/settings');
              break;
            case 'h':
              router.push('/healing');
              break;
            case 'a':
              router.push('/activity');
              break;
            case 'f':
              router.push('/flaky');
              break;
          }
        };

        // Wait for next key (with timeout)
        document.addEventListener('keydown', handleNextKey);
        setTimeout(() => {
          document.removeEventListener('keydown', handleNextKey);
        }, 1500);
        return;
      }
    },
    [
      enabled,
      onCommandPalette,
      onNewTest,
      onRunAllTests,
      onToggleDarkMode,
      onEscape,
      onFocusSearch,
      router,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: DEFAULT_SHORTCUTS,
  };
}

// Hook for displaying keyboard shortcut hints
export function useShortcutHint() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
  const modKey = isMac ? '⌘' : 'Ctrl';

  return {
    modKey,
    isMac,
    formatShortcut: (shortcut: { key: string; meta?: boolean; shift?: boolean; alt?: boolean }) => {
      const parts: string[] = [];
      if (shortcut.meta) parts.push(modKey);
      if (shortcut.shift) parts.push('⇧');
      if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
      parts.push(shortcut.key.toUpperCase());
      return parts.join('');
    },
  };
}
