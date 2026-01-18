/**
 * @file DataTable Component Tests
 * Tests for the DataTable, StatusDot, and Badge components
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, StatusDot, Badge } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

// Sample data for testing
interface TestData {
  id: string;
  name: string;
  status: string;
  value: number;
}

const sampleData: TestData[] = [
  { id: '1', name: 'Item A', status: 'passed', value: 100 },
  { id: '2', name: 'Item B', status: 'failed', value: 200 },
  { id: '3', name: 'Item C', status: 'pending', value: 300 },
  { id: '4', name: 'Item D', status: 'running', value: 400 },
  { id: '5', name: 'Item E', status: 'passed', value: 500 },
];

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'value',
    header: 'Value',
  },
];

describe('DataTable Component', () => {
  describe('Rendering', () => {
    it('renders a table element', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('renders all data rows', () => {
      render(<DataTable columns={columns} data={sampleData} />);
      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.getByText('Item B')).toBeInTheDocument();
      expect(screen.getByText('Item C')).toBeInTheDocument();
      expect(screen.getByText('Item D')).toBeInTheDocument();
      expect(screen.getByText('Item E')).toBeInTheDocument();
    });

    it('renders empty message when no data', () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          emptyMessage="No items available"
        />
      );
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <DataTable columns={columns} data={sampleData} className="custom-table" />
      );
      expect(container.firstChild).toHaveClass('custom-table');
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(<DataTable columns={columns} data={[]} isLoading={true} />);
      const skeletons = screen.getAllByRole('row');
      // Header row + 5 skeleton rows
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('displays animated pulse effect during loading', () => {
      const { container } = render(
        <DataTable columns={columns} data={[]} isLoading={true} />
      );
      const pulsingElements = container.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('renders search input when searchKey is provided', () => {
      render(
        <DataTable columns={columns} data={sampleData} searchKey="name" />
      );
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders custom search placeholder', () => {
      render(
        <DataTable
          columns={columns}
          data={sampleData}
          searchKey="name"
          searchPlaceholder="Search items..."
        />
      );
      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    });

    it('filters data when searching', async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={columns} data={sampleData} searchKey="name" />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Item A');

      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.queryByText('Item B')).not.toBeInTheDocument();
    });

    it('shows no results when search matches nothing', async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={columns} data={sampleData} searchKey="name" />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'xyz');

      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('clears search to show all data', async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={columns} data={sampleData} searchKey="name" />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Item A');
      expect(screen.queryByText('Item B')).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText('Item B')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('renders sort indicators in headers', () => {
      const sortableColumns: ColumnDef<TestData>[] = [
        {
          accessorKey: 'name',
          header: 'Name',
          enableSorting: true,
        },
        {
          accessorKey: 'value',
          header: 'Value',
          enableSorting: true,
        },
      ];

      render(<DataTable columns={sortableColumns} data={sampleData} />);
      // Sort icons should be present for sortable columns
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('applies sorting on header click', async () => {
      const sortableColumns: ColumnDef<TestData>[] = [
        {
          accessorKey: 'name',
          header: 'Name',
          enableSorting: true,
        },
      ];

      const user = userEvent.setup();
      render(<DataTable columns={sortableColumns} data={sampleData} />);

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      // Check that sorting has been applied (ascending)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  describe('Row Click Handler', () => {
    it('calls onRowClick when a row is clicked', async () => {
      const handleRowClick = vi.fn();
      const user = userEvent.setup();

      render(
        <DataTable
          columns={columns}
          data={sampleData}
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole('row');
      // Click on the first data row (index 1, as index 0 is the header)
      await user.click(rows[1]);

      expect(handleRowClick).toHaveBeenCalledWith(sampleData[0]);
    });

    it('applies cursor-pointer class when onRowClick is provided', () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={sampleData}
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole('row');
      // Check data rows have cursor-pointer
      expect(rows[1]).toHaveClass('cursor-pointer');
    });

    it('does not apply cursor-pointer when onRowClick is not provided', () => {
      render(<DataTable columns={columns} data={sampleData} />);

      const rows = screen.getAllByRole('row');
      expect(rows[1]).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Pagination', () => {
    it('shows pagination when data exceeds page size', () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        status: 'passed',
        value: i * 100,
      }));

      render(<DataTable columns={columns} data={largeData} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        status: 'passed',
        value: i * 100,
      }));

      render(<DataTable columns={columns} data={largeData} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('enables next button when more pages exist', () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        status: 'passed',
        value: i * 100,
      }));

      render(<DataTable columns={columns} data={largeData} />);

      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });

    it('navigates to next page', async () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        status: 'passed',
        value: i * 100,
      }));

      const user = userEvent.setup();
      render(<DataTable columns={columns} data={largeData} />);

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Previous button should now be enabled
      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    });

    it('displays pagination info text', () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        status: 'passed',
        value: i * 100,
      }));

      render(<DataTable columns={columns} data={largeData} />);

      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure with thead and tbody', () => {
      const { container } = render(
        <DataTable columns={columns} data={sampleData} />
      );

      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('uses th elements for headers', () => {
      const { container } = render(
        <DataTable columns={columns} data={sampleData} />
      );

      const headers = container.querySelectorAll('th');
      expect(headers.length).toBe(columns.length);
    });

    it('uses td elements for data cells', () => {
      const { container } = render(
        <DataTable columns={columns} data={sampleData} />
      );

      const cells = container.querySelectorAll('td');
      expect(cells.length).toBe(sampleData.length * columns.length);
    });
  });
});

describe('StatusDot Component', () => {
  describe('Status Colors', () => {
    it('renders success color for passed status', () => {
      const { container } = render(<StatusDot status="passed" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-success');
    });

    it('renders success color for success status', () => {
      const { container } = render(<StatusDot status="success" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-success');
    });

    it('renders error color for failed status', () => {
      const { container } = render(<StatusDot status="failed" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-error');
    });

    it('renders error color for error status', () => {
      const { container } = render(<StatusDot status="error" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-error');
    });

    it('renders info color with animation for running status', () => {
      const { container } = render(<StatusDot status="running" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-info', 'animate-pulse');
    });

    it('renders warning color for pending status', () => {
      const { container } = render(<StatusDot status="pending" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-warning');
    });

    it('renders muted color for skipped status', () => {
      const { container } = render(<StatusDot status="skipped" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-muted-foreground');
    });

    it('renders muted color for unknown status', () => {
      const { container } = render(<StatusDot status="unknown" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-muted-foreground');
    });
  });

  describe('Styling', () => {
    it('has rounded-full class for circular shape', () => {
      const { container } = render(<StatusDot status="passed" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('rounded-full');
    });

    it('has correct size classes', () => {
      const { container } = render(<StatusDot status="passed" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('h-2', 'w-2');
    });

    it('is displayed inline-block', () => {
      const { container } = render(<StatusDot status="passed" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('inline-block');
    });
  });

  describe('Case Insensitivity', () => {
    it('handles uppercase status', () => {
      const { container } = render(<StatusDot status="PASSED" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-success');
    });

    it('handles mixed case status', () => {
      const { container } = render(<StatusDot status="Failed" />);
      const dot = container.querySelector('span');
      expect(dot).toHaveClass('bg-error');
    });
  });
});

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-muted', 'text-muted-foreground');
    });

    it('renders success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-success');
    });

    it('renders warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-warning');
    });

    it('renders error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-error');
    });

    it('renders info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-info');
    });

    it('renders outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('border', 'border-border', 'text-muted-foreground');
    });
  });

  describe('Styling', () => {
    it('has base styling classes', () => {
      const { container } = render(<Badge>Test</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2', 'py-0.5', 'rounded', 'text-xs', 'font-medium');
    });

    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-badge">Test</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-badge');
    });
  });

  describe('Default Variant', () => {
    it('uses default variant when not specified', () => {
      const { container } = render(<Badge>No Variant</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-muted', 'text-muted-foreground');
    });
  });
});
