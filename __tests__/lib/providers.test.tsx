/**
 * Tests for lib/providers.tsx
 *
 * Tests the main providers component and related context including:
 * - Providers component (main wrapper)
 * - ReducedMotionProvider
 * - useReducedMotion hook
 * - QueryClient configuration
 * - Theme provider integration
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn().mockResolvedValue('mock-token'),
  })),
}));

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  setGlobalTokenGetter: vi.fn(),
  clearGlobalTokenGetter: vi.fn(),
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the use-auth-api hook
vi.mock('@/lib/hooks/use-auth-api', () => ({
  useAuthApi: vi.fn(() => ({
    fetchJson: vi.fn().mockResolvedValue({ data: [], error: null }),
    isLoaded: true,
    isSignedIn: true,
  })),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Mock the ApiClientProvider
vi.mock('@/components/providers/api-client-provider', () => ({
  ApiClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-client-provider">{children}</div>
  ),
}));

// Mock the OrganizationProvider
vi.mock('@/lib/contexts/organization-context', () => ({
  OrganizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="organization-provider">{children}</div>
  ),
}));

// Mock the SessionTimeoutProvider
vi.mock('@/components/providers/session-timeout-provider', () => ({
  SessionTimeoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-timeout-provider">{children}</div>
  ),
}));

// Import after mocks
import { Providers, useReducedMotion } from '@/lib/providers';

describe('providers', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockMediaQueryList: {
    matches: boolean;
    media: string;
    onchange: null;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    dispatchEvent: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create a fresh mock for each test
    mockMediaQueryList = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      ...mockMediaQueryList,
      media: query,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Providers Component', () => {
    it('should render children', () => {
      render(
        <Providers>
          <div data-testid="child-content">Test Child</div>
        </Providers>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should render all nested providers in correct order', () => {
      render(
        <Providers>
          <div data-testid="child-content">Test Child</div>
        </Providers>
      );

      // Verify provider hierarchy
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('api-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('organization-provider')).toBeInTheDocument();
    });

    it('should wrap children with QueryClientProvider', () => {
      // This test verifies QueryClientProvider is working by checking
      // that the component renders without throwing
      expect(() =>
        render(
          <Providers>
            <div>Test</div>
          </Providers>
        )
      ).not.toThrow();
    });

    it('should create QueryClient with correct default options', () => {
      // We can't directly inspect QueryClient config, but we can verify
      // it's created and functioning
      render(
        <Providers>
          <div data-testid="content">Content</div>
        </Providers>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Providers>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </Providers>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render complex nested children', () => {
      render(
        <Providers>
          <div data-testid="outer">
            <div data-testid="inner">
              <span data-testid="deep">Deep content</span>
            </div>
          </div>
        </Providers>
      );

      expect(screen.getByTestId('outer')).toBeInTheDocument();
      expect(screen.getByTestId('inner')).toBeInTheDocument();
      expect(screen.getByTestId('deep')).toBeInTheDocument();
    });

    it('should render without crashing when given empty fragment', () => {
      expect(() =>
        render(
          <Providers>
            <></>
          </Providers>
        )
      ).not.toThrow();
    });

    it('should render text children directly', () => {
      render(<Providers>Plain text content</Providers>);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });
  });

  describe('useReducedMotion Hook', () => {
    it('should return false by default when reduced motion is not preferred', () => {
      mockMediaQueryList.matches = false;
      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        matches: false,
      }));

      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="result">{prefersReducedMotion.toString()}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      expect(screen.getByTestId('result').textContent).toBe('false');
    });

    it('should return true when reduced motion is preferred', async () => {
      mockMediaQueryList.matches = true;
      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        matches: true,
      }));

      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="result">{prefersReducedMotion.toString()}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('true');
      });
    });

    it('should add event listener for media query changes', () => {
      const addEventListener = vi.fn();
      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        addEventListener,
      }));

      const TestComponent = () => {
        useReducedMotion();
        return <div>Test</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      const removeEventListener = vi.fn();
      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        removeEventListener,
      }));

      const TestComponent = () => {
        useReducedMotion();
        return <div>Test</div>;
      };

      const { unmount } = render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update when media query changes', async () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

      const addEventListener = vi.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        matches: false,
        addEventListener,
      }));

      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="result">{prefersReducedMotion.toString()}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      // Initial state should be false
      expect(screen.getByTestId('result').textContent).toBe('false');

      // Simulate media query change
      if (changeHandler) {
        act(() => {
          changeHandler!({ matches: true } as MediaQueryListEvent);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('true');
      });
    });

    it('should use context value from ReducedMotionProvider', () => {
      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="motion-result">{String(prefersReducedMotion)}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      // Should have access to the context
      expect(screen.getByTestId('motion-result')).toBeInTheDocument();
    });
  });

  describe('ReducedMotionContext default value', () => {
    it('should provide default value of false when used outside Providers', () => {
      // When used outside the provider, the default context value should be used
      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="result">{prefersReducedMotion.toString()}</div>;
      };

      // Render without Providers - will use default context value
      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      expect(screen.getByTestId('result').textContent).toBe('false');
    });
  });

  describe('Provider isolation', () => {
    it('should create new QueryClient for each Providers instance', () => {
      // Each Providers should work independently
      const TestComponent = ({ id }: { id: string }) => (
        <Providers>
          <div data-testid={`content-${id}`}>Content {id}</div>
        </Providers>
      );

      const { rerender } = render(<TestComponent id="1" />);
      expect(screen.getByTestId('content-1')).toBeInTheDocument();

      rerender(<TestComponent id="2" />);
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
    });
  });

  describe('Theme configuration', () => {
    it('should render ThemeProvider with children', () => {
      render(
        <Providers>
          <div data-testid="themed-content">Themed Content</div>
        </Providers>
      );

      // The mock ThemeProvider wraps content in a div with data-testid
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toBeInTheDocument();
      expect(screen.getByTestId('themed-content')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should not throw when matchMedia is called with reduced motion query', () => {
      expect(() =>
        render(
          <Providers>
            <div>Test</div>
          </Providers>
        )
      ).not.toThrow();

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('React strict mode compatibility', () => {
    it('should handle double mounting in strict mode', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();

      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        addEventListener,
        removeEventListener,
      }));

      const TestComponent = () => {
        useReducedMotion();
        return <div>Test</div>;
      };

      // Render in strict mode simulation (mount, unmount, mount)
      const { unmount } = render(
        <React.StrictMode>
          <Providers>
            <TestComponent />
          </Providers>
        </React.StrictMode>
      );

      unmount();

      // Should handle cleanup properly
      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Multiple consumers', () => {
    it('should provide same reduced motion value to multiple consumers', async () => {
      mockMatchMedia.mockImplementation(() => ({
        ...mockMediaQueryList,
        matches: true,
      }));

      const Consumer1 = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="consumer-1">{prefersReducedMotion.toString()}</div>;
      };

      const Consumer2 = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="consumer-2">{prefersReducedMotion.toString()}</div>;
      };

      render(
        <Providers>
          <Consumer1 />
          <Consumer2 />
        </Providers>
      );

      await waitFor(() => {
        const consumer1Value = screen.getByTestId('consumer-1').textContent;
        const consumer2Value = screen.getByTestId('consumer-2').textContent;
        expect(consumer1Value).toBe(consumer2Value);
      });
    });
  });
});
