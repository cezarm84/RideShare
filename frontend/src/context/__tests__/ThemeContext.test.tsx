import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
};

Object.defineProperty(document, 'documentElement', {
  value: documentElementMock,
  writable: true,
});

// Test component that uses the ThemeContext
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should initialize with light theme by default', async () => {
    // Act
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('should initialize with saved theme from localStorage', async () => {
    // Arrange
    localStorageMock.getItem.mockReturnValueOnce('dark');
    
    // Act
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should toggle theme from light to dark', async () => {
    // Arrange
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Act - toggle theme
    fireEvent.click(screen.getByText('Toggle Theme'));
    
    // Assert
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should toggle theme from dark to light', async () => {
    // Arrange
    localStorageMock.getItem.mockReturnValueOnce('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Act - toggle theme
    fireEvent.click(screen.getByText('Toggle Theme'));
    
    // Assert
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
  });
});
