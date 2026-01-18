/**
 * @file Textarea Component Tests
 * Tests for the Textarea UI component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea Component', () => {
  describe('Rendering', () => {
    it('renders a textarea element', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default styling', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('flex', 'min-h-[80px]', 'w-full', 'rounded-md', 'border');
    });

    it('applies custom className', () => {
      render(<Textarea className="custom-textarea" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-textarea');
    });

    it('renders with placeholder text', () => {
      render(<Textarea placeholder="Enter description..." />);
      expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<Textarea defaultValue="Initial content" />);
      expect(screen.getByDisplayValue('Initial content')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles text input', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Hello World');
      expect(textarea).toHaveValue('Hello World');
    });

    it('handles multiline text input', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3');
      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });

    it('calls onChange handler when typing', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Textarea onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when textarea receives focus', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      render(<Textarea onFocus={handleFocus} />);

      await user.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when textarea loses focus', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      render(
        <>
          <Textarea onBlur={handleBlur} />
          <button>Other element</button>
        </>
      );

      await user.click(screen.getByRole('textbox'));
      await user.click(screen.getByRole('button'));
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('supports controlled input', async () => {
      const ControlledTextarea = () => {
        const [value, setValue] = React.useState('');
        return <Textarea value={value} onChange={(e) => setValue(e.target.value)} />;
      };

      const user = userEvent.setup();
      render(<ControlledTextarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Controlled text');
      expect(textarea).toHaveValue('Controlled text');
    });
  });

  describe('Disabled State', () => {
    it('renders in disabled state', () => {
      render(<Textarea disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('does not respond to user input when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Textarea disabled onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Rows Configuration', () => {
    it('renders with custom rows attribute', () => {
      render(<Textarea rows={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    it('renders with cols attribute', () => {
      render(<Textarea cols={40} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('cols', '40');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('allows focusing via ref', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });

    it('allows setting value via ref', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      if (ref.current) {
        ref.current.value = 'Set via ref';
      }
      expect(screen.getByRole('textbox')).toHaveValue('Set via ref');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Textarea aria-label="Description field" />);
      expect(screen.getByLabelText('Description field')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Textarea aria-describedby="help-text" />
          <span id="help-text">Provide additional details</span>
        </>
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('supports aria-invalid for error state', () => {
      render(<Textarea aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports required attribute', () => {
      render(<Textarea required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('has focus-visible styles for keyboard navigation', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('HTML Attributes', () => {
    it('passes through id attribute', () => {
      render(<Textarea id="my-textarea" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-textarea');
    });

    it('passes through name attribute', () => {
      render(<Textarea name="description" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
    });

    it('passes through maxLength attribute', () => {
      render(<Textarea maxLength={500} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500');
    });

    it('passes through readOnly attribute', () => {
      render(<Textarea readOnly value="Read only content" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readOnly');
    });

    it('passes through wrap attribute', () => {
      render(<Textarea wrap="hard" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('wrap', 'hard');
    });
  });

  describe('Placeholder Styling', () => {
    it('applies placeholder styling class', () => {
      render(<Textarea placeholder="Enter text..." />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('placeholder:text-muted-foreground');
    });
  });
});
