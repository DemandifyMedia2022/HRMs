"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

export type CalendarEvent = {
  id: number
  event_name: string
  event_start: string
  event_end: string
  description?: string
}

type Props = {
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function EventCalendar({ events, onDateClick, onEventClick }: Props) {
  const today = new Date()
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth()) // 0-11

  const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const monthData = useMemo(() => {
    const monthStart = new Date(Date.UTC(year, month, 1))
    const monthEnd = new Date(Date.UTC(year, month + 1, 0))
    const firstWeekday = monthStart.getUTCDay()
    const daysInMonth = monthEnd.getUTCDate()

    // Group events by YYYY-MM-DD of start date
    const eventsByDate = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const d = new Date(ev.event_start)
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
      const arr = eventsByDate.get(dateStr) || []
      arr.push(ev)
      eventsByDate.set(dateStr, arr)
    }

    const cells: Array<{ day?: number; dateStr?: string; events?: CalendarEvent[] }> = []
    for (let i = 0; i < firstWeekday; i++) cells.push({})
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      cells.push({ day: d, dateStr, events: eventsByDate.get(dateStr) })
    }
    while (cells.length % 7 !== 0) cells.push({})

    return { cells }
  }, [year, month, events])

  function handlePrev() {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }

  function handleNext() {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrev}>Prev</Button>
          <Button variant="outline" onClick={handleNext}>Next</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs">
        {headers.map((h) => (
          <div key={h} className="text-center font-medium text-gray-600">{h}</div>
        ))}
        {monthData.cells.map((c, idx) => {
          const has = Boolean(c.day)
          return (
            <div
              key={idx}
              className={`min-h-[100px] rounded border p-2 flex flex-col gap-1 ${has ? "bg-white" : "bg-gray-50"}`}
              onClick={() => {
                if (!has || !c.dateStr) return
                onDateClick?.(new Date(c.dateStr + "T00:00:00"))
              }}
            >
              <div className="text-right text-xs text-gray-500">{c.day ?? ""}</div>
              {c.events?.slice(0, 3).map((ev) => (
                <button
                  key={ev.id}
                  className="text-[11px] text-blue-600 truncate text-left hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick?.(ev)
                  }}
                  title={ev.event_name}
                >
                  {ev.event_name}
                </button>
              ))}
              {c.events && c.events.length > 3 ? (
                <div className="text-[10px] text-gray-500">+{c.events.length - 3} more</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
