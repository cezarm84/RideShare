import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"

interface TimePickerProps {
  time: string
  setTime: (time: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function TimePickerWithPreview({
  time,
  setTime,
  label,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              open && "border-brand-500 ring-2 ring-brand-500/20",
              "cursor-pointer"
            )}
          >
            {label && (
              <span
                className={cn(
                  "absolute left-3 transition-all duration-200",
                  open || time
                    ? "-top-2 text-xs font-medium text-brand-500 bg-background px-1"
                    : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                )}
              >
                {label}
              </span>
            )}

            <div className="flex-grow flex items-center h-full min-h-[24px] overflow-hidden">
              {time ? (
                <span className="text-foreground truncate block">
                  {/* Convert 24h time to 12h format with AM/PM */}
                  {(() => {
                    const [hour, minute] = time.split(':');
                    const hourNum = parseInt(hour);
                    const period = hourNum >= 12 ? 'PM' : 'AM';
                    const hour12 = hourNum % 12 || 12;
                    return `${hour12}:${minute} ${period}`;
                  })()}
                </span>
              ) : (
                <span className="text-muted-foreground truncate block">
                  {placeholder}
                </span>
              )}
            </div>

            <span className="flex items-center text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 border-0 shadow-none" align="start">
          <CustomTimePicker
            time={time}
            onTimeChange={(newTime, shouldClose) => {
              setTime(newTime);
              if (shouldClose !== undefined) {
                setOpen(!shouldClose);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
