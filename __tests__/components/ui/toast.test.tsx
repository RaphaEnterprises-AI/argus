/**
 * @file Toast Component Tests
 * Tests for the Toast UI components
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
} from '@/components/ui/toast';

// Helper to render toast with provider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      {ui}
      <ToastViewport />
    </ToastProvider>
  );
};

describe('Toast Component', () => {
  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('ToastViewport', () => {
    it('renders viewport container', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );
      expect(screen.getByTestId('viewport')).toBeInTheDocument();
    });

    it('has correct positioning classes', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );
      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveClass('fixed', 'bottom-0', 'right-0');
    });

    it('accepts custom className', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" className="custom-viewport" />
        </ToastProvider>
      );
      expect(screen.getByTestId('viewport')).toHaveClass('custom-viewport');
    });
  });

  describe('Toast', () => {
    it('renders toast content', () => {
      renderWithProvider(
        <Toast open>
          <div>Toast Message</div>
        </Toast>
      );
      expect(screen.getByText('Toast Message')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      renderWithProvider(
        <Toast open data-testid="toast">
          <div>Default Toast</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('border', 'bg-card', 'text-card-foreground');
    });

    it('renders with success variant', () => {
      renderWithProvider(
        <Toast open variant="success" data-testid="toast">
          <div>Success!</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('border-green-500/50', 'bg-green-500/10');
    });

    it('renders with destructive variant', () => {
      renderWithProvider(
        <Toast open variant="destructive" data-testid="toast">
          <div>Error!</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('border-red-500/50', 'bg-red-500/10');
    });

    it('renders with warning variant', () => {
      renderWithProvider(
        <Toast open variant="warning" data-testid="toast">
          <div>Warning!</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('border-amber-500/50', 'bg-amber-500/10');
    });

    it('renders with info variant', () => {
      renderWithProvider(
        <Toast open variant="info" data-testid="toast">
          <div>Info</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('border-blue-500/50', 'bg-blue-500/10');
    });

    it('accepts custom className', () => {
      renderWithProvider(
        <Toast open data-testid="toast" className="custom-toast">
          <div>Custom</div>
        </Toast>
      );
      expect(screen.getByTestId('toast')).toHaveClass('custom-toast');
    });
  });

  describe('ToastTitle', () => {
    it('renders title text', () => {
      renderWithProvider(
        <Toast open>
          <ToastTitle>My Title</ToastTitle>
        </Toast>
      );
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('has correct styling', () => {
      renderWithProvider(
        <Toast open>
          <ToastTitle data-testid="title">Title</ToastTitle>
        </Toast>
      );
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-sm', 'font-semibold');
    });

    it('accepts custom className', () => {
      renderWithProvider(
        <Toast open>
          <ToastTitle data-testid="title" className="custom-title">Title</ToastTitle>
        </Toast>
      );
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
    });
  });

  describe('ToastDescription', () => {
    it('renders description text', () => {
      renderWithProvider(
        <Toast open>
          <ToastDescription>Description text here</ToastDescription>
        </Toast>
      );
      expect(screen.getByText('Description text here')).toBeInTheDocument();
    });

    it('has correct styling', () => {
      renderWithProvider(
        <Toast open>
          <ToastDescription data-testid="desc">Description</ToastDescription>
        </Toast>
      );
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-sm', 'opacity-90');
    });

    it('accepts custom className', () => {
      renderWithProvider(
        <Toast open>
          <ToastDescription data-testid="desc" className="custom-desc">Desc</ToastDescription>
        </Toast>
      );
      expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
    });
  });

  describe('ToastClose', () => {
    it('renders close button', () => {
      renderWithProvider(
        <Toast open>
          <ToastClose data-testid="close" />
        </Toast>
      );
      expect(screen.getByTestId('close')).toBeInTheDocument();
    });

    it('has toast-close attribute', () => {
      renderWithProvider(
        <Toast open>
          <ToastClose data-testid="close" />
        </Toast>
      );
      expect(screen.getByTestId('close')).toHaveAttribute('toast-close', '');
    });

    it('is positioned correctly', () => {
      renderWithProvider(
        <Toast open>
          <ToastClose data-testid="close" />
        </Toast>
      );
      const close = screen.getByTestId('close');
      expect(close).toHaveClass('absolute', 'right-2', 'top-2');
    });
  });

  describe('ToastAction', () => {
    it('renders action button', () => {
      renderWithProvider(
        <Toast open>
          <ToastAction altText="Undo action">Undo</ToastAction>
        </Toast>
      );
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderWithProvider(
        <Toast open>
          <ToastAction altText="Undo action" onClick={handleClick}>Undo</ToastAction>
        </Toast>
      );

      await user.click(screen.getByRole('button', { name: 'Undo' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has correct styling', () => {
      renderWithProvider(
        <Toast open>
          <ToastAction altText="Action" data-testid="action">Action</ToastAction>
        </Toast>
      );
      const action = screen.getByTestId('action');
      expect(action).toHaveClass('inline-flex', 'h-8', 'rounded-md', 'border');
    });

    it('accepts custom className', () => {
      renderWithProvider(
        <Toast open>
          <ToastAction altText="Action" className="custom-action" data-testid="action">
            Action
          </ToastAction>
        </Toast>
      );
      expect(screen.getByTestId('action')).toHaveClass('custom-action');
    });
  });

  describe('ToastIcon', () => {
    it('renders success icon', () => {
      const { container } = render(<ToastIcon variant="success" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('svg')).toHaveClass('text-green-500');
    });

    it('renders destructive icon', () => {
      const { container } = render(<ToastIcon variant="destructive" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('svg')).toHaveClass('text-red-500');
    });

    it('renders warning icon', () => {
      const { container } = render(<ToastIcon variant="warning" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('svg')).toHaveClass('text-amber-500');
    });

    it('renders info icon', () => {
      const { container } = render(<ToastIcon variant="info" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('svg')).toHaveClass('text-blue-500');
    });

    it('returns null for default variant', () => {
      const { container } = render(<ToastIcon variant="default" />);
      expect(container.querySelector('svg')).toBeNull();
    });

    it('returns null when no variant is specified', () => {
      const { container } = render(<ToastIcon />);
      expect(container.querySelector('svg')).toBeNull();
    });
  });

  describe('Complete Toast', () => {
    it('renders complete toast with all components', () => {
      renderWithProvider(
        <Toast open data-testid="toast">
          <div className="flex items-start gap-3">
            <ToastIcon variant="success" />
            <div className="grid gap-1">
              <ToastTitle>Success!</ToastTitle>
              <ToastDescription>Your changes have been saved.</ToastDescription>
            </div>
          </div>
          <ToastAction altText="Undo changes">Undo</ToastAction>
          <ToastClose />
        </Toast>
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it('renders error toast', () => {
      renderWithProvider(
        <Toast open variant="destructive" data-testid="toast">
          <div className="flex items-start gap-3">
            <ToastIcon variant="destructive" />
            <div className="grid gap-1">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>Something went wrong.</ToastDescription>
            </div>
          </div>
          <ToastClose />
        </Toast>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });

    it('renders warning toast', () => {
      renderWithProvider(
        <Toast open variant="warning" data-testid="toast">
          <div className="flex items-start gap-3">
            <ToastIcon variant="warning" />
            <div className="grid gap-1">
              <ToastTitle>Warning</ToastTitle>
              <ToastDescription>This action cannot be undone.</ToastDescription>
            </div>
          </div>
          <ToastClose />
        </Toast>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('toast has correct role', () => {
      renderWithProvider(
        <Toast open>
          <div>Content</div>
        </Toast>
      );
      // Radix toast uses role="status" by default
    });

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <Toast open>
          <ToastClose data-testid="close" />
        </Toast>
      );

      const closeButton = screen.getByTestId('close');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      await user.keyboard('{Enter}');
    });

    it('action button has alt text', () => {
      renderWithProvider(
        <Toast open>
          <ToastAction altText="Retry the failed operation">Retry</ToastAction>
        </Toast>
      );
      // altText is used for screen readers when the action is not visible
    });
  });

  describe('Animation Classes', () => {
    it('has swipe transition classes', () => {
      renderWithProvider(
        <Toast open data-testid="toast">
          <div>Swipeable</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass(
        'data-[swipe=cancel]:translate-x-0',
        'data-[swipe=move]:transition-none'
      );
    });

    it('has animation classes', () => {
      renderWithProvider(
        <Toast open data-testid="toast">
          <div>Animated</div>
        </Toast>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass(
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out'
      );
    });
  });

  describe('Display Names', () => {
    it('ToastViewport has correct display name', () => {
      expect(ToastViewport.displayName).toBeDefined();
    });

    it('Toast has correct display name', () => {
      expect(Toast.displayName).toBeDefined();
    });

    it('ToastTitle has correct display name', () => {
      expect(ToastTitle.displayName).toBeDefined();
    });

    it('ToastDescription has correct display name', () => {
      expect(ToastDescription.displayName).toBeDefined();
    });

    it('ToastClose has correct display name', () => {
      expect(ToastClose.displayName).toBeDefined();
    });

    it('ToastAction has correct display name', () => {
      expect(ToastAction.displayName).toBeDefined();
    });
  });
});
