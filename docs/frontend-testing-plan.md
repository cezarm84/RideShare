# Frontend Testing Strategy

## Test Structure

```
src/
└── __tests__/
    ├── components/           # Component tests
    │   ├── ui/               # UI component tests
    │   └── forms/            # Form component tests
    ├── hooks/                # Custom hook tests
    ├── pages/                # Page component tests
    ├── services/             # API service tests
    ├── utils/                # Utility function tests
    └── e2e/                  # End-to-end tests
```

## Test Types

1. **Unit Tests**:
   - Test individual components in isolation
   - Test custom hooks
   - Test utility functions
   - Use Jest and React Testing Library

2. **Integration Tests**:
   - Test component interactions
   - Test form submissions
   - Test context providers with consumers

3. **End-to-End Tests**:
   - Test complete user flows
   - Use Cypress for browser-based testing
   - Verify application behavior from user perspective

## Testing Components

For each component, test:
1. **Rendering**: Does it render correctly with different props?
2. **User Interactions**: Does it respond correctly to user events?
3. **State Changes**: Does it update state correctly?
4. **Error States**: Does it handle errors gracefully?

## Example Component Test

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RideCard } from '../components/RideCard';

describe('RideCard', () => {
  const mockRide = {
    id: '1',
    origin: 'Stockholm',
    destination: 'Gothenburg',
    departureTime: '2023-06-01T10:00:00',
    availableSeats: 3,
    price: 250,
  };

  const mockOnBook = jest.fn();

  it('renders ride details correctly', () => {
    render(<RideCard ride={mockRide} onBook={mockOnBook} />);

    expect(screen.getByText('Stockholm')).toBeInTheDocument();
    expect(screen.getByText('Gothenburg')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('3 seats available')).toBeInTheDocument();
    expect(screen.getByText('250 kr')).toBeInTheDocument();
  });

  it('calls onBook when book button is clicked', () => {
    render(<RideCard ride={mockRide} onBook={mockOnBook} />);

    const bookButton = screen.getByRole('button', { name: /book/i });
    fireEvent.click(bookButton);

    expect(mockOnBook).toHaveBeenCalledWith('1');
  });
});
```

## End-to-End Testing with Cypress

```javascript
describe('Booking Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password');
  });

  it('allows a user to search and book a ride', () => {
    // Visit the search page
    cy.visit('/rides');

    // Fill in search criteria
    cy.get('[data-testid=origin-input]').type('Stockholm');
    cy.get('[data-testid=destination-input]').type('Gothenburg');
    cy.get('[data-testid=date-input]').type('2023-06-01');

    // Submit search
    cy.get('[data-testid=search-button]').click();

    // Verify results appear
    cy.get('[data-testid=ride-card]').should('have.length.at.least', 1);

    // Select first ride
    cy.get('[data-testid=book-button]').first().click();

    // Complete booking form
    cy.get('[data-testid=passengers-input]').type('2');
    cy.get('[data-testid=confirm-button]').click();

    // Verify booking confirmation
    cy.get('[data-testid=booking-confirmation]').should('be.visible');
    cy.get('[data-testid=booking-reference]').should('be.visible');
  });
});
```
