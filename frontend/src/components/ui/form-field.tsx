import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type FormFieldType = 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormFieldProps {
  id: string;
  label: string;
  type?: FormFieldType;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options?: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  register?: any; // React Hook Form register function
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  autoComplete?: string;
  'aria-label'?: string;
}

const FormField = ({
  id,
  label,
  type = 'text',
  placeholder,
  error,
  required = false,
  disabled = false,
  className,
  options,
  value,
  onChange,
  onBlur,
  register,
  name,
  min,
  max,
  step,
  rows = 3,
  autoComplete,
  'aria-label': ariaLabel,
}: FormFieldProps) => {
  const inputId = id || name;
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          id={inputId}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('w-full', error && 'border-red-500', className)}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...(register && name ? register(name) : {})}
          {...(onChange ? { onChange: (e) => onChange(e.target.value) } : {})}
          {...(onBlur ? { onBlur } : {})}
          {...(value !== undefined ? { value } : {})}
          {...(autoComplete ? { autoComplete } : {})}
          {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
        />
      );
    }

    if (type === 'select' && options) {
      return (
        <Select
          value={value as string}
          onValueChange={onChange as (value: string) => void}
          disabled={disabled}
        >
          <SelectTrigger
            id={inputId}
            className={cn('w-full', error && 'border-red-500', className)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('w-full', error && 'border-red-500', className)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...(register && name ? register(name) : {})}
        {...(onChange ? { onChange: (e) => onChange(e.target.value) } : {})}
        {...(onBlur ? { onBlur } : {})}
        {...(value !== undefined ? { value } : {})}
        {...(min !== undefined ? { min } : {})}
        {...(max !== undefined ? { max } : {})}
        {...(step !== undefined ? { step } : {})}
        {...(autoComplete ? { autoComplete } : {})}
        {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      />
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} id={labelId} className={cn(disabled && 'text-gray-400')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
