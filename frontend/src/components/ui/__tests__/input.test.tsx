import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('data-slot', 'input');
    expect(input).not.toBeDisabled();
    expect(input.tagName).toBe('INPUT');
  });

  it('renders with the correct type', () => {
    render(
      <>
        <Input type="text" placeholder="Text input" />
        <Input type="password" placeholder="Password input" />
        <Input type="email" placeholder="Email input" />
        <Input type="number" placeholder="Number input" />
        <Input type="date" placeholder="Date input" />
      </>
    );

    expect(screen.getByPlaceholderText('Text input')).toHaveAttribute('type', 'text');
    expect(screen.getByPlaceholderText('Password input')).toHaveAttribute('type', 'password');
    expect(screen.getByPlaceholderText('Email input')).toHaveAttribute('type', 'email');
    expect(screen.getByPlaceholderText('Number input')).toHaveAttribute('type', 'number');
    expect(screen.getByPlaceholderText('Date input')).toHaveAttribute('type', 'date');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Custom class input" />);

    const input = screen.getByPlaceholderText('Custom class input');
    expect(input.className).toContain('custom-class');
  });

  it('handles disabled state correctly', () => {
    render(<Input disabled placeholder="Disabled input" />);

    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);

    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello, world!');

    expect(input).toHaveValue('Hello, world!');
  });

  it('handles change events', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<Input placeholder="Change event" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Change event');
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles focus and blur events', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    const user = userEvent.setup();

    render(
      <Input
        placeholder="Focus and blur"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );

    const input = screen.getByPlaceholderText('Focus and blur');

    // Focus the input
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    // Blur the input by clicking elsewhere
    await user.click(document.body);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards additional props to the input element', () => {
    render(
      <Input
        placeholder="Additional props"
        id="test-input"
        name="test-name"
        maxLength={10}
        required
        aria-label="Test input"
        data-testid="test-input"
      />
    );

    const input = screen.getByPlaceholderText('Additional props');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'test-name');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-label', 'Test input');
    expect(input).toHaveAttribute('data-testid', 'test-input');
  });

  it('handles invalid state with aria-invalid attribute', () => {
    render(
      <Input
        placeholder="Invalid input"
        aria-invalid={true}
      />
    );

    const input = screen.getByPlaceholderText('Invalid input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('handles readonly state correctly', () => {
    render(<Input readOnly value="Read only value" />);

    const input = screen.getByDisplayValue('Read only value');
    expect(input).toHaveAttribute('readOnly');
  });
});
