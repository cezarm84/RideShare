import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../SidebarContext';

// Test component that uses the SidebarContext
const TestComponent = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    activeItem,
    openSubmenu,
    toggleSidebar,
    toggleMobileSidebar,
    setIsHovered,
    setActiveItem,
    toggleSubmenu,
  } = useSidebar();

  return (
    <div>
      <div data-testid="isExpanded">{isExpanded.toString()}</div>
      <div data-testid="isMobileOpen">{isMobileOpen.toString()}</div>
      <div data-testid="isHovered">{isHovered.toString()}</div>
      <div data-testid="activeItem">{activeItem || 'none'}</div>
      <div data-testid="openSubmenu">{openSubmenu || 'none'}</div>
      <button onClick={toggleSidebar}>Toggle Sidebar</button>
      <button onClick={toggleMobileSidebar}>Toggle Mobile Sidebar</button>
      <button onClick={() => setIsHovered(true)}>Set Hovered</button>
      <button onClick={() => setActiveItem('dashboard')}>Set Active Item</button>
      <button onClick={() => toggleSubmenu('settings')}>Toggle Submenu</button>
    </div>
  );
};

describe('SidebarContext', () => {
  beforeEach(() => {
    // Reset window size to desktop
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  it('should initialize with default values', () => {
    // Act
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Assert
    expect(screen.getByTestId('isExpanded').textContent).toBe('true');
    expect(screen.getByTestId('isMobileOpen').textContent).toBe('false');
    expect(screen.getByTestId('isHovered').textContent).toBe('false');
    expect(screen.getByTestId('activeItem').textContent).toBe('none');
    expect(screen.getByTestId('openSubmenu').textContent).toBe('none');
  });

  it('should toggle sidebar expansion', () => {
    // Arrange
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Act - toggle sidebar
    fireEvent.click(screen.getByText('Toggle Sidebar'));

    // Assert
    expect(screen.getByTestId('isExpanded').textContent).toBe('false');

    // Act - toggle again
    fireEvent.click(screen.getByText('Toggle Sidebar'));

    // Assert
    expect(screen.getByTestId('isExpanded').textContent).toBe('true');
  });

  it('should toggle mobile sidebar', () => {
    // Arrange
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Act - toggle mobile sidebar
    fireEvent.click(screen.getByText('Toggle Mobile Sidebar'));

    // Assert
    expect(screen.getByTestId('isMobileOpen').textContent).toBe('true');

    // Act - toggle again
    fireEvent.click(screen.getByText('Toggle Mobile Sidebar'));

    // Assert
    expect(screen.getByTestId('isMobileOpen').textContent).toBe('false');
  });

  it('should set hover state', () => {
    // Arrange
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Act
    fireEvent.click(screen.getByText('Set Hovered'));

    // Assert
    expect(screen.getByTestId('isHovered').textContent).toBe('true');
  });

  it('should set active item', () => {
    // Arrange
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Act
    fireEvent.click(screen.getByText('Set Active Item'));

    // Assert
    expect(screen.getByTestId('activeItem').textContent).toBe('dashboard');
  });

  it('should toggle submenu', () => {
    // Arrange
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Act - open submenu
    fireEvent.click(screen.getByText('Toggle Submenu'));

    // Assert
    expect(screen.getByTestId('openSubmenu').textContent).toBe('settings');

    // Act - close submenu
    fireEvent.click(screen.getByText('Toggle Submenu'));

    // Assert
    expect(screen.getByTestId('openSubmenu').textContent).toBe('none');
  });

  it('should handle mobile view', () => {
    // Arrange - set window size to mobile
    global.innerWidth = 600;

    // Act
    act(() => {
      global.dispatchEvent(new Event('resize'));
    });

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // Assert - in mobile view, isExpanded should be false regardless of state
    expect(screen.getByTestId('isExpanded').textContent).toBe('false');
  });
});
