import { useToast as useContextToast } from '../context/ToastContext';

interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const { showToast } = useContextToast();

  const toast = (options: ToastOptions) => {
    // Map the variant to ToastType
    const type = options.variant === 'destructive' ? 'error' : 'success';

    // Use the description as the message
    showToast(options.description, type);
  };

  return { toast };
}
