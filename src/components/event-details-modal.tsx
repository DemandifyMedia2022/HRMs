"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateTimePicker } from "@/components/ui/date-picker-10"

export type CalendarEvent = {
  id: number
  event_name: string
  event_start: string
  event_end: string
  description?: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
  onEventUpdated?: () => void
  onEventDeleted?: () => void
}

export function EventDetailsModal({ isOpen, onClose, event, onEventUpdated, onEventDeleted }: Props) {
  const [eventName, setEventName] = useState("")
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && event) {
      setEventName(event.event_name)
      const s = new Date(event.event_start)
      const e = new Date(event.event_end || event.event_start)
      setStart(s)
      setEnd(e)
      setDescription(event.description || "")
    }
  }, [isOpen, event])

  async function updateEvent() {
    if (!event) return
    setSaving(true)
    try {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event.id,
          event_name: eventName,
          event_start: start?.toISOString(),
          event_end: (end ?? start)?.toISOString(),
          description,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        onEventUpdated?.()
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent() {
    if (!event) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events?id=${encodeURIComponent(String(event.id))}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (res.ok && json.success) {
        onEventDeleted?.()
        onClose()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>
        {!event ? (
          <div className="text-sm text-gray-500">No event selected.</div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm">Event Name</div>
              <Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!!event && (
            <>
              <Button variant="destructive" onClick={deleteEvent} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
              <Button onClick={updateEvent} disabled={saving || !eventName || !start}>{saving ? "Saving..." : "Save"}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
