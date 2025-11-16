"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarPickerProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  availableDates: string[]
  locale: "ar" | "en"
}

export function CalendarPicker({ selectedDate, onDateSelect, availableDates, locale }: CalendarPickerProps) {
  // Compute dynamic today and start the calendar on today's month
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  today.setHours(0, 0, 0, 0)

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const isArabic = locale === "ar"
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // Determine availability: if availableDates is not provided or looks sparse (e.g. < 31 days),
  // we treat it as "no restriction" and allow all future dates up to `maxDate`.
  const MAX_YEARS = 2
  const maxDate = new Date(today.getFullYear() + MAX_YEARS, today.getMonth(), today.getDate())

  const isDateAvailable = (date: Date) => {
    const dateStr = formatDate(date)
    const looksSparse = !availableDates || availableDates.length === 0 || availableDates.length < 31

    if (looksSparse) {
      return date >= today && date <= maxDate
    }

    return availableDates.includes(dateStr)
  }

  const days = getDaysInMonth(currentMonth)
  const monthFormatter = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-GB", { 
    month: "long"
  })
  const yearFormatter = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-GB", { 
    year: "numeric" 
  })

  // Navigation functions
  const goToPreviousMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    if (prev < minMonth) return
    setCurrentMonth(prev)
  }

  const goToNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
    if (next > maxMonth) return
    setCurrentMonth(next)
  }

  // Don't allow going before November 2024
  const isPreviousDisabled = () => {
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return currentMonth.getFullYear() === minMonth.getFullYear() && currentMonth.getMonth() === minMonth.getMonth()
  }

  const isNextDisabled = () => {
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
    return currentMonth.getFullYear() === maxMonth.getFullYear() && currentMonth.getMonth() === maxMonth.getMonth()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={isPreviousDisabled()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="text-center">
          <div className="font-semibold">
            {monthFormatter.format(currentMonth)} {yearFormatter.format(currentMonth)}
          </div>
        </div>
        
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={isNextDisabled()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {(isArabic ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']).map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="p-2"></div>
          }

          const dateStr = formatDate(day)
          const isAvailable = isDateAvailable(day)
          const isSelected = selectedDate === dateStr
          const isPast = day <= today // All dates up to and including today are past
          const isToday = day.getTime() === today.getTime()

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => {
                if (isAvailable && !isPast) {
                  onDateSelect(dateStr)
                }
              }}
              disabled={!isAvailable || isPast}
              className={`
                p-2 text-sm rounded-lg transition-all duration-200 font-medium
                ${isSelected 
                  ? 'bg-primary text-white shadow-md' 
                  : isAvailable && !isPast
                  ? 'text-gray-900 hover:bg-primary/10 hover:text-primary cursor-pointer border border-primary/20'
                  : 'text-gray-300 cursor-not-allowed bg-gray-50'
                }
                ${isPast ? 'line-through opacity-30' : ''}
                ${isToday ? 'bg-red-50 text-red-600 border border-red-200' : ''}
              `}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span>{isArabic ? "محدد" : "Selected"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-primary/20 rounded"></div>
          <span>{isArabic ? "متاح للحجز" : "Available for booking"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span>{isArabic ? "غير متاح" : "Not available"}</span>
        </div>
        <div className="flex items-center gap-2">
         
   
        </div>
      </div>
    </div>
  )
}