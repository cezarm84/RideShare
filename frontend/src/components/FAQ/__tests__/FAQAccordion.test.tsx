import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQAccordion from '../FAQAccordion';

describe('FAQAccordion', () => {
  const mockFAQ = {
    id: 1,
    question: 'Test Question',
    answer: '<p>Test Answer</p>',
    category_id: 1,
    display_order: 1,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  it('renders the question', () => {
    render(<FAQAccordion faq={mockFAQ} />);
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('expands and collapses when clicked', () => {
    render(<FAQAccordion faq={mockFAQ} />);

    // Initially collapsed
    const content = document.getElementById(`faq-content-${mockFAQ.id}`);
    expect(content).toHaveClass('max-h-0');

    // Click to expand
    fireEvent.click(screen.getByText('Test Question'));
    expect(content).toHaveClass('max-h-96');

    // Click again to collapse
    fireEvent.click(screen.getByText('Test Question'));
    expect(content).toHaveClass('max-h-0');
  });

  it('can be initially expanded', () => {
    render(<FAQAccordion faq={mockFAQ} initiallyExpanded={true} />);

    const content = document.getElementById(`faq-content-${mockFAQ.id}`);
    expect(content).toHaveClass('max-h-96');
  });

  it('renders the answer as HTML', () => {
    render(<FAQAccordion faq={mockFAQ} initiallyExpanded={true} />);

    // Click to expand
    fireEvent.click(screen.getByText('Test Question'));

    // Check that the HTML content is rendered
    const answerContainer = document.querySelector(`#faq-content-${mockFAQ.id} > div`);
    expect(answerContainer?.innerHTML).toContain('<p>Test Answer</p>');
  });
});
