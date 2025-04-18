import { useEffect, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  className?: string;
};

export default function EnhancedDatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  className = "",
}: PropsType) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    // Format the default date for display if provided
    if (defaultDate) {
      if (typeof defaultDate === "string") {
        setSelectedDate(defaultDate);
      } else if (defaultDate instanceof Date) {
        setSelectedDate(defaultDate.toISOString().split("T")[0]);
      }
    }

    const flatPickrInstance = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      positionElement: document.getElementById(`${id}-wrapper`),
      appendTo: document.getElementById(`${id}-wrapper`) || undefined,
      onOpen: () => {
        setIsFocused(true);
      },
      onClose: () => {
        setIsFocused(false);
      },
      onChange: (dates, dateStr) => {
        setSelectedDate(dateStr);
        if (onChange) {
          if (Array.isArray(onChange)) {
            onChange.forEach(hook => hook(dates, dateStr));
          } else {
            onChange(dates, dateStr);
          }
        }
      },
    });

    return () => {
      if (!Array.isArray(flatPickrInstance)) {
        flatPickrInstance.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate]);

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
              isFocused || selectedDate
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
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </div>
  );
}
