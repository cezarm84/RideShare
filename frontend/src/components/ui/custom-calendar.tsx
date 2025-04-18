"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays } from "date-fns"

interface CustomCalendarProps {
  date?: Date
  onDateChange?: (date: Date) => void
  className?: string
}

export function CustomCalendar({ date, onDateChange, className }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(date || new Date())
  const [selectedDate, setSelectedDate] = React.useState(date || new Date())
  const [highlightedRange, setHighlightedRange] = React.useState<{ start: Date, end: Date } | null>(null)

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setCurrentMonth(date)

      // Example: Highlight a range of dates (5th to 12th of the month)
      // This is just for demonstration - you can customize this logic
      const day = date.getDate()
      if (day >= 5 && day <= 12) {
        const rangeStart = new Date(date)
        rangeStart.setDate(5)
        const rangeEnd = new Date(date)
        rangeEnd.setDate(12)
        setHighlightedRange({ start: rangeStart, end: rangeEnd })
      } else {
        setHighlightedRange(null)
      }
    }
  }, [date])

  const handleDateSelect = (day: Date) => {
    setSelectedDate(day)
    if (onDateChange) {
      onDateChange(day)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Generate days for the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay()

  // Calculate days from previous month to display
  const prevMonthDays = []
  if (startDay > 0) {
    // For Monday as first day of week
    const daysToAdd = startDay === 0 ? 6 : startDay - 1
    for (let i = daysToAdd; i > 0; i--) {
      prevMonthDays.push(addDays(monthStart, -i))
    }
  }

  // Calculate days from next month to display
  const nextMonthDays = []
  const totalDaysDisplayed = prevMonthDays.length + daysInMonth.length
  const daysToAdd = 35 - totalDaysDisplayed // 5 rows * 7 columns = 35 days
  if (daysToAdd > 0) {
    for (let i = 1; i <= daysToAdd; i++) {
      nextMonthDays.push(addDays(monthEnd, i))
    }
  }

  // Combine all days
  const allDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays]

  // Split days into weeks
  const weeks = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  // Function to check if a date is in the highlighted range
  const isInHighlightedRange = (day: Date) => {
    if (!highlightedRange) return false
    const { start, end } = highlightedRange
    return day >= start && day <= end
  }

  // Function to determine if a day is the start of the highlighted range
  const isRangeStart = (day: Date) => {
    if (!highlightedRange) return false
    return isSameDay(day, highlightedRange.start)
  }

  // Function to determine if a day is the end of the highlighted range
  const isRangeEnd = (day: Date) => {
    if (!highlightedRange) return false
    return isSameDay(day, highlightedRange.end)
  }

  return (
    <div className={cn("w-80 flex flex-col bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden dark:bg-neutral-900 dark:border-neutral-700", className)}>
      <div className="p-3 space-y-0.5">
        {/* Month and Navigation */}
        <div className="grid grid-cols-5 items-center gap-x-3 mx-1.5 pb-3">
          {/* Previous Month Button */}
          <div className="col-span-1">
            <button
              type="button"
              className="size-8 flex justify-center items-center text-gray-800 hover:bg-gray-100 rounded-full focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
              onClick={handlePreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          {/* Month / Year */}
          <div className="col-span-3 flex justify-center items-center">
            <span className="text-sm font-medium text-gray-800">
              {format(currentMonth, "MMMM yyyy")}
            </span>
          </div>

          {/* Next Month Button */}
          <div className="col-span-1 flex justify-end">
            <button
              type="button"
              className="size-8 flex justify-center items-center text-gray-800 hover:bg-gray-100 rounded-full focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="flex pb-1.5">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span key={day} className="m-px w-10 block text-center text-sm text-gray-500">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        {weeks.slice(0, 5).map((week, weekIndex) => (
          <div key={weekIndex} className="flex">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = isSameDay(day, selectedDate)
              const inRange = isInHighlightedRange(day)
              const isRangeStartDay = isRangeStart(day)
              const isRangeEndDay = isRangeEnd(day)

              // Determine if this day should have a background
              const hasBackground = inRange

              // Determine if this day should have rounded corners
              const isRangeStartWithRoundedLeft = isRangeStartDay
              const isRangeEndWithRoundedRight = isRangeEndDay

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    hasBackground && "bg-gray-100 dark:bg-neutral-800",
                    isRangeStartWithRoundedLeft && "rounded-s-full",
                    isRangeEndWithRoundedRight && "rounded-e-full",
                    !isRangeStartWithRoundedLeft && !isRangeEndWithRoundedRight && inRange && "first:rounded-s-full last:rounded-e-full"
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "m-px size-10 flex justify-center items-center border-[1.5px] border-transparent text-sm rounded-full focus:outline-hidden",
                      isCurrentMonth
                        ? "text-gray-800 hover:border-blue-600 hover:text-blue-600 focus:border-blue-600 focus:text-blue-600 dark:text-neutral-200 dark:hover:border-blue-500 dark:hover:text-blue-500 dark:focus:border-blue-500 dark:focus:text-blue-500"
                        : "text-gray-400 opacity-50 pointer-events-none dark:text-neutral-500",
                      isSelected && "bg-blue-600 text-white hover:border-blue-600 focus:border-blue-600 dark:bg-blue-500 dark:hover:border-neutral-700 dark:focus:border-neutral-700"
                    )}
                    onClick={() => isCurrentMonth && handleDateSelect(day)}
                    disabled={!isCurrentMonth}
                  >
                    {format(day, "d")}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
