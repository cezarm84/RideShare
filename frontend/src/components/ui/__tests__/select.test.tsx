import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '../select';

describe('Select Component', () => {
  it('renders correctly with default props', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
    expect(trigger).toHaveAttribute('data-size', 'default');
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders with different size', () => {
    render(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Small select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-size', 'sm');
  });

  it('renders with custom className', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger-class">
          <SelectValue placeholder="Custom class" />
        </SelectTrigger>
        <SelectContent className="custom-content-class">
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('custom-trigger-class');
  });

  it('renders with disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('renders with groups and labels', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select with groups" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group 1</SelectLabel>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Group 2</SelectLabel>
            <SelectItem value="option3">Option 3</SelectItem>
            <SelectItem value="option4">Option 4</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('Select with groups')).toBeInTheDocument();
  });

  it('renders with disabled items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select with disabled item" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2" disabled>Option 2 (Disabled)</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    render(
      <Select name="test-select" required>
        <SelectTrigger aria-label="Test select" data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveAttribute('aria-label', 'Test select');
  });
});
