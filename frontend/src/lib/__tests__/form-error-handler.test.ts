import { AxiosError } from 'axios';
import {
  extractFormErrors,
  getFieldError,
  hasFieldError,
  getGeneralError,
  formatValidationError
} from '../form-error-handler';

describe('Form Error Handler', () => {
  describe('extractFormErrors', () => {
    it('handles API validation errors', () => {
      const error = new AxiosError(
        'Request failed with status code 422',
        '422',
        undefined,
        undefined,
        {
          status: 422,
          data: {
            errors: {
              email: ['Email is required', 'Email must be valid'],
              password: 'Password is too short'
            }
          }
        } as any
      );

      const result = extractFormErrors(error);

      expect(result).toEqual([
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is too short' }
      ]);
    });

    it('handles API errors with message', () => {
      const error = new AxiosError(
        'Request failed with status code 400',
        '400',
        undefined,
        undefined,
        {
          status: 400,
          data: {
            message: 'Bad request'
          }
        } as any
      );

      const result = extractFormErrors(error);

      expect(result).toEqual([
        { message: 'Bad request' }
      ]);
    });

    it('handles network errors', () => {
      const error = new AxiosError('Network Error');

      const result = extractFormErrors(error);

      expect(result).toEqual([
        { message: 'Unable to connect to the server. Please check your internet connection.' }
      ]);
    });

    it('handles generic errors', () => {
      const error = new Error('Something went wrong');

      const result = extractFormErrors(error);

      expect(result).toEqual([
        { message: 'Something went wrong' }
      ]);
    });

    it('handles unknown errors', () => {
      const error = 'Unknown error';

      const result = extractFormErrors(error);

      expect(result).toEqual([
        { message: 'An unexpected error occurred. Please try again.' }
      ]);
    });
  });

  describe('getFieldError', () => {
    it('returns the error message for a specific field', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is too short' }
      ];

      const result = getFieldError(errors, 'email');

      expect(result).toBe('Email is required');
    });

    it('returns undefined if the field has no error', () => {
      const errors = [
        { field: 'email', message: 'Email is required' }
      ];

      const result = getFieldError(errors, 'password');

      expect(result).toBeUndefined();
    });
  });

  describe('hasFieldError', () => {
    it('returns true if the field has an error', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is too short' }
      ];

      const result = hasFieldError(errors, 'email');

      expect(result).toBe(true);
    });

    it('returns false if the field has no error', () => {
      const errors = [
        { field: 'email', message: 'Email is required' }
      ];

      const result = hasFieldError(errors, 'password');

      expect(result).toBe(false);
    });
  });

  describe('getGeneralError', () => {
    it('returns the general error message', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { message: 'Something went wrong' }
      ];

      const result = getGeneralError(errors);

      expect(result).toBe('Something went wrong');
    });

    it('returns undefined if there is no general error', () => {
      const errors = [
        { field: 'email', message: 'Email is required' }
      ];

      const result = getGeneralError(errors);

      expect(result).toBeUndefined();
    });
  });

  describe('formatValidationError', () => {
    it('returns the error message for Error instances', () => {
      const error = new Error('Validation failed');

      const result = formatValidationError(error);

      expect(result).toBe('Validation failed');
    });

    it('converts non-Error values to strings', () => {
      const error = 123;

      const result = formatValidationError(error);

      expect(result).toBe('123');
    });
  });
});
