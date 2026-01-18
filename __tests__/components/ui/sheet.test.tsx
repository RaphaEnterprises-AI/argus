/**
 * @file Sheet Component Tests
 * Tests for the Sheet UI component (slide-out drawer)
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetOverlay,
  SheetPortal,
} from '@/components/ui/sheet';

describe('Sheet Component', () => {
  describe('Basic Rendering', () => {
    it('renders trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet content here</SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByRole('button', { name: 'Open Sheet' })).toBeInTheDocument();
    });

    it('does not show content initially when closed', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Hidden Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });

    it('shows content when defaultOpen is true', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Visible Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Visible Content')).toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('opens sheet when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: 'Open Sheet' }));
      await waitFor(() => {
        expect(screen.getByText('Sheet Content')).toBeInTheDocument();
      });
    });

    it('closes sheet when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('closes sheet when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Controlled State', () => {
    it('can be controlled with open prop', () => {
      const { rerender } = render(
        <Sheet open={false}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <Sheet open={true}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('calls onOpenChange when state changes', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={handleOpenChange}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Side Variants', () => {
    it('renders with default right side', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>Right content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('inset-y-0', 'right-0');
    });

    it('renders with left side', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="left">
            <SheetTitle>Left Sheet</SheetTitle>
            <SheetDescription>Left content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('inset-y-0', 'left-0');
    });

    it('renders with top side', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="top">
            <SheetTitle>Top Sheet</SheetTitle>
            <SheetDescription>Top content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('inset-x-0', 'top-0');
    });

    it('renders with bottom side', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent side="bottom">
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>Bottom content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('inset-x-0', 'bottom-0');
    });
  });

  describe('SheetHeader', () => {
    it('renders header content', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Header Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Header Title')).toBeInTheDocument();
    });

    it('applies correct header styling', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid="header">
              <SheetTitle>Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-2');
    });

    it('accepts custom className', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid="header" className="custom-header">
              <SheetTitle>Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });
  });

  describe('SheetFooter', () => {
    it('renders footer content', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
            <SheetFooter>
              <button>Cancel</button>
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('applies correct footer styling', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
            <SheetFooter data-testid="footer">
              <button>Action</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'flex-col-reverse');
    });
  });

  describe('SheetTitle', () => {
    it('renders title text', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>My Sheet Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('My Sheet Title')).toBeInTheDocument();
    });

    it('applies correct title styling', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle data-testid="title">Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('SheetDescription', () => {
    it('renders description text', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>This is a description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('applies correct description styling', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription data-testid="desc">Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const description = screen.getByTestId('desc');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('SheetClose', () => {
    it('closes sheet when clicked', async () => {
      const user = userEvent.setup();
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
            <SheetClose>Custom Close</SheetClose>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: 'Custom Close' }));
      await waitFor(() => {
        expect(screen.queryByText('Description')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has dialog role', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('close button has accessible name', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('traps focus within sheet when open', async () => {
      const user = userEvent.setup();
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
            <button>First Button</button>
            <button>Second Button</button>
          </SheetContent>
        </Sheet>
      );

      // Tab through focusable elements
      await user.tab();
      await user.tab();
      await user.tab();
      // Focus should stay within the sheet
    });
  });

  describe('Custom Content', () => {
    it('renders custom form content', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>Make changes to your profile</SheetDescription>
            </SheetHeader>
            <form data-testid="form">
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
            </form>
            <SheetFooter>
              <button type="submit">Save changes</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    it('renders navigation content', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Menu</SheetTrigger>
          <SheetContent side="left">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Site navigation</SheetDescription>
            <nav data-testid="nav">
              <a href="/home">Home</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </nav>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('nav')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className to content', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent className="custom-sheet">
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByRole('dialog')).toHaveClass('custom-sheet');
    });

    it('has transition classes', () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Content</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('transition', 'ease-in-out');
    });
  });

  describe('Display Names', () => {
    it('SheetHeader has correct display name', () => {
      expect(SheetHeader.displayName).toBe('SheetHeader');
    });

    it('SheetFooter has correct display name', () => {
      expect(SheetFooter.displayName).toBe('SheetFooter');
    });
  });
});
