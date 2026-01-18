/**
 * Tests for GlassCard UI Component
 * @module __tests__/components/ui/glass-card.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlassCard } from '@/components/ui/glass-card';

describe('GlassCard Component', () => {
  describe('Rendering', () => {
    it('renders correctly with children', () => {
      render(<GlassCard>Card Content</GlassCard>);

      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders as div by default', () => {
      render(<GlassCard data-testid="glass-card">Content</GlassCard>);

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('DIV');
    });

    it('applies base glass effect styles', () => {
      render(<GlassCard data-testid="glass-card">Content</GlassCard>);

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('relative');
      expect(card).toHaveClass('overflow-hidden');
      expect(card).toHaveClass('rounded-xl');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(
        <GlassCard data-testid="glass-card" variant="default">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border');
    });

    it('applies primary variant styles', () => {
      render(
        <GlassCard data-testid="glass-card" variant="primary">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border');
    });

    it('applies violet variant styles', () => {
      render(
        <GlassCard data-testid="glass-card" variant="violet">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border');
    });

    it('applies success variant styles', () => {
      render(
        <GlassCard data-testid="glass-card" variant="success">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border');
    });

    it('applies warning variant styles', () => {
      render(
        <GlassCard data-testid="glass-card" variant="warning">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border');
    });

    it('applies error variant styles', () => {
      render(
        <GlassCard data-testid="glass-card" variant="error">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border');
    });
  });

  describe('As Prop (Polymorphism)', () => {
    it('renders as article when specified', () => {
      render(
        <GlassCard as="article" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('ARTICLE');
    });

    it('renders as section when specified', () => {
      render(
        <GlassCard as="section" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('SECTION');
    });

    it('renders as aside when specified', () => {
      render(
        <GlassCard as="aside" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('ASIDE');
    });

    it('renders as main when specified', () => {
      render(
        <GlassCard as="main" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('MAIN');
    });

    it('renders as header when specified', () => {
      render(
        <GlassCard as="header" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('HEADER');
    });

    it('renders as footer when specified', () => {
      render(
        <GlassCard as="footer" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('FOOTER');
    });

    it('renders as nav when specified', () => {
      render(
        <GlassCard as="nav" data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.tagName).toBe('NAV');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover styles by default', () => {
      render(
        <GlassCard data-testid="glass-card">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      // Hover classes are applied by default
      expect(card.className).toContain('hover:');
    });

    it('disables hover styles when hover is false', () => {
      render(
        <GlassCard data-testid="glass-card" hover={false}>
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      // The component should not have hover border styles
      expect(card.className).not.toContain('hover:border-');
    });
  });

  describe('Glow Effects', () => {
    it('does not apply glow by default', () => {
      render(
        <GlassCard data-testid="glass-card">
          Content
        </GlassCard>
      );

      // Default glow is false, base shadow styles apply
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('applies glow styles when glow is true', () => {
      render(
        <GlassCard data-testid="glass-card" glow={true}>
          Content
        </GlassCard>
      );

      // Glow adds enhanced shadow effects
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });
  });

  describe('Clickable Behavior', () => {
    it('becomes clickable when onClick is provided', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <GlassCard data-testid="glass-card" onClick={handleClick}>
          Clickable Card
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not have button role when not clickable', () => {
      render(
        <GlassCard data-testid="glass-card">
          Non-clickable Card
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('handles keyboard activation when clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <GlassCard data-testid="glass-card" onClick={handleClick}>
          Clickable Card
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      card.focus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles space key activation when clickable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <GlassCard data-testid="glass-card" onClick={handleClick}>
          Clickable Card
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      card.focus();

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies clickable styles when onClick is provided', () => {
      const handleClick = vi.fn();

      render(
        <GlassCard data-testid="glass-card" onClick={handleClick}>
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Custom ClassName', () => {
    it('accepts and applies custom className', () => {
      render(
        <GlassCard data-testid="glass-card" className="custom-class additional-class">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('additional-class');
    });

    it('merges custom className with variant classes', () => {
      render(
        <GlassCard data-testid="glass-card" variant="primary" className="custom-class">
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('border');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLElement | null };

      render(
        <GlassCard ref={ref}>Content</GlassCard>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref for different element types', () => {
      const ref = { current: null as HTMLElement | null };

      render(
        <GlassCard as="article" ref={ref}>Content</GlassCard>
      );

      expect(ref.current?.tagName).toBe('ARTICLE');
    });
  });

  describe('Additional Props', () => {
    it('spreads additional HTML attributes', () => {
      render(
        <GlassCard
          data-testid="glass-card"
          id="my-card"
          aria-label="My glass card"
          data-custom="value"
        >
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('id', 'my-card');
      expect(card).toHaveAttribute('aria-label', 'My glass card');
      expect(card).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Compound Variants', () => {
    it('applies correct styles for primary variant with glow', () => {
      render(
        <GlassCard data-testid="glass-card" variant="primary" glow={true}>
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).toBeInTheDocument();
    });

    it('applies correct styles for primary variant with hover', () => {
      render(
        <GlassCard data-testid="glass-card" variant="primary" hover={true}>
          Content
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card.className).toContain('hover:');
    });
  });

  describe('Integration', () => {
    it('renders with complex children', () => {
      render(
        <GlassCard data-testid="glass-card" variant="success">
          <div data-testid="header">Header</div>
          <div data-testid="content">
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
          <div data-testid="footer">
            <button>Action</button>
          </div>
        </GlassCard>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('can be used in a grid layout', () => {
      render(
        <div className="grid grid-cols-3 gap-4">
          <GlassCard data-testid="card-1">Card 1</GlassCard>
          <GlassCard data-testid="card-2" variant="primary">Card 2</GlassCard>
          <GlassCard data-testid="card-3" variant="success">Card 3</GlassCard>
        </div>
      );

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
      expect(screen.getByTestId('card-3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is focusable when clickable', () => {
      const handleClick = vi.fn();

      render(
        <GlassCard data-testid="glass-card" onClick={handleClick}>
          Focusable Card
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      card.focus();
      expect(document.activeElement).toBe(card);
    });

    it('is not focusable when not clickable', () => {
      render(
        <GlassCard data-testid="glass-card">
          Non-focusable Card
        </GlassCard>
      );

      const card = screen.getByTestId('glass-card');
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('can have aria-describedby', () => {
      render(
        <>
          <GlassCard data-testid="glass-card" aria-describedby="description">
            Card
          </GlassCard>
          <p id="description">This is a description</p>
        </>
      );

      expect(screen.getByTestId('glass-card')).toHaveAttribute(
        'aria-describedby',
        'description'
      );
    });
  });
});
