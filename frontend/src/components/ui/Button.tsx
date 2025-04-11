import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-blue-500 text-white hover:bg-blue-600 shadow-uber hover:shadow-uber-hover hover:-translate-y-0.5",
        primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-uber hover:shadow-uber-hover hover:-translate-y-0.5",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-uber hover:shadow-uber-hover hover:-translate-y-0.5",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-500 underline-offset-4 hover:underline",
        uber: "bg-black text-white hover:bg-gray-800 shadow-uber hover:shadow-uber-hover hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base font-semibold",
        xl: "h-12 rounded-md px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        lg: "rounded-lg",
        xl: "rounded-xl",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, isLoading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, rounded }), className)}
        ref={ref}
        tabIndex={0}
        disabled={isLoading || props.disabled}
        aria-label={props['aria-label'] || props.title || "Button"}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{typeof children === 'string' ? children : 'Loading...'}</span>
          </div>
        ) : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
