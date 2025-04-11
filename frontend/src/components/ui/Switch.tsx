import React from 'react';
import { cn } from '@/utils/cn';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  color?: 'blue' | 'primary' | 'green' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onChange, label, description, color = 'blue', size = 'md', ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    };

    // Get color class based on the color prop
    const getColorClass = () => {
      switch (color) {
        case 'primary':
          return 'peer-checked:bg-primary-500 peer-focus:ring-primary-300';
        case 'green':
          return 'peer-checked:bg-green-500 peer-focus:ring-green-300';
        case 'red':
          return 'peer-checked:bg-red-500 peer-focus:ring-red-300';
        case 'purple':
          return 'peer-checked:bg-purple-500 peer-focus:ring-purple-300';
        default:
          return 'peer-checked:bg-blue-500 peer-focus:ring-blue-300';
      }
    };

    // Size mapping
    const sizeClasses = {
      sm: {
        switch: 'w-8 h-4',
        thumb: 'after:h-3 after:w-3',
        container: 'h-4',
      },
      md: {
        switch: 'w-11 h-6',
        thumb: 'after:h-5 after:w-5',
        container: 'h-6',
      },
      lg: {
        switch: 'w-14 h-7',
        thumb: 'after:h-6 after:w-6',
        container: 'h-7',
      },
    };

    return (
      <div className="flex items-start py-1">
        <div className={cn("flex items-center", sizeClasses[size].container)}>
          <label
            className={cn(
              "relative inline-flex items-center cursor-pointer",
              className
            )}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-checked={checked}
            role="switch"
          >
            <input
              type="checkbox"
              ref={ref}
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
              {...props}
            />
            <div className={cn(
              "bg-gray-200 rounded-full peer transition-all duration-200",
              "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
              "after:bg-white after:rounded-full after:transition-all after:duration-200",
              "after:shadow-sm peer-checked:after:translate-x-full",
              "peer-checked:after:border-white",
              "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-1",
              getColorClass(),
              sizeClasses[size].switch,
              sizeClasses[size].thumb,
              checked && 'shadow-inner'
            )}></div>
          </label>
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={props.id}
                className="font-medium text-gray-700 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
