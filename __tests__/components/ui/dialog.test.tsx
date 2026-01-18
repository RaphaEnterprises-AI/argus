/**
 * Tests for Dialog UI Components
 * @module __tests__/components/ui/dialog.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('renders dialog when open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes on escape key press', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('DialogTrigger', () => {
    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Triggered Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText('Open Dialog');
      await user.click(trigger);

      expect(screen.getByText('Triggered Dialog')).toBeInTheDocument();
    });

    it('renders as child element when asChild is used', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger asChild>
            <button type="button">Custom Trigger</button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: 'Custom Trigger' });
      expect(trigger.tagName).toBe('BUTTON');
      await user.click(trigger);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('DialogContent', () => {
    it('renders with default styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('fixed');
      expect(content).toHaveClass('z-50');
    });

    it('renders children correctly', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <div data-testid="child-content">Child Content</div>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="custom-class" data-testid="dialog-content">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('dialog-content')).toHaveClass('custom-class');
    });

    it('renders close button with accessible label', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('DialogHeader', () => {
    it('renders with correct styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
    });

    it('accepts custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('dialog-header')).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    it('renders with correct styles', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter data-testid="dialog-footer">
              <button>Action</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('flex');
    });

    it('renders action buttons', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter>
              <button>Cancel</button>
              <button>Submit</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('DialogTitle', () => {
    it('renders with correct heading style', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle data-testid="dialog-title">Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });

    it('renders text content', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('My Dialog Title')).toBeInTheDocument();
    });
  });

  describe('DialogDescription', () => {
    it('renders with muted foreground style', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription data-testid="dialog-desc">
              This is a description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const desc = screen.getByTestId('dialog-desc');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveClass('text-muted-foreground');
    });

    it('renders description text', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Help text for the dialog</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Help text for the dialog')).toBeInTheDocument();
    });
  });

  describe('DialogClose', () => {
    it('closes dialog when clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogClose asChild>
              <button>Close Me</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Close Me'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Accessible Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('dialog is labeled by title', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>My Accessible Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName('My Accessible Title');
    });

    it('dialog is described by description', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>This describes the dialog</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleDescription('This describes the dialog');
    });

    it('focuses dialog content when opened', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Focusable Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Dialog content or close button should receive focus
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(document.activeElement === closeButton || document.activeElement?.closest('[role="dialog"]')).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('renders a complete dialog with all parts', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();
      const handleCancel = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleCancel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when done.
              </DialogDescription>
            </DialogHeader>
            <div>
              <input type="text" placeholder="Name" aria-label="Name" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button">Cancel</button>
              </DialogClose>
              <button type="button" onClick={handleSave}>
                Save changes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Make changes to your profile here. Click save when done.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save changes')).toBeInTheDocument();

      await user.click(screen.getByText('Save changes'));
      expect(handleSave).toHaveBeenCalled();
    });
  });
});
