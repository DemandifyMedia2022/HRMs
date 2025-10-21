"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateTimePicker } from "@/components/ui/date-picker-10"

type Props = {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  onEventAdded?: () => void
}

export function AddEventModal({ isOpen, onClose, selectedDate, onEventAdded }: Props) {
  const [eventName, setEventName] = useState("")
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const d = selectedDate ?? new Date()
      setStart(new Date(d))
      setEnd(new Date(d))
      setEventName("")
      setDescription("")
    }
  }, [isOpen, selectedDate])

  async function save() {
    if (!eventName || !start) return
    setSaving(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: eventName,
          event_start: start?.toISOString(),
          event_end: (end ?? start)?.toISOString(),
          description,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        onEventAdded?.()
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm">Event Name</div>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Name" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DateTimePicker label="Start" value={start} onChange={setStart} />
            <DateTimePicker label="End" value={end} onChange={setEnd} />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Description</div>
            <textarea className="w-full rounded border px-3 py-2 text-sm min-h-[88px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !eventName || !start}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
