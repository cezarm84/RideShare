import { AxiosError } from 'axios';

export interface FormError {
  message: string;
  field?: string;
}

export function extractFormErrors(error: unknown): FormError[] {
  if (error instanceof AxiosError) {
    // Handle API validation errors
    if (error.response?.status === 422 && error.response.data?.errors) {
      return Object.entries(error.response.data.errors).map(([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages[0] : String(messages),
      }));
    }

    // Handle other API errors
    if (error.response?.data?.message) {
      return [{ message: error.response.data.message }];
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      return [{ message: 'Unable to connect to the server. Please check your internet connection.' }];
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return [{ message: error.message }];
  }

  // Fallback for unknown errors
  return [{ message: 'An unexpected error occurred. Please try again.' }];
}

export function getFieldError(errors: FormError[], fieldName: string): string | undefined {
  return errors.find(error => error.field === fieldName)?.message;
}

export function hasFieldError(errors: FormError[], fieldName: string): boolean {
  return errors.some(error => error.field === fieldName);
}

export function getGeneralError(errors: FormError[]): string | undefined {
  return errors.find(error => !error.field)?.message;
}

export function formatValidationError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
} 