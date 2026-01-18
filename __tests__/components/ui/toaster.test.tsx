/**
 * @file Toaster Component Tests
 * Tests for the Toaster UI component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toaster } from '@/components/ui/toaster';

// Mock the toast components
vi.mock('@/components/ui/toast', () => ({
  Toast: ({ children, variant, ...props }: any) => (
    <div data-testid="toast" data-variant={variant} {...props}>
      {children}
    </div>
  ),
  ToastClose: () => <button data-testid="toast-close">Close</button>,
  ToastDescription: ({ children }: any) => (
    <div data-testid="toast-description">{children}</div>
  ),
  ToastIcon: ({ variant }: { variant?: string }) => (
    <span data-testid="toast-icon" data-variant={variant} />
  ),
  ToastProvider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
  ToastTitle: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport" />,
}));

// Mock the useToast hook
const mockToasts: any[] = [];
vi.mock('@/lib/hooks/useToast', () => ({
  useToast: () => ({
    toasts: mockToasts,
  }),
}));

describe('Toaster Component', () => {
  beforeEach(() => {
    // Reset mocked toasts before each test
    mockToasts.length = 0;
  });

  describe('Rendering', () => {
    it('renders the ToastProvider', () => {
      render(<Toaster />);
      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    });

    it('renders the ToastViewport', () => {
      render(<Toaster />);
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
    });

    it('renders no toasts when toasts array is empty', () => {
      render(<Toaster />);
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });
  });

  describe('Toast Rendering', () => {
    it('renders a toast when one is in the array', () => {
      mockToasts.push({
        id: '1',
        title: 'Test Toast',
        description: 'Test description',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });

    it('renders toast title', () => {
      mockToasts.push({
        id: '1',
        title: 'Success Title',
        description: 'Description',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast-title')).toBeInTheDocument();
      expect(screen.getByText('Success Title')).toBeInTheDocument();
    });

    it('renders toast description', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'This is a description',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast-description')).toBeInTheDocument();
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('renders toast icon with correct variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'Description',
        variant: 'success',
      });

      render(<Toaster />);
      const icon = screen.getByTestId('toast-icon');
      expect(icon).toHaveAttribute('data-variant', 'success');
    });

    it('renders toast close button', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'Description',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });

    it('passes variant to Toast component', () => {
      mockToasts.push({
        id: '1',
        title: 'Error',
        description: 'Error description',
        variant: 'destructive',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'destructive');
    });
  });

  describe('Multiple Toasts', () => {
    it('renders multiple toasts', () => {
      mockToasts.push(
        {
          id: '1',
          title: 'Toast 1',
          description: 'Description 1',
          variant: 'default',
        },
        {
          id: '2',
          title: 'Toast 2',
          description: 'Description 2',
          variant: 'success',
        },
        {
          id: '3',
          title: 'Toast 3',
          description: 'Description 3',
          variant: 'destructive',
        }
      );

      render(<Toaster />);
      expect(screen.getAllByTestId('toast')).toHaveLength(3);
    });

    it('renders each toast with unique key', () => {
      mockToasts.push(
        { id: '1', title: 'Toast 1', variant: 'default' },
        { id: '2', title: 'Toast 2', variant: 'default' }
      );

      render(<Toaster />);
      const toasts = screen.getAllByTestId('toast');
      expect(toasts[0]).not.toBe(toasts[1]);
    });
  });

  describe('Toast Variants', () => {
    it('handles default variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Default',
        description: 'Default toast',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'default');
    });

    it('handles success variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Success',
        description: 'Success toast',
        variant: 'success',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'success');
    });

    it('handles destructive variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Error',
        description: 'Error toast',
        variant: 'destructive',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'destructive');
    });

    it('handles warning variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Warning',
        description: 'Warning toast',
        variant: 'warning',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'warning');
    });

    it('handles info variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Info',
        description: 'Info toast',
        variant: 'info',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-variant', 'info');
    });

    it('handles undefined variant (defaults correctly)', () => {
      mockToasts.push({
        id: '1',
        title: 'No Variant',
        description: 'Toast without explicit variant',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });
  });

  describe('Optional Toast Content', () => {
    it('renders without title', () => {
      mockToasts.push({
        id: '1',
        description: 'Only description',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
    });

    it('renders without description', () => {
      mockToasts.push({
        id: '1',
        title: 'Only title',
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
    });

    it('renders with action', () => {
      const actionElement = <button key="action">Undo</button>;
      mockToasts.push({
        id: '1',
        title: 'With Action',
        description: 'Has an action button',
        action: actionElement,
        variant: 'default',
      });

      render(<Toaster />);
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('wraps icon and text in flex container', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'Description',
        variant: 'success',
      });

      const { container } = render(<Toaster />);
      const flexContainer = container.querySelector('.flex.items-start.gap-3');
      expect(flexContainer).toBeInTheDocument();
    });

    it('wraps title and description in grid', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'Description',
        variant: 'default',
      });

      const { container } = render(<Toaster />);
      const gridContainer = container.querySelector('.grid.gap-1');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Extra Props', () => {
    it('passes extra props to Toast component', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'Description',
        variant: 'default',
        'data-custom': 'value',
      });

      render(<Toaster />);
      expect(screen.getByTestId('toast')).toHaveAttribute('data-custom', 'value');
    });
  });
});
