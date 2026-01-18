/**
 * @file Badge Component Tests
 * Tests for the Badge UI component
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders a div element by default', () => {
      render(<Badge>Status</Badge>);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('custom-class');
    });

    it('renders with default styling', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    });

    it('applies base styling classes', () => {
      render(<Badge>Base</Badge>);
      const badge = screen.getByText('Base');
      expect(badge).toHaveClass('border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground', 'border-transparent');
    });

    it('renders secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground', 'border-transparent');
    });

    it('renders destructive variant', () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      const badge = screen.getByText('Destructive');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground', 'border-transparent');
    });

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground');
    });

    it('uses default variant when not specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('Props Passing', () => {
    it('passes through id attribute', () => {
      render(<Badge id="my-badge">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveAttribute('id', 'my-badge');
    });

    it('passes through data attributes', () => {
      render(<Badge data-testid="custom-badge" data-state="active">Badge</Badge>);
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toHaveAttribute('data-state', 'active');
    });

    it('passes through role attribute', () => {
      render(<Badge role="status">Active</Badge>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Badge aria-label="Status indicator">Active</Badge>);
      expect(screen.getByLabelText('Status indicator')).toBeInTheDocument();
    });

    it('has focus-visible styles', () => {
      render(<Badge>Focus</Badge>);
      const badge = screen.getByText('Focus');
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
    });

    it('can receive keyboard focus when role is set', () => {
      render(<Badge role="button" tabIndex={0}>Focusable</Badge>);
      const badge = screen.getByRole('button');
      badge.focus();
      expect(document.activeElement).toBe(badge);
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Badge>Simple Text</Badge>);
      expect(screen.getByText('Simple Text')).toBeInTheDocument();
    });

    it('renders with icon content', () => {
      render(
        <Badge>
          <span data-testid="icon">*</span>
          With Icon
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders numbers', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders as status indicator', () => {
      render(<Badge variant="destructive">Failed</Badge>);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Combination of Props', () => {
    it('combines variant and custom className', () => {
      render(
        <Badge variant="secondary" className="my-badge">
          Combined
        </Badge>
      );
      const badge = screen.getByText('Combined');
      expect(badge).toHaveClass('bg-secondary', 'my-badge');
    });

    it('custom className can override variant styles', () => {
      render(
        <Badge variant="default" className="bg-green-500">
          Override
        </Badge>
      );
      const badge = screen.getByText('Override');
      expect(badge).toHaveClass('bg-green-500');
    });
  });

  describe('badgeVariants Function', () => {
    it('exports badgeVariants function', () => {
      expect(typeof badgeVariants).toBe('function');
    });

    it('generates correct classes for default variant', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('generates correct classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    it('generates correct classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
      expect(classes).toContain('text-destructive-foreground');
    });

    it('generates correct classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' });
      expect(classes).toContain('text-foreground');
    });

    it('uses default variant when not specified', () => {
      const classes = badgeVariants({});
      expect(classes).toContain('bg-primary');
    });
  });

  describe('Use Cases', () => {
    it('renders as a counter badge', () => {
      render(
        <Badge variant="secondary" className="rounded-full">
          99+
        </Badge>
      );
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders as a status indicator', () => {
      render(
        <div>
          <Badge variant="default">Active</Badge>
          <Badge variant="secondary">Pending</Badge>
          <Badge variant="destructive">Error</Badge>
        </div>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders as a tag', () => {
      render(
        <div>
          <Badge variant="outline">React</Badge>
          <Badge variant="outline">TypeScript</Badge>
        </div>
      );
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });
});
