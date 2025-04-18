import { useState, useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

type TimePickerProps = {
  id: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onChange?: (time: string) => void;
  className?: string;
};

export default function EnhancedTimePicker({
  id,
  label,
  placeholder,
  defaultValue = "",
  onChange,
  className = "",
}: TimePickerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedTime, setSelectedTime] = useState(defaultValue);

  useEffect(() => {
    const flatPickrInstance = flatpickr(`#${id}`, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      defaultDate: defaultValue || undefined,
      positionElement: document.getElementById(`${id}-wrapper`),
      appendTo: document.getElementById(`${id}-wrapper`) || undefined,
      onOpen: () => {
        setIsFocused(true);
      },
      onClose: () => {
        setIsFocused(false);
      },
      onChange: (_, timeStr) => {
        setSelectedTime(timeStr);
        if (onChange) {
          onChange(timeStr);
        }
      },
    });

    return () => {
      if (!Array.isArray(flatPickrInstance)) {
        flatPickrInstance.destroy();
      }
    };
  }, [id, defaultValue, onChange]);

  return (
    <div className={`${className}`}>
      <div 
        id={`${id}-wrapper`}
        className={`relative border rounded-lg transition-all duration-200 ${
          isFocused 
            ? "border-brand-500 shadow-md pt-6 pb-2 px-3" 
            : "border-gray-300 dark:border-gray-700 px-3 py-2.5"
        }`}
      >
        {label && (
          <label 
            htmlFor={id}
            className={`absolute transition-all duration-200 ${
              isFocused || selectedTime
                ? "text-xs text-brand-500 top-2 left-3" 
                : "text-sm text-gray-500 top-1/2 -translate-y-1/2 left-3"
            }`}
          >
            {label}
          </label>
        )}
        
        <input
          id={id}
          placeholder={isFocused ? placeholder : ""}
          className="w-full bg-transparent appearance-none border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-white/90"
          readOnly
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </div>
  );
}
