import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FormError } from '@/lib/form-error-handler';

export interface BaseFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  errors?: FormError[];
  success?: string | null;
  footer?: ReactNode;
}

const BaseForm = ({
  children,
  onSubmit,
  onCancel,
  title,
  description,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  isDisabled = false,
  className,
  errors = [],
  success,
  footer,
}: BaseFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const generalError = errors.find(error => !error.field)?.message;

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {generalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
          {generalError}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {children}

        <div className="flex items-center justify-end space-x-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isDisabled}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isDisabled}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>

        {footer && <div className="mt-4">{footer}</div>}
      </form>
    </div>
  );
};

export default BaseForm; 