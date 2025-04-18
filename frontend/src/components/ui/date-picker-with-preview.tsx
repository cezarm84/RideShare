import * as React from "react"
import { format } from "date-fns"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  className?: string
}

export function DatePickerWithPreview({
  date,
  setDate,
  label,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
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
                  open || date
                    ? "-top-2 text-xs font-medium text-brand-500 bg-background px-1"
                    : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                )}
              >
                {label}
              </span>
            )}

            <div className="flex-grow flex items-center h-full">
              {date ? (
                <span className={cn(
                  "text-foreground",
                  open || label ? "ml-0" : "ml-0"
                )}>
                  {format(date, "PPP")}
                </span>
              ) : (
                <span className={cn(
                  "text-muted-foreground",
                  open || label ? "ml-0" : "ml-0"
                )}>
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
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 border-0 shadow-none" align="start">
          <CustomCalendar
            date={date}
            onDateChange={(date) => {
              setDate(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
