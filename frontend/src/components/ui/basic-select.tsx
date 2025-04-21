import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface BasicSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const BasicSelect: React.FC<BasicSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  id,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value);
  const selectRef = useRef<HTMLDivElement>(null);

  // Log props on mount and when they change
  useEffect(() => {
    console.log(`BasicSelect ${id} - Initial props:`, { options, value, placeholder });
  }, []);

  // Update internal state when external value changes
  useEffect(() => {
    console.log(`BasicSelect ${id} - Value changed:`, value);

    // Check if the value exists in the options
    const valueExists = options.some(opt => opt.value === value);

    if (!valueExists && value && value.includes('_')) {
      // Try to find a partial match
      const idPart = value.split('_').pop(); // Get the ID part after the prefix
      const partialMatch = options.find(opt => opt.value.endsWith(`_${idPart}`));

      if (partialMatch) {
        console.log(`BasicSelect ${id} - Found partial match for value:`, partialMatch);
        // Use the partial match instead
        setSelectedValue(partialMatch.value);
        return;
      }
    }

    setSelectedValue(value);
  }, [value, options, id]);

  // Find the selected option label
  let selectedOption = options.find(option => option.value === selectedValue);

  // If we can't find an exact match, try to find a partial match
  if (!selectedOption && selectedValue && selectedValue.includes('_')) {
    const idPart = selectedValue.split('_').pop(); // Get the ID part after the prefix
    selectedOption = options.find(opt => opt.value.endsWith(`_${idPart}`));

    if (selectedOption) {
      console.log(`BasicSelect ${id} - Found partial match for value:`, selectedOption);
      // Update the internal state to match the found option
      setSelectedValue(selectedOption.value);
    }
  }

  // Log when selectedOption changes
  useEffect(() => {
    console.log(`BasicSelect ${id} - Selected option:`, selectedOption);
  }, [selectedOption, id]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debug function to log options and selection
  const handleSelection = (optionValue: string) => {
    console.log(`BasicSelect ${id} - Selection clicked:`, optionValue);
    console.log(`BasicSelect ${id} - Current value:`, value);
    console.log(`BasicSelect ${id} - Available options:`, options);

    // Find the selected option
    const selectedOption = options.find(opt => opt.value === optionValue);
    console.log(`BasicSelect ${id} - Selected option object:`, selectedOption);

    if (!selectedOption) {
      console.warn(`BasicSelect ${id} - Could not find option with value:`, optionValue);
      console.warn(`BasicSelect ${id} - Available options:`, options.map(o => ({ value: o.value, label: o.label })));

      // Try to find a partial match (for prefixed values like 'hub_1' or 'destination_2')
      if (optionValue.includes('_')) {
        const idPart = optionValue.split('_').pop(); // Get the ID part after the prefix
        const partialMatch = options.find(opt => opt.value.endsWith(`_${idPart}`));

        if (partialMatch) {
          console.log(`BasicSelect ${id} - Found partial match:`, partialMatch);
          // Use the partial match instead
          setSelectedValue(partialMatch.value);
          setTimeout(() => {
            console.log(`BasicSelect ${id} - Calling onChange with partial match:`, partialMatch.value);
            onChange(partialMatch.value);
          }, 0);
          setIsOpen(false);
          return;
        }
      }

      return; // Don't proceed if we can't find the option
    }

    // Set the internal state
    setSelectedValue(optionValue);

    // Call the onChange handler with a slight delay to ensure React has time to process state changes
    setTimeout(() => {
      console.log(`BasicSelect ${id} - Calling onChange with:`, optionValue);
      onChange(optionValue);
    }, 0);

    // Close the dropdown
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={cn(
        "relative w-full",
        className
      )}
    >
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <ul className="py-1" role="listbox">
            {options.map((option, index) => {
              // Create a unique key for each option
              const uniqueKey = `${id}_${option.value}_${index}`;
              console.log(`Rendering option with key: ${uniqueKey}`, option);

              return (
                <li
                  key={uniqueKey}
                  role="option"
                  aria-selected={selectedValue === option.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center py-1.5 px-2 text-sm outline-none",
                    selectedValue === option.value ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleSelection(option.value)}
                  data-value={option.value} // Add data attribute for debugging
                >
                  <span className="flex-1">{option.label}</span>
                  {selectedValue === option.value && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
