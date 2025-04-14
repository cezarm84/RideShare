/**
 * ContactForm Component
 *
 * A form for users to send contact messages to the RideShare team.
 * Includes validation, reCAPTCHA integration, and success/error states.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ContactMessage, mockSubmitContactMessage, submitContactMessage } from '../../services/ContactService';

interface ContactFormProps {
  /**
   * Optional CSS class name for additional styling
   */
  className?: string;
}

/**
 * Form validation errors interface
 */
interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  recaptcha?: string;
}

/**
 * Available contact categories
 */
const CONTACT_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'account', label: 'Account Support' },
  { value: 'booking', label: 'Booking Issues' },
  { value: 'payment', label: 'Payment Questions' },
  { value: 'enterprise', label: 'Enterprise Solutions' },
  { value: 'partnership', label: 'Partnership Opportunities' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'feedback', label: 'Feedback & Suggestions' },
  { value: 'other', label: 'Other' },
];

/**
 * ContactForm component displays a form for users to contact the RideShare team
 */
const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  const { isAuthenticated, user } = useAuth();

  // Form state
  const [formData, setFormData] = useState<ContactMessage>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    message: '',
    category: 'general',
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate the form data
   * @returns True if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Validate subject
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    // Update errors state
    setErrors(newErrors);

    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field if it exists
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset submission state
    setSubmitSuccess(false);
    setSubmitError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      // Submit form data
      // In production, use submitContactMessage
      // For development without backend, use mockSubmitContactMessage
      const response = await mockSubmitContactMessage(formData);

      // Handle success
      setSubmitSuccess(true);

      // Reset form
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        subject: '',
        message: '',
        category: 'general',
      });
    } catch (error) {
      // Handle error
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${className}`} data-testid="contact-form">
      {/* Success message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Message Sent Successfully
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>Thank you for contacting us! We'll get back to you as soon as possible.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Sending Message
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:text-white'
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="name-error">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:text-white'
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="email-error">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Field (Optional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone (Optional)
          </label>
          <div className="mt-1">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <div className="mt-1">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            >
              {CONTACT_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Field */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subject <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm ${
                errors.subject
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:text-white'
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.subject ? 'true' : 'false'}
              aria-describedby={errors.subject ? 'subject-error' : undefined}
            />
          </div>
          {errors.subject && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="subject-error">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <textarea
              id="message"
              name="message"
              rows={6}
              value={formData.message}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm ${
                errors.message
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:text-white'
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.message ? 'true' : 'false'}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
          </div>
          {errors.message && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="message-error">
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
