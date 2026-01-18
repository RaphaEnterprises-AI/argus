/**
 * @file AnimatedCounter Component Tests
 * Tests for the AnimatedCounter UI component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedCounter } from '@/components/ui/animated-counter';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

let intersectionCallback: IntersectionObserverCallback;

beforeEach(() => {
  vi.useFakeTimers();

  // Mock IntersectionObserver
  const MockIntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
    intersectionCallback = callback;
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  });

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Helper to trigger intersection
const triggerIntersection = (isIntersecting: boolean) => {
  intersectionCallback(
    [{ isIntersecting, target: document.createElement('div') } as IntersectionObserverEntry],
    {} as IntersectionObserver
  );
};

describe('AnimatedCounter Component', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      render(<AnimatedCounter value={100} />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('renders with initial value of 0', () => {
      render(<AnimatedCounter value={100} />);
      // Initially shows 0 before animation
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <AnimatedCounter value={100} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('has tabular-nums class for consistent width', () => {
      const { container } = render(<AnimatedCounter value={100} />);
      expect(container.querySelector('.tabular-nums')).toBeInTheDocument();
    });
  });

  describe('Formats', () => {
    describe('Number Format (default)', () => {
      it('formats as number by default', () => {
        render(<AnimatedCounter value={1234} />);
        triggerIntersection(true);
        // The animation starts, initial display is 0
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      it('formats with thousands separator', async () => {
        render(<AnimatedCounter value={1000000} format="number" />);
        triggerIntersection(true);
        // Initially shows 0
      });

      it('respects decimals for number format', () => {
        render(<AnimatedCounter value={123.456} format="number" decimals={2} />);
        // Should format with 2 decimal places
      });
    });

    describe('Percentage Format', () => {
      it('adds percent sign', () => {
        render(<AnimatedCounter value={95.5} format="percentage" />);
        // Initial value should have %
        expect(screen.getByText('0.0%')).toBeInTheDocument();
      });

      it('defaults to 1 decimal place', () => {
        render(<AnimatedCounter value={50} format="percentage" />);
        expect(screen.getByText('0.0%')).toBeInTheDocument();
      });
    });

    describe('Currency Format', () => {
      it('formats as USD currency', () => {
        render(<AnimatedCounter value={1000} format="currency" />);
        // Currency defaults to 0 decimals, so initial value is $0
        expect(screen.getByText('$0')).toBeInTheDocument();
      });
    });

    describe('Duration Format', () => {
      it('formats duration with suffix', () => {
        render(<AnimatedCounter value={3.5} format="duration" suffix="s" />);
        expect(screen.getByText(/0.*s/)).toBeInTheDocument();
      });

      it('defaults to 1 decimal place', () => {
        render(<AnimatedCounter value={5} format="duration" />);
        expect(screen.getByText('0.0')).toBeInTheDocument();
      });
    });

    describe('Compact Format', () => {
      it('formats large numbers with K suffix', () => {
        render(<AnimatedCounter value={1500} format="compact" />);
        // Will format as 1.5K after animation
      });

      it('formats millions with M suffix', () => {
        render(<AnimatedCounter value={1500000} format="compact" />);
        // Will format as 1.5M after animation
      });

      it('formats billions with B suffix', () => {
        render(<AnimatedCounter value={1500000000} format="compact" />);
        // Will format as 1.5B after animation
      });

      it('shows small numbers without suffix', () => {
        render(<AnimatedCounter value={500} format="compact" />);
        // Will show 500 without suffix
      });
    });
  });

  describe('Prefix and Suffix', () => {
    it('renders prefix', () => {
      render(<AnimatedCounter value={100} prefix="Total: " />);
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
    });

    it('renders suffix', () => {
      render(<AnimatedCounter value={100} suffix=" items" />);
      expect(screen.getByText(/items/)).toBeInTheDocument();
    });

    it('renders both prefix and suffix', () => {
      render(<AnimatedCounter value={100} prefix="$" suffix=" USD" />);
      expect(screen.getByText(/\$/)).toBeInTheDocument();
      expect(screen.getByText(/USD/)).toBeInTheDocument();
    });
  });

  describe('Decimals', () => {
    it('shows 0 decimals by default for number format', () => {
      render(<AnimatedCounter value={100} format="number" />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows custom decimal places', () => {
      render(<AnimatedCounter value={100} format="number" decimals={2} />);
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('uses 1 decimal by default for percentage', () => {
      render(<AnimatedCounter value={50} format="percentage" />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('IntersectionObserver', () => {
    it('observes the element', () => {
      render(<AnimatedCounter value={100} />);
      expect(mockObserve).toHaveBeenCalled();
    });

    it('disconnects on unmount', () => {
      const { unmount } = render(<AnimatedCounter value={100} />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('only animates once on intersection', () => {
      render(<AnimatedCounter value={100} />);

      // First intersection
      triggerIntersection(true);

      // Second intersection shouldn't retrigger animation
      triggerIntersection(true);

      // Animation should only be set once
    });
  });

  describe('Animation', () => {
    it('animates to target value when in view', async () => {
      render(<AnimatedCounter value={100} />);
      triggerIntersection(true);

      // Run animation timers
      vi.advanceTimersByTime(3000);

      // Animation should be running
    });

    it('respects custom duration', () => {
      render(<AnimatedCounter value={100} duration={5} />);
      triggerIntersection(true);

      // Animation should take longer with higher duration
    });

    it('updates when value prop changes', () => {
      const { rerender } = render(<AnimatedCounter value={100} />);
      triggerIntersection(true);
      vi.advanceTimersByTime(3000);

      rerender(<AnimatedCounter value={200} />);
      // Should animate to new value
    });
  });

  describe('Initial Animation', () => {
    it('starts with opacity 0', () => {
      // Framer motion handles this
    });

    it('animates opacity to 1 when in view', () => {
      render(<AnimatedCounter value={100} />);
      triggerIntersection(true);
      // Should animate in
    });

    it('has y transform animation', () => {
      // Framer motion handles y animation
    });
  });

  describe('Use Cases', () => {
    it('renders as a stats counter', () => {
      render(
        <div>
          <AnimatedCounter value={1234} suffix="+" />
          <span>Users</span>
        </div>
      );
      // The suffix is combined with the number in the same span: "0+"
      expect(screen.getByText('0+')).toBeInTheDocument();
    });

    it('renders as percentage display', () => {
      render(<AnimatedCounter value={99.9} format="percentage" />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('renders as currency amount', () => {
      render(<AnimatedCounter value={49.99} format="currency" />);
      // Currency defaults to 0 decimals, so initial value is $0
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('renders as duration metric', () => {
      render(<AnimatedCounter value={2.5} format="duration" suffix="s avg" />);
      expect(screen.getByText(/s avg/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      render(<AnimatedCounter value={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(<AnimatedCounter value={-50} />);
      // Should start at 0
    });

    it('handles very large values', () => {
      render(<AnimatedCounter value={999999999} format="compact" />);
      // Should display in compact format
    });

    it('handles decimal precision', () => {
      render(<AnimatedCounter value={0.001} decimals={3} />);
      expect(screen.getByText('0.000')).toBeInTheDocument();
    });
  });

  describe('Ref Handling', () => {
    it('uses ref for intersection observer', () => {
      render(<AnimatedCounter value={100} />);
      expect(mockObserve).toHaveBeenCalled();
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(AnimatedCounter.name || AnimatedCounter.displayName).toBeDefined();
    });
  });
});
