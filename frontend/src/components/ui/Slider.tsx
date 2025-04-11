import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  label?: string;
  color?: 'blue' | 'primary' | 'green' | 'red' | 'purple';
  showMarks?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({
    className,
    value,
    min,
    max,
    step = 1,
    onChange,
    showValue = true,
    valuePrefix = '',
    valueSuffix = '',
    label,
    color = 'blue',
    showMarks = false,
    ...props
  }, ref) => {
    const [localValue, setLocalValue] = useState(value);
    const [isDragging, setIsDragging] = useState(false);

    // Update local value when prop value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      setLocalValue(newValue);
      onChange(newValue);
    };

    const percentage = ((localValue - min) / (max - min)) * 100;

    // Color mapping
    const colorMap = {
      blue: '#3880ff',
      primary: '#0e88e5',
      green: '#22c55e',
      red: '#ef4444',
      purple: '#a855f7'
    };

    const trackColor = colorMap[color];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor={props.id} className="text-sm font-medium text-gray-700">
            {label || props['aria-label']}
          </label>
          {showValue && (
            <span className="text-sm font-medium px-2 py-1 rounded-md transition-all text-gray-900">
              {valuePrefix}{localValue}{valueSuffix}
            </span>
          )}
        </div>
        <div className="relative py-1">
          <input
            type="range"
            ref={ref}
            value={localValue}
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className={cn(
              "w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              className
            )}
            style={{
              background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
              WebkitAppearance: 'none',
            }}
            {...props}
          />

          {/* Custom thumb styling is applied via CSS classes */}

          {/* Marks */}
          {showMarks && (
            <div className="relative w-full h-6 mt-1">
              <div className="absolute left-0 -ml-1 text-xs text-gray-500">{min}</div>
              <div className="absolute left-1/4 -ml-1 text-xs text-gray-500">{min + ((max - min) / 4)}</div>
              <div className="absolute left-2/4 -ml-1 text-xs text-gray-500">{min + ((max - min) / 2)}</div>
              <div className="absolute left-3/4 -ml-1 text-xs text-gray-500">{min + ((max - min) * 3 / 4)}</div>
              <div className="absolute right-0 -mr-1 text-xs text-gray-500">{max}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
