/**
 * @file PageWrapper Component Tests
 * Tests for the PageWrapper layout component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageWrapper } from '@/components/layout/page-wrapper';

// Mock the Sidebar component
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

// Mock the AppFooter component
vi.mock('@/components/layout/app-footer', () => ({
  AppFooter: () => <footer data-testid="app-footer">Footer</footer>,
}));

describe('PageWrapper Component', () => {
  describe('Basic Rendering', () => {
    it('renders children content', () => {
      render(
        <PageWrapper>
          <div data-testid="content">Page Content</div>
        </PageWrapper>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    it('renders the Sidebar', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders the AppFooter by default', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    });
  });

  describe('Footer Visibility', () => {
    it('shows footer when showFooter is true', () => {
      render(
        <PageWrapper showFooter={true}>
          <div>Content</div>
        </PageWrapper>
      );
      expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    });

    it('hides footer when showFooter is false', () => {
      render(
        <PageWrapper showFooter={false}>
          <div>Content</div>
        </PageWrapper>
      );
      expect(screen.queryByTestId('app-footer')).not.toBeInTheDocument();
    });

    it('shows footer by default (showFooter defaults to true)', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has flex container at root', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      expect(container.firstChild).toHaveClass('flex', 'min-h-screen');
    });

    it('main content has flex-1 for full width', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      const mainContainer = container.querySelector('.flex-1');
      expect(mainContainer).toBeInTheDocument();
    });

    it('has margin for sidebar space', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      const mainContainer = container.querySelector('.ml-64');
      expect(mainContainer).toBeInTheDocument();
    });

    it('content area is a main element', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('main has flex-1 class', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      const main = document.querySelector('main');
      expect(main).toHaveClass('flex-1');
    });
  });

  describe('Children Rendering', () => {
    it('renders multiple children', () => {
      render(
        <PageWrapper>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </PageWrapper>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders complex nested children', () => {
      render(
        <PageWrapper>
          <div data-testid="wrapper">
            <header>Page Header</header>
            <section>
              <article>Article content</article>
            </section>
          </div>
        </PageWrapper>
      );
      expect(screen.getByText('Page Header')).toBeInTheDocument();
      expect(screen.getByText('Article content')).toBeInTheDocument();
    });

    it('renders text content directly', () => {
      render(
        <PageWrapper>
          Simple text content
        </PageWrapper>
      );
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });
  });

  describe('Flex Direction', () => {
    it('main container uses flex-col', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      const flexCol = container.querySelector('.flex-col');
      expect(flexCol).toBeInTheDocument();
    });

    it('footer is positioned at bottom due to flex', () => {
      render(
        <PageWrapper showFooter={true}>
          <div>Content</div>
        </PageWrapper>
      );
      // AppFooter should be after main content in DOM order
      const main = document.querySelector('main');
      const footer = screen.getByTestId('app-footer');
      expect(main?.nextElementSibling).toBe(footer);
    });
  });

  describe('Responsive Behavior', () => {
    it('has min-h-screen for full viewport height', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      expect(container.firstChild).toHaveClass('min-h-screen');
    });
  });

  describe('Semantic Structure', () => {
    it('contains aside (sidebar) and main elements', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      expect(document.querySelector('aside')).toBeInTheDocument();
      expect(document.querySelector('main')).toBeInTheDocument();
    });

    it('sidebar is before main in DOM', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );
      const sidebar = screen.getByTestId('sidebar');
      const main = document.querySelector('main');
      expect(sidebar.compareDocumentPosition(main as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('renders with null children', () => {
      render(
        <PageWrapper>
          {null}
        </PageWrapper>
      );
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders with empty fragment', () => {
      render(
        <PageWrapper>
          <></>
        </PageWrapper>
      );
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders with conditional children', () => {
      const showContent = true;
      render(
        <PageWrapper>
          {showContent && <div data-testid="conditional">Shown</div>}
        </PageWrapper>
      );
      expect(screen.getByTestId('conditional')).toBeInTheDocument();
    });
  });
});
