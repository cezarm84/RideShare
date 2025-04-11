import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: 'default' | 'uber' | 'outline' | 'flat';
  rounded?: 'default' | 'lg' | 'xl' | '2xl' | 'none';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, variant = 'default', rounded = 'lg', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white",
          rounded === 'default' && "rounded-md",
          rounded === 'lg' && "rounded-lg",
          rounded === 'xl' && "rounded-xl",
          rounded === '2xl' && "rounded-2xl",
          variant === 'default' && "border border-gray-200 shadow-card",
          variant === 'uber' && "border-0 shadow-uber",
          variant === 'outline' && "border border-gray-200",
          variant === 'flat' && "bg-gray-50 border-0",
          hover && "transition-all duration-200 hover:-translate-y-1",
          hover && variant === 'default' && "hover:shadow-card-hover",
          hover && variant === 'uber' && "hover:shadow-uber-hover",
          hover && variant === 'outline' && "hover:border-gray-300 hover:shadow-sm",
          hover && variant === 'flat' && "hover:bg-gray-100",
          "animate-fade-in",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 mt-1", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end p-6 pt-0 border-t border-gray-100 mt-6", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
