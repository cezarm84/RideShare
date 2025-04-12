import { useState } from 'react';
import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { extractFormErrors, FormError, getFieldError, getGeneralError } from '@/lib/form-error-handler';

interface UseFormHandlerProps<T extends z.ZodType<any, any>> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseFormHandlerResult<T extends z.ZodType<any, any>> {
  form: UseFormReturn<z.infer<T>>;
  isLoading: boolean;
  errors: FormError[];
  success: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  setErrors: (errors: FormError[]) => void;
  setSuccess: (success: string | null) => void;
  getFieldError: (fieldName: string) => string | undefined;
  getGeneralError: () => string | undefined;
}

export function useFormHandler<T extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
}: UseFormHandlerProps<T>): UseFormHandlerResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const formOptions: UseFormProps<z.infer<T>> = {
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
  };

  const form = useForm<z.infer<T>>(formOptions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(null);
    setIsLoading(true);

    try {
      await form.handleSubmit(onSubmit)();
      setSuccess('Form submitted successfully');
      if (onSuccess) onSuccess();
    } catch (err) {
      const formErrors = extractFormErrors(err);
      setErrors(formErrors);
      if (onError && err instanceof Error) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset(defaultValues as z.infer<T>);
    setErrors([]);
    setSuccess(null);
  };

  return {
    form,
    isLoading,
    errors,
    success,
    handleSubmit,
    resetForm,
    setErrors,
    setSuccess,
    getFieldError: (fieldName: string) => getFieldError(errors, fieldName),
    getGeneralError: () => getGeneralError(errors),
  };
}
