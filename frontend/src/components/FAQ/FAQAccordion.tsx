/**
 * FAQAccordion Component
 *
 * A reusable accordion component for displaying FAQ items.
 * Each FAQ item can be expanded/collapsed to show/hide the answer.
 */

import React, { useState } from 'react';
import { FAQ } from '../../services/FAQService';

interface FAQAccordionProps {
  /**
   * The FAQ item to display
   */
  faq: FAQ;

  /**
   * Optional CSS class name for additional styling
   */
  className?: string;

  /**
   * Whether the accordion should be initially expanded
   * @default false
   */
  initiallyExpanded?: boolean;
}

/**
 * FAQAccordion component displays a single FAQ item in an expandable accordion
 */
const FAQAccordion: React.FC<FAQAccordionProps> = ({
  faq,
  className = '',
  initiallyExpanded = false
}) => {
  // State to track whether the accordion is expanded
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  /**
   * Toggle the expanded state of the accordion
   */
  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden ${className}`}
      data-testid="faq-accordion"
    >
      {/* FAQ Question (Header) */}
      <button
        className="w-full flex justify-between items-center p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
        onClick={toggleAccordion}
        aria-expanded={isExpanded}
        aria-controls={`faq-content-${faq.id}`}
      >
        <h3 className="text-base font-medium text-gray-900 dark:text-white">
          {faq.question}
        </h3>
        <span className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      </button>

      {/* FAQ Answer (Content) */}
      <div
        id={`faq-content-${faq.id}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}
      >
        <div
          className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
          dangerouslySetInnerHTML={{ __html: faq.answer }}
        />
      </div>
    </div>
  );
};

export default FAQAccordion;
