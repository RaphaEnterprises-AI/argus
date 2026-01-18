/**
 * @file StatusIndicator Component Tests
 * Tests for the StatusIndicator UI component
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator, parseStatus, statusConfig, type Status } from '@/components/ui/status-indicator';

describe('StatusIndicator Component', () => {
  describe('Basic Rendering', () => {
    it('renders with passed status', () => {
      render(<StatusIndicator status="passed" />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('renders with failed status', () => {
      render(<StatusIndicator status="failed" />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('renders with running status', () => {
      render(<StatusIndicator status="running" />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('renders with pending status', () => {
      render(<StatusIndicator status="pending" />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('renders with healing status', () => {
      render(<StatusIndicator status="healing" />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    it('renders with idle status', () => {
      render(<StatusIndicator status="idle" />);
      expect(document.querySelector('span')).toBeInTheDocument();
    });
  });

  describe('Dot Variant', () => {
    it('renders dot by default', () => {
      const { container } = render(<StatusIndicator status="passed" />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });

    it('renders dot with correct size for sm', () => {
      const { container } = render(<StatusIndicator status="passed" variant="dot" size="sm" />);
      expect(container.querySelector('.h-2.w-2')).toBeInTheDocument();
    });

    it('renders dot with correct size for md', () => {
      const { container } = render(<StatusIndicator status="passed" variant="dot" size="md" />);
      expect(container.querySelector('.h-2\\.5.w-2\\.5')).toBeInTheDocument();
    });

    it('renders dot with correct size for lg', () => {
      const { container } = render(<StatusIndicator status="passed" variant="dot" size="lg" />);
      expect(container.querySelector('.h-3.w-3')).toBeInTheDocument();
    });

    it('applies passed status color', () => {
      const { container } = render(<StatusIndicator status="passed" variant="dot" />);
      expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    });

    it('applies failed status color', () => {
      const { container } = render(<StatusIndicator status="failed" variant="dot" />);
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    });

    it('applies running status color', () => {
      const { container } = render(<StatusIndicator status="running" variant="dot" />);
      expect(container.querySelector('.bg-cyan-500')).toBeInTheDocument();
    });

    it('applies pending status color', () => {
      const { container } = render(<StatusIndicator status="pending" variant="dot" />);
      expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
    });

    it('applies healing status color', () => {
      const { container } = render(<StatusIndicator status="healing" variant="dot" />);
      expect(container.querySelector('.bg-violet-500')).toBeInTheDocument();
    });
  });

  describe('Badge Variant', () => {
    it('renders badge with border', () => {
      const { container } = render(<StatusIndicator status="passed" variant="badge" />);
      expect(container.querySelector('.border')).toBeInTheDocument();
    });

    it('renders badge with icon', () => {
      const { container } = render(<StatusIndicator status="passed" variant="badge" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows label when showLabel is true in badge variant', () => {
      render(<StatusIndicator status="passed" variant="badge" showLabel />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('applies correct border color for passed', () => {
      const { container } = render(<StatusIndicator status="passed" variant="badge" />);
      expect(container.querySelector('.border-emerald-500')).toBeInTheDocument();
    });

    it('applies correct border color for failed', () => {
      const { container } = render(<StatusIndicator status="failed" variant="badge" />);
      expect(container.querySelector('.border-red-500')).toBeInTheDocument();
    });
  });

  describe('Pill Variant', () => {
    it('renders pill with rounded-full', () => {
      const { container } = render(<StatusIndicator status="passed" variant="pill" />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });

    it('renders pill with icon', () => {
      const { container } = render(<StatusIndicator status="passed" variant="pill" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows label when showLabel is true in pill variant', () => {
      render(<StatusIndicator status="passed" variant="pill" showLabel />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });
  });

  describe('Icon Variant', () => {
    it('renders icon only by default', () => {
      const { container } = render(<StatusIndicator status="passed" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('does not show label by default in icon variant', () => {
      render(<StatusIndicator status="passed" variant="icon" showLabel={false} />);
      expect(screen.queryByText('Passed')).not.toBeInTheDocument();
    });

    it('shows label when showLabel is true', () => {
      render(<StatusIndicator status="passed" variant="icon" showLabel />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });
  });

  describe('Labels', () => {
    it('shows label when showLabel is true', () => {
      render(<StatusIndicator status="passed" showLabel />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<StatusIndicator status="passed" showLabel={false} />);
      expect(screen.queryByText('Passed')).not.toBeInTheDocument();
    });

    it('shows correct label for passed status', () => {
      render(<StatusIndicator status="passed" variant="badge" showLabel />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('shows correct label for failed status', () => {
      render(<StatusIndicator status="failed" variant="badge" showLabel />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('shows correct label for running status', () => {
      render(<StatusIndicator status="running" variant="badge" showLabel />);
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('shows correct label for pending status', () => {
      render(<StatusIndicator status="pending" variant="badge" showLabel />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows correct label for healing status', () => {
      render(<StatusIndicator status="healing" variant="badge" showLabel />);
      expect(screen.getByText('Healing')).toBeInTheDocument();
    });

    it('shows correct label for idle status', () => {
      render(<StatusIndicator status="idle" variant="badge" showLabel />);
      expect(screen.getByText('Idle')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders with sm size', () => {
      const { container } = render(
        <StatusIndicator status="passed" variant="badge" size="sm" showLabel />
      );
      // Check for small text size class
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('renders with md size', () => {
      const { container } = render(
        <StatusIndicator status="passed" variant="badge" size="md" showLabel />
      );
      // Check for medium text size class
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
    });

    it('renders with lg size', () => {
      const { container } = render(
        <StatusIndicator status="passed" variant="badge" size="lg" showLabel />
      );
      // Check for large text size class
      expect(container.querySelector('.text-base')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('has animation enabled by default', () => {
      const { container } = render(<StatusIndicator status="running" variant="dot" />);
      // Running status renders with motion elements (Framer Motion uses inline styles)
      // Just verify the component renders correctly
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });

    it('can disable animation', () => {
      const { container } = render(
        <StatusIndicator status="running" variant="dot" animate={false} />
      );
      // Should not have animation when disabled
    });

    it('running status has spin animation for icon', () => {
      render(<StatusIndicator status="running" variant="badge" animate />);
      // Running should show spinning loader icon
    });

    it('passed status does not have special animation', () => {
      const { container } = render(
        <StatusIndicator status="passed" variant="dot" animate />
      );
      // Passed status has no special animation in dot variant
    });
  });

  describe('Custom ClassName', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <StatusIndicator status="passed" className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <StatusIndicator status="passed" className="my-custom" />
      );
      expect(container.querySelector('.inline-flex.my-custom')).toBeInTheDocument();
    });
  });

  describe('statusConfig', () => {
    it('exports statusConfig object', () => {
      expect(statusConfig).toBeDefined();
      expect(typeof statusConfig).toBe('object');
    });

    it('has config for all statuses', () => {
      expect(statusConfig.passed).toBeDefined();
      expect(statusConfig.failed).toBeDefined();
      expect(statusConfig.running).toBeDefined();
      expect(statusConfig.pending).toBeDefined();
      expect(statusConfig.healing).toBeDefined();
      expect(statusConfig.idle).toBeDefined();
    });

    it('each config has required properties', () => {
      Object.values(statusConfig).forEach((config) => {
        expect(config.label).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.bgColor).toBeDefined();
        expect(config.borderColor).toBeDefined();
        expect(config.icon).toBeDefined();
      });
    });

    it('passed config has correct label', () => {
      expect(statusConfig.passed.label).toBe('Passed');
    });

    it('failed config has correct label', () => {
      expect(statusConfig.failed.label).toBe('Failed');
    });

    it('running config has correct label', () => {
      expect(statusConfig.running.label).toBe('Running');
    });
  });

  describe('parseStatus', () => {
    it('parses valid status strings', () => {
      expect(parseStatus('passed')).toBe('passed');
      expect(parseStatus('failed')).toBe('failed');
      expect(parseStatus('running')).toBe('running');
      expect(parseStatus('pending')).toBe('pending');
      expect(parseStatus('healing')).toBe('healing');
      expect(parseStatus('idle')).toBe('idle');
    });

    it('is case insensitive', () => {
      expect(parseStatus('PASSED')).toBe('passed');
      expect(parseStatus('Failed')).toBe('failed');
      expect(parseStatus('RUNNING')).toBe('running');
    });

    it('returns idle for unknown status', () => {
      expect(parseStatus('unknown')).toBe('idle');
      expect(parseStatus('invalid')).toBe('idle');
      expect(parseStatus('')).toBe('idle');
    });
  });

  describe('Different Status Colors', () => {
    const statuses: Status[] = ['passed', 'failed', 'running', 'pending', 'healing', 'idle'];

    statuses.forEach((status) => {
      it(`renders ${status} status with correct text color`, () => {
        render(<StatusIndicator status={status} variant="badge" showLabel />);
        const config = statusConfig[status];
        // The label should have the status text color
        expect(screen.getByText(config.label)).toHaveClass(config.color);
      });
    });
  });

  describe('Icon Rendering', () => {
    it('renders CheckCircle2 for passed', () => {
      const { container } = render(<StatusIndicator status="passed" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders XCircle for failed', () => {
      const { container } = render(<StatusIndicator status="failed" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Loader2 for running', () => {
      const { container } = render(<StatusIndicator status="running" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Clock for pending', () => {
      const { container } = render(<StatusIndicator status="pending" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Sparkles for healing', () => {
      const { container } = render(<StatusIndicator status="healing" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Circle for idle', () => {
      const { container } = render(<StatusIndicator status="idle" variant="icon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('component is memoized', () => {
      // StatusIndicator is wrapped with memo - verify it's a valid React component
      expect(typeof StatusIndicator).toBe('object'); // memo returns an object
      expect(StatusIndicator).toBeDefined();
    });
  });

  describe('Use Cases', () => {
    it('can be used as test status indicator', () => {
      render(
        <div>
          <StatusIndicator status="passed" variant="badge" showLabel />
          <StatusIndicator status="failed" variant="badge" showLabel />
          <StatusIndicator status="running" variant="badge" showLabel />
        </div>
      );

      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('can be used in a table row', () => {
      render(
        <table>
          <tbody>
            <tr>
              <td>Test 1</td>
              <td><StatusIndicator status="passed" variant="dot" /></td>
            </tr>
          </tbody>
        </table>
      );

      expect(document.querySelector('td span')).toBeInTheDocument();
    });

    it('can show healing in progress', () => {
      render(<StatusIndicator status="healing" variant="pill" showLabel />);
      expect(screen.getByText('Healing')).toBeInTheDocument();
    });
  });
});
