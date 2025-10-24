"use client"

import { useState } from "react"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface Event {
  id: number
  event_name: string
  event_start: string
  event_end: string
  description?: string
}

interface EventCalendarProps {
  events: Event[]
  onDateClick: (date: Date) => void
  onEventClick: (event: Event) => void
}

export function EventCalendar({ events, onDateClick, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => {
      const eventStart = new Date(event.event_start).toISOString().split('T')[0]
      const eventEnd = new Date(event.event_end).toISOString().split('T')[0]
      return dateStr >= eventStart && dateStr <= eventEnd
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    )
  }

  const renderCalendarDays = () => {
    const days = []
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border border-gray-100 bg-gray-50"></div>
      )
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day)
      const today = isToday(day)
      
      days.push(
        <div
          key={day}
          className={`p-2 border border-gray-200 min-h-[100px] cursor-pointer hover:bg-blue-50 transition-colors ${
            today ? 'bg-blue-100' : 'bg-white'
          }`}
          onClick={() => onDateClick(new Date(year, month, day))}
        >
          <div className={`text-sm font-semibold mb-1 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event, idx) => (
              <div
                key={event.id}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded cursor-pointer hover:bg-blue-600 truncate"
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(event)
                }}
                title={event.event_name}
              >
                {event.event_name}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <Button variant="outline" size="sm" onClick={prevMonth}>
          <IconChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">
          {monthNames[month]} {year}
        </h2>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 bg-gray-100">
        {dayNames.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-gray-600 border border-gray-200"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>
    </div>
  )
}
