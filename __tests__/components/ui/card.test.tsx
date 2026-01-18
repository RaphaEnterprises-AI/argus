/**
 * Tests for Card UI Components
 * @module __tests__/components/ui/card.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly', () => {
      render(<Card data-testid="card">Card content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card content');
    });

    it('applies default styles', () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('shadow-sm');
    });

    it('accepts custom className', () => {
      render(<Card data-testid="card" className="custom-card">Content</Card>);

      expect(screen.getByTestId('card')).toHaveClass('custom-card');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Content</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional props', () => {
      render(
        <Card data-testid="card" aria-label="Test card">
          Content
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'Test card');
    });
  });

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header content</CardHeader>
        </Card>
      );

      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header content');
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });

    it('accepts custom className', () => {
      render(
        <Card>
          <CardHeader data-testid="header" className="custom-header">
            Header
          </CardHeader>
        </Card>
      );

      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Card>
          <CardHeader ref={ref}>Header</CardHeader>
        </Card>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
    });

    it('accepts custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title" className="custom-title">
              Title
            </CardTitle>
          </CardHeader>
        </Card>
      );

      expect(screen.getByTestId('title')).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLParagraphElement | null };
      render(
        <Card>
          <CardHeader>
            <CardTitle ref={ref}>Title</CardTitle>
          </CardHeader>
        </Card>
      );

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('renders correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveClass('text-muted-foreground');
    });

    it('renders as paragraph element', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const desc = screen.getByTestId('desc');
      expect(desc.tagName).toBe('P');
    });

    it('accepts custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="desc" className="custom-desc">
              Description
            </CardDescription>
          </CardHeader>
        </Card>
      );

      expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('renders correctly', () => {
      render(
        <Card>
          <CardContent data-testid="content">Main content here</CardContent>
        </Card>
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Main content here');
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('accepts custom className', () => {
      render(
        <Card>
          <CardContent data-testid="content" className="custom-content">
            Content
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Card>
          <CardContent ref={ref}>Content</CardContent>
        </Card>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders correctly', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('footer')).toHaveTextContent('Footer content');
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('accepts custom className', () => {
      render(
        <Card>
          <CardFooter data-testid="footer" className="custom-footer">
            Footer
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Card>
          <CardFooter ref={ref}>Footer</CardFooter>
        </Card>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Integration', () => {
    it('renders a complete card with all parts', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Project Settings</CardTitle>
            <CardDescription>
              Configure your project settings here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <input type="text" placeholder="Project name" />
            </form>
          </CardContent>
          <CardFooter>
            <button type="submit">Save</button>
            <button type="button">Cancel</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 3, name: 'Project Settings' })).toBeInTheDocument();
      expect(screen.getByText('Configure your project settings here.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders nested cards correctly', () => {
      render(
        <Card data-testid="outer-card">
          <CardContent>
            <Card data-testid="inner-card">
              <CardContent>Inner card content</CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('outer-card')).toBeInTheDocument();
      expect(screen.getByTestId('inner-card')).toBeInTheDocument();
      expect(screen.getByText('Inner card content')).toBeInTheDocument();
    });

    it('renders card without header or footer', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent>Just content</CardContent>
        </Card>
      );

      expect(screen.getByTestId('minimal-card')).toBeInTheDocument();
      expect(screen.getByText('Just content')).toBeInTheDocument();
    });

    it('renders card with multiple content sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="section-1">Section 1</div>
          </CardContent>
          <CardContent>
            <div data-testid="section-2">Section 2</div>
          </CardContent>
          <CardFooter>
            <span>Last updated: Today</span>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('section-1')).toBeInTheDocument();
      expect(screen.getByTestId('section-2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('card can have role article', () => {
      render(
        <Card role="article" data-testid="card">
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('card title can be referenced by aria-labelledby', () => {
      render(
        <Card role="region" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">My Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });
  });
});
