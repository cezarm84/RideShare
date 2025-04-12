import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button).not.toBeDisabled();
  });

  it('renders correctly when disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('applies the correct variant class', () => {
    render(
      <>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </>
    );
    
    const defaultButton = screen.getByRole('button', { name: /default/i });
    const destructiveButton = screen.getByRole('button', { name: /destructive/i });
    const outlineButton = screen.getByRole('button', { name: /outline/i });
    const secondaryButton = screen.getByRole('button', { name: /secondary/i });
    const ghostButton = screen.getByRole('button', { name: /ghost/i });
    const linkButton = screen.getByRole('button', { name: /link/i });
    
    // Check that each button has the appropriate class
    expect(defaultButton.className).toContain('bg-primary');
    expect(destructiveButton.className).toContain('bg-destructive');
    expect(outlineButton.className).toContain('border');
    expect(secondaryButton.className).toContain('bg-secondary');
    expect(ghostButton.className).toContain('hover:bg-accent');
    expect(linkButton.className).toContain('text-primary');
  });

  it('applies the correct size class', () => {
    render(
      <>
        <Button size="default">Default Size</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">Icon</Button>
      </>
    );
    
    const defaultSizeButton = screen.getByRole('button', { name: /default size/i });
    const smallButton = screen.getByRole('button', { name: /small/i });
    const largeButton = screen.getByRole('button', { name: /large/i });
    const iconButton = screen.getByRole('button', { name: /icon/i });
    
    // Check that each button has the appropriate class
    expect(defaultSizeButton.className).toContain('h-9');
    expect(smallButton.className).toContain('h-8');
    expect(largeButton.className).toContain('h-10');
    expect(iconButton.className).toContain('size-9');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    
    const button = screen.getByRole('button', { name: /custom class/i });
    expect(button.className).toContain('custom-class');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as a custom element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );
    
    const linkButton = screen.getByRole('link', { name: /link button/i });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute('href', 'https://example.com');
    expect(linkButton).toHaveAttribute('data-slot', 'button');
  });

  it('forwards additional props to the button element', () => {
    render(
      <Button 
        type="submit" 
        aria-label="Submit Form"
        data-testid="submit-button"
      >
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Submit Form');
    expect(button).toHaveAttribute('data-testid', 'submit-button');
  });
});
