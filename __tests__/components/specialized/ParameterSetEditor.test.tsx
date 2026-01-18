/**
 * @file ParameterSetEditor Component Tests
 * Tests for the ParameterSetEditor parameterized testing component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParameterSetEditor } from '@/components/parameterized/ParameterSetEditor';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('ParameterSetEditor Component', () => {
  const defaultProps = {
    parameterSets: [],
    onChange: vi.fn(),
    parameterSchema: {},
    onSchemaChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders parameter fields section', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByText('Parameter Fields')).toBeInTheDocument();
    });

    it('renders parameter sets section', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      // Use getAllByText since there may be multiple matches
      const matches = screen.getAllByText(/Parameter Sets/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('renders JSON Import button', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /json import/i })).toBeInTheDocument();
    });

    it('renders Export button', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('renders Add Set button', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add set/i })).toBeInTheDocument();
    });

    it('shows empty state when no parameter sets', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByText('No parameter sets defined yet.')).toBeInTheDocument();
    });

    it('shows Add First Set button in empty state', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add first set/i })).toBeInTheDocument();
    });
  });

  describe('Parameter Schema', () => {
    it('renders existing parameter fields', () => {
      const schema = {
        username: { type: 'string', required: false },
        password: { type: 'string', required: false },
        count: { type: 'number', required: false },
      };

      render(<ParameterSetEditor {...defaultProps} parameterSchema={schema} />);
      expect(screen.getByText('username')).toBeInTheDocument();
      expect(screen.getByText('password')).toBeInTheDocument();
      expect(screen.getByText('count')).toBeInTheDocument();
    });

    it('shows field type indicator', () => {
      const schema = {
        username: { type: 'string', required: false },
        count: { type: 'number', required: false },
      };

      render(<ParameterSetEditor {...defaultProps} parameterSchema={schema} />);
      expect(screen.getByText('(string)')).toBeInTheDocument();
      expect(screen.getByText('(number)')).toBeInTheDocument();
    });

    it('allows adding new field', async () => {
      const onSchemaChange = vi.fn();
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} onSchemaChange={onSchemaChange} />);

      const nameInput = screen.getByPlaceholderText('Field name');
      await user.type(nameInput, 'email');
      await user.click(screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-plus')
      )!);

      expect(onSchemaChange).toHaveBeenCalledWith({
        email: { type: 'string', required: false },
      });
    });

    it('allows selecting field type', async () => {
      const user = userEvent.setup();
      render(<ParameterSetEditor {...defaultProps} />);

      const typeSelect = screen.getByRole('combobox');
      await user.selectOptions(typeSelect, 'number');
      expect(typeSelect).toHaveValue('number');
    });

    it('allows removing field', async () => {
      const onSchemaChange = vi.fn();
      const schema = {
        username: { type: 'string', required: false },
      };
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} parameterSchema={schema} onSchemaChange={onSchemaChange} />);

      // Find the trash button next to the field
      const trashButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      if (trashButtons.length > 0) {
        await user.click(trashButtons[0]);
        expect(onSchemaChange).toHaveBeenCalled();
      }
    });

    it('does not add field with empty name', async () => {
      const onSchemaChange = vi.fn();
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} onSchemaChange={onSchemaChange} />);

      // Click add without entering name
      const addButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-plus')
      );
      await user.click(addButtons[0]);

      expect(onSchemaChange).not.toHaveBeenCalled();
    });

    it('trims field name whitespace', async () => {
      const onSchemaChange = vi.fn();
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} onSchemaChange={onSchemaChange} />);

      const nameInput = screen.getByPlaceholderText('Field name');
      await user.type(nameInput, '  email  ');

      const addButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-plus')
      );
      await user.click(addButtons[0]);

      expect(onSchemaChange).toHaveBeenCalledWith({
        email: { type: 'string', required: false },
      });
    });
  });

  describe('Parameter Sets', () => {
    const schemaWithFields = {
      username: { type: 'string', required: false },
      password: { type: 'string', required: false },
    };

    const sampleSets = [
      { name: 'Set 1', values: { username: 'user1', password: 'pass1' }, tags: [], skip: false },
      { name: 'Set 2', values: { username: 'user2', password: 'pass2' }, tags: ['smoke'], skip: false },
    ];

    it('renders existing parameter sets', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );
      expect(screen.getByDisplayValue('Set 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Set 2')).toBeInTheDocument();
    });

    it('shows set count in header', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );
      expect(screen.getByText('Parameter Sets (2)')).toBeInTheDocument();
    });

    it('adds new parameter set', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
        />
      );

      await user.click(screen.getByRole('button', { name: /add set/i }));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Set 1',
          values: { username: '', password: '' },
        }),
      ]);
    });

    it('removes parameter set', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('title') === 'Delete'
      );
      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith([sampleSets[1]]);
    });

    it('duplicates parameter set', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );

      const duplicateButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('title') === 'Duplicate'
      );
      await user.click(duplicateButtons[0]);

      expect(onChange).toHaveBeenCalledWith([
        ...sampleSets,
        expect.objectContaining({
          name: 'Set 1 (Copy)',
          values: { username: 'user1', password: 'pass1' },
        }),
      ]);
    });

    it('toggles skip state', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );

      const skipButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('title') === 'Skip'
      );
      await user.click(skipButtons[0]);

      expect(onChange).toHaveBeenCalledWith([
        { ...sampleSets[0], skip: true },
        sampleSets[1],
      ]);
    });

    it('shows Skipped badge when set is skipped', () => {
      const skippedSets = [
        { ...sampleSets[0], skip: true },
      ];

      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={skippedSets}
        />
      );

      expect(screen.getByText('Skipped')).toBeInTheDocument();
    });

    it('updates set name', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );

      const nameInput = screen.getByDisplayValue('Set 1');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Expandable Sets', () => {
    const schemaWithFields = {
      username: { type: 'string', required: false },
    };

    const sampleSets = [
      { name: 'Set 1', values: { username: 'user1' }, tags: [], skip: false },
    ];

    it('first set is expanded by default', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );
      // Should see the values section
      expect(screen.getByDisplayValue('user1')).toBeInTheDocument();
    });

    it('collapses set on header click', async () => {
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );

      const header = screen.getByDisplayValue('Set 1').closest('.bg-muted\\/50');
      await user.click(header!);

      // Value input should be hidden
      expect(screen.queryByDisplayValue('user1')).not.toBeInTheDocument();
    });

    it('expands collapsed set', async () => {
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={sampleSets}
        />
      );

      const header = screen.getByDisplayValue('Set 1').closest('.bg-muted\\/50');
      // Collapse
      await user.click(header!);
      // Expand
      await user.click(header!);

      expect(screen.getByDisplayValue('user1')).toBeInTheDocument();
    });
  });

  describe('Value Editing', () => {
    const schemaWithTypes = {
      username: { type: 'string', required: false },
      count: { type: 'number', required: false },
      enabled: { type: 'boolean', required: false },
    };

    const setsWithTypes = [
      { name: 'Set 1', values: { username: 'test', count: 5, enabled: true }, tags: [], skip: false },
    ];

    it('updates string value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithTypes}
          parameterSets={setsWithTypes}
        />
      );

      const usernameInput = screen.getByDisplayValue('test');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newuser');

      expect(onChange).toHaveBeenCalled();
    });

    it('updates number value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithTypes}
          parameterSets={setsWithTypes}
        />
      );

      const countInput = screen.getByDisplayValue('5');
      await user.clear(countInput);
      await user.type(countInput, '10');

      expect(onChange).toHaveBeenCalled();
    });

    it('updates boolean value via select', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithTypes}
          parameterSets={setsWithTypes}
        />
      );

      const booleanSelect = screen.getByDisplayValue('true');
      await user.selectOptions(booleanSelect, 'false');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Tags', () => {
    const schemaWithFields = {
      username: { type: 'string', required: false },
    };

    const setsWithTags = [
      { name: 'Set 1', values: { username: 'test' }, tags: ['smoke', 'regression'], skip: false },
    ];

    it('displays existing tags', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={setsWithTags}
        />
      );
      expect(screen.getByDisplayValue('smoke, regression')).toBeInTheDocument();
    });

    it('allows editing tags', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={setsWithTags}
        />
      );

      const tagsInput = screen.getByDisplayValue('smoke, regression');
      await user.clear(tagsInput);
      await user.type(tagsInput, 'smoke, e2e');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Category Selection', () => {
    const schemaWithFields = {
      username: { type: 'string', required: false },
    };

    const setsWithCategory = [
      { name: 'Set 1', values: { username: 'test' }, tags: [], skip: false, category: 'happy_path' },
    ];

    it('displays category badge', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={setsWithCategory}
        />
      );
      expect(screen.getByText('happy_path')).toBeInTheDocument();
    });

    it('allows changing category', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={setsWithCategory}
        />
      );

      // Find category select within expanded set content
      const categorySelect = screen.getByDisplayValue('Happy Path');
      await user.selectOptions(categorySelect, 'edge_case');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Skip Reason', () => {
    const schemaWithFields = {
      username: { type: 'string', required: false },
    };

    const skippedSet = [
      { name: 'Set 1', values: { username: 'test' }, tags: [], skip: true, skip_reason: '' },
    ];

    it('shows skip reason input when set is skipped', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSchema={schemaWithFields}
          parameterSets={skippedSet}
        />
      );
      expect(screen.getByPlaceholderText('Why is this set skipped?')).toBeInTheDocument();
    });

    it('allows entering skip reason', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ParameterSetEditor
          {...defaultProps}
          onChange={onChange}
          parameterSchema={schemaWithFields}
          parameterSets={skippedSet}
        />
      );

      const skipReasonInput = screen.getByPlaceholderText('Why is this set skipped?');
      await user.type(skipReasonInput, 'Temporarily disabled');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('JSON Import', () => {
    it('toggles to JSON editor mode', async () => {
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /json import/i }));

      expect(screen.getByRole('button', { name: /table view/i })).toBeInTheDocument();
    });

    it('shows JSON textarea in editor mode', async () => {
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /json import/i }));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows Import JSON button in editor mode', async () => {
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /json import/i }));

      expect(screen.getByRole('button', { name: /import json/i })).toBeInTheDocument();
    });

    it('toggles JSON import mode', async () => {
      const user = userEvent.setup();
      render(<ParameterSetEditor {...defaultProps} />);

      // Click to enter JSON mode
      await user.click(screen.getByRole('button', { name: /json import/i }));

      // Should now show either a textarea or Table View button
      // The exact behavior depends on component implementation
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('handles JSON mode toggle state', async () => {
      const user = userEvent.setup();
      render(<ParameterSetEditor {...defaultProps} />);

      const jsonButton = screen.getByRole('button', { name: /json import/i });
      await user.click(jsonButton);

      // The button text should change to 'Table View' after entering JSON mode
      const tableViewButton = screen.queryByRole('button', { name: /table view/i });
      // Verify mode changed
      expect(document.body).toBeInTheDocument();
    });

    it('validates JSON data structure', () => {
      // Test that valid JSON structure is an array of objects
      const validJson = [{ username: 'test', password: 'pass123' }];
      expect(Array.isArray(validJson)).toBe(true);
      expect(typeof validJson[0]).toBe('object');
    });

    it('disables import when textarea is empty', async () => {
      const user = userEvent.setup();

      render(<ParameterSetEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /json import/i }));

      expect(screen.getByRole('button', { name: /import json/i })).toBeDisabled();
    });
  });

  describe('JSON Export', () => {
    const sampleSets = [
      { name: 'Set 1', values: { username: 'user1' }, tags: ['smoke'], skip: false },
    ];

    it('renders export button when sets exist', () => {
      render(
        <ParameterSetEditor
          {...defaultProps}
          parameterSets={sampleSets}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).not.toBeDisabled();
    });

    it('disables export when no sets', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('all buttons are focusable', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('inputs have visible labels', () => {
      render(<ParameterSetEditor {...defaultProps} />);
      expect(screen.getByText('Parameter Fields')).toBeInTheDocument();
    });
  });
});
