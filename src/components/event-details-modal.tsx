"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconTrash, IconEdit } from "@tabler/icons-react"

interface Event {
  id: number
  event_name: string
  event_start: string
  event_end: string
  description?: string
}

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onEventUpdated: () => void
  onEventDeleted: () => void
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onEventUpdated,
  onEventDeleted,
}: EventDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [eventName, setEventName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event) {
      setEventName(event.event_name)
      setStartDate(new Date(event.event_start).toISOString().split('T')[0])
      setEndDate(new Date(event.event_end).toISOString().split('T')[0])
      setDescription(event.description || "")
    }
  }, [event])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventName || !startDate || !event) {
      alert('Please fill in required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: event.id,
          event_name: eventName,
          event_start: startDate,
          event_end: endDate || startDate,
          description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Event updated successfully!')
        setIsEditing(false)
        onEventUpdated()
        onClose()
      } else {
        alert('Failed to update event: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Error updating event')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return
    
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/events?id=${event.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Event deleted successfully!')
        onEventDeleted()
        onClose()
      } else {
        alert('Failed to delete event: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Error deleting event')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    onClose()
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Event Details'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update event information' : 'View event details'}
          </DialogDescription>
        </DialogHeader>
        
        {isEditing ? (
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-event-name">
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-start-date">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Event'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Event Name</Label>
                <p className="text-sm">{event.event_name}</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Start Date</Label>
                <p className="text-sm">
                  {new Date(event.event_start).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">End Date</Label>
                <p className="text-sm">
                  {new Date(event.event_end).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {event.description && (
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Description</Label>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
              <Button type="button" onClick={() => setIsEditing(true)}>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
