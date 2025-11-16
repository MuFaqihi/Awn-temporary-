"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarPicker } from "@/components/ui/calendar-picker"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Calendar22Props {
  label?: string
  onDateChange?: (date: Date | undefined) => void
  required?: boolean
  placeholder?: string
  locale?: string
}

export function Calendar22({ 
  label = "Date of birth", 
  onDateChange,
  required = false,
  placeholder = "Select date",
  locale = "en"
}: Calendar22Props) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<string>("")
  const isArabic = locale === "ar"

  // Generate available dates (all dates from 1900 to today for date of birth)
  const generateAvailableDates = (): string[] => {
    const dates: string[] = []
    const today = new Date()
    const startYear = 1900
    
    for (let year = startYear; year <= today.getFullYear(); year++) {
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day)
          if (date <= today) {
            dates.push(date.toISOString().split('T')[0])
          }
        }
      }
    }
    
    return dates
  }

  const availableDates = generateAvailableDates()

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    const selectedDateObj = dateStr ? new Date(dateStr) : undefined
    onDateChange?.(selectedDateObj)
    setOpen(false)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder
    const date = new Date(dateStr)
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="date" className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10 px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50",
              !selectedDate && "text-gray-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
            {formatDisplayDate(selectedDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availableDates={availableDates}
            locale={locale as "ar" | "en"}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}