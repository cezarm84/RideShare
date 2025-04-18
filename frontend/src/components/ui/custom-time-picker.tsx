"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomTimePickerProps {
  time?: string
  onTimeChange?: (time: string, shouldClose?: boolean) => void
  className?: string
}

export function CustomTimePicker({ time, onTimeChange, className }: CustomTimePickerProps) {
  const [selectedHour, setSelectedHour] = React.useState<number>(time ? parseInt(time.split(':')[0]) % 12 || 12 : 12)
  const [selectedMinute, setSelectedMinute] = React.useState<string>(time ? time.split(':')[1] : "00")
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>(time && parseInt(time.split(':')[0]) >= 12 ? "PM" : "AM")

  React.useEffect(() => {
    if (time) {
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      setSelectedHour(hourNum % 12 || 12) // Convert 24h to 12h format
      setSelectedMinute(minute)

      // Determine AM/PM
      if (hourNum >= 12) {
        setSelectedPeriod("PM")
      } else {
        setSelectedPeriod("AM")
      }
    }
  }, [time])

  const updateTime = (hour: number, minute: string, period: string, shouldClose?: boolean) => {
    // Convert to 24-hour format
    let hour24 = hour
    if (period === "PM" && hour < 12) {
      hour24 = hour + 12
    } else if (period === "AM" && hour === 12) {
      hour24 = 0
    }

    const timeString = `${hour24.toString().padStart(2, '0')}:${minute}`
    if (onTimeChange) {
      onTimeChange(timeString, shouldClose)
    }
  }

  return (
    <div className={cn("w-80 flex flex-col bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden dark:bg-neutral-900 dark:border-neutral-700", className)}>
      {/* Time Picker */}
      <div className="p-3 space-y-0.5">
        {/* Time */}
        <div className="pt-3 flex justify-center items-center gap-x-2">
          {/* Hour Select */}
          <div className="relative">
            <select
              value={selectedHour.toString()}
              onChange={(e) => {
                const hour = parseInt(e.target.value)
                setSelectedHour(hour)
              }}
              className="py-1 px-2 pe-6 w-full cursor-pointer bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 appearance-none"
            >
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                <option key={hour} value={hour.toString()}>
                  {hour}
                </option>
              ))}
            </select>

            <div className="absolute top-1/2 end-2 -translate-y-1/2 pointer-events-none">
              <svg className="shrink-0 size-3 text-gray-500 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          {/* End Hour Select */}

          <span className="text-gray-800 dark:text-white">:</span>

          {/* Minute Select */}
          <div className="relative">
            <select
              value={selectedMinute}
              onChange={(e) => {
                const minute = e.target.value
                setSelectedMinute(minute)
              }}
              className="py-1 px-2 pe-6 w-full cursor-pointer bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 appearance-none"
            >
              {[
                "00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"
              ].map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>

            <div className="absolute top-1/2 end-2 -translate-y-1/2 pointer-events-none">
              <svg className="shrink-0 size-3 text-gray-500 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          {/* End Minute Select */}

          {/* AM/PM Select */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => {
                const period = e.target.value
                setSelectedPeriod(period)
              }}
              className="py-1 px-2 pe-6 w-full cursor-pointer bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 appearance-none"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>

            <div className="absolute top-1/2 end-2 -translate-y-1/2 pointer-events-none">
              <svg className="shrink-0 size-3 text-gray-500 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          {/* End AM/PM Select */}
        </div>
        {/* End Time */}
      </div>
      {/* End Time Picker */}

      {/* Button Group */}
      <div className="py-3 px-4 flex items-center justify-end gap-x-2 border-t border-gray-200 dark:border-neutral-700">
        <button
          type="button"
          className="py-2 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
          onClick={() => onTimeChange && onTimeChange(time || "", true)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="py-2 px-3 inline-flex justify-center items-center gap-x-2 text-xs font-medium rounded-lg border-[1.5px] border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          onClick={() => updateTime(selectedHour, selectedMinute, selectedPeriod, true)}
        >
          Apply
        </button>
      </div>
      {/* End Button Group */}
    </div>
  )
}
