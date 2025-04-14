/**
 * FAQCategory Component
 * 
 * Displays a category of FAQs with a title and a list of FAQ accordions.
 */

import React from 'react';
import { FAQCategory as FAQCategoryType } from '../../services/FAQService';
import FAQAccordion from './FAQAccordion';

interface FAQCategoryProps {
  /**
   * The FAQ category to display
   */
  category: FAQCategoryType;
  
  /**
   * Optional CSS class name for additional styling
   */
  className?: string;
}

/**
 * FAQCategory component displays a category of FAQs with a title and description
 */
const FAQCategory: React.FC<FAQCategoryProps> = ({ category, className = '' }) => {
  // If there are no FAQs in this category, don't render anything
  if (!category.faqs || category.faqs.length === 0) {
    return null;
  }
  
  return (
    <div className={`mb-8 ${className}`} data-testid="faq-category">
      {/* Category Header */}
      <div className="mb-4">
        <div className="flex items-center">
          {/* Display category icon if available */}
          {category.icon && (
            <div className="mr-3 text-xl text-brand-600 dark:text-brand-400">
              {category.icon}
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {category.name}
          </h2>
        </div>
        
        {/* Display category description if available */}
        {category.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {category.description}
          </p>
        )}
      </div>
      
      {/* List of FAQs in this category */}
      <div className="space-y-4">
        {category.faqs.map((faq) => (
          <FAQAccordion key={faq.id} faq={faq} />
        ))}
      </div>
    </div>
  );
};

export default FAQCategory;
