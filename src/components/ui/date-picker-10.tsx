"use client"

import { useMemo, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type DateTimePickerProps = {
  label?: string
  value: Date | null
  onChange: (date: Date | null) => void
}

export function DateTimePicker({ label, value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)

  const timeString = useMemo(() => {
    if (!value) return ""
    const h = String(value.getHours()).padStart(2, "0")
    const m = String(value.getMinutes()).padStart(2, "0")
    const s = String(value.getSeconds()).padStart(2, "0")
    return `${h}:${m}:${s}`
  }, [value])

  function applyTime(base: Date | null, time: string): Date | null {
    if (!base) return null
    const [hh = "0", mm = "0", ss = "0"] = time.split(":")
    const d = new Date(base)
    d.setHours(Number(hh), Number(mm), Number(ss || 0), 0)
    return d
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <Label className="px-1">{label}</Label>}
      <div className="flex gap-3 flex-wrap">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between font-normal min-w-[200px]">
              {value ? value.toLocaleDateString() : "Pick a date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value ?? undefined}
              onSelect={(d) => {
                // keep existing time if any
                const next = d ? applyTime(d, timeString || "00:00:00") : null
                onChange(next)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          step="1"
          value={timeString}
          onChange={(e) => {
            const next = applyTime(value ?? new Date(), e.target.value)
            onChange(next)
          }}
          placeholder="HH:MM:SS"
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none min-w-[200px]"
        />
      </div>
    </div>
  )
}

export default DateTimePicker
