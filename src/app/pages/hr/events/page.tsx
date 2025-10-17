"use client"
 
import { useState, useEffect } from "react"
import { SidebarConfig } from "@/components/sidebar-config"
import { EventCalendar } from "@/components/event-calendar"
import { AddEventModal } from "@/components/add-event-modal"
import { EventDetailsModal } from "@/components/event-details-modal"
import { Button } from "@/components/ui/button"
import { IconPlus, IconRefresh } from "@tabler/icons-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
 
interface Event {
  id: number
  event_name: string
  event_start: string
  event_end: string
  description?: string
}
 
export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
 
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')
      const data = await response.json()
     
      if (data.success) {
        setEvents(data.data)
      } else {
        console.error('Failed to fetch events:', data.error)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }
 
  useEffect(() => {
    fetchEvents()
  }, [])
 
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }
 
  const handleEventAdded = () => {
    fetchEvents()
  }
 
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDetailsModalOpen(true)
  }
 
  const handleEventUpdated = () => {
    fetchEvents()
  }
 
  const handleEventDeleted = () => {
    fetchEvents()
  }
 
  return (
    <>
      <SidebarConfig role="hr" />
      <main className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground m-0">Events Calendar</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage company events and important dates</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEvents}
                disabled={loading}
              >
                <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => {
                  setSelectedDate(new Date())
                  setIsModalOpen(true)
                }}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </div>
 
        <Card className="p-0 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '600px'
              }}>
                <div style={{ color: '#6c757d' }}>Loading events...</div>
              </div>
            ) : (
              <EventCalendar
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            )}
          </CardContent>
        </Card>
      </main>
 
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onEventAdded={handleEventAdded}
      />
 
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEvent}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />
    </>
  )
}