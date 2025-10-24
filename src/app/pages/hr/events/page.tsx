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
  CardDescription,
  CardHeader,
  CardTitle,
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
      <main style={{
        marginLeft: '0px',
        height: '100vh',
        padding: '20px',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: 0
              }}>Events Calendar</h1>
              <p style={{
                color: '#6c757d',
                fontSize: '14px',
                margin: '4px 0 0 0'
              }}>
                Manage company events and important dates
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
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
