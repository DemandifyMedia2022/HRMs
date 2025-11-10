import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const prisma = new PrismaClient();
const logger = createLogger('events');

// GET all events or filter by date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let events;

    if (start && end) {
      // Filter events by date range
      events = await prisma.crud_events.findMany({
        where: {
          event_start: {
            gte: new Date(start)
          },
          event_end: {
            lte: new Date(end)
          }
        },
        select: {
          id: true,
          event_name: true,
          event_start: true,
          event_end: true,
          event_date: true,
          description: true
        },
        orderBy: {
          event_start: 'asc'
        }
      });
    } else {
      // Get all events
      events = await prisma.crud_events.findMany({
        select: {
          id: true,
          event_name: true,
          event_start: true,
          event_end: true,
          event_date: true,
          description: true
        },
        orderBy: {
          event_start: 'asc'
        }
      });
    }

    // Convert BigInt to Number for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      id: Number(event.id)
    }));

    return NextResponse.json({
      success: true,
      data: serializedEvents
    });
  } catch (error) {
    logger.error('GET error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_name, event_start, event_end, description } = body;

    if (!event_name || !event_start) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event name and start date are required'
        },
        { status: 400 }
      );
    }

    const newEvent = await prisma.crud_events.create({
      data: {
        event_name,
        event_start: new Date(event_start),
        event_end: event_end ? new Date(event_end) : new Date(event_start),
        event_date: new Date(event_start),
        description: description || ''
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event created successfully!',
      data: {
        ...newEvent,
        id: Number(newEvent.id)
      }
    });
  } catch (error) {
    logger.error('POST error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, event_name, event_start, event_end, description } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event ID is required'
        },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.crud_events.update({
      where: { id: parseInt(id) },
      data: {
        event_name,
        event_start: new Date(event_start),
        event_end: event_end ? new Date(event_end) : new Date(event_start),
        event_date: new Date(event_start),
        description: description || ''
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully!',
      data: {
        ...updatedEvent,
        id: Number(updatedEvent.id)
      }
    });
  } catch (error) {
    logger.error('PUT error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event ID is required'
        },
        { status: 400 }
      );
    }

    await prisma.crud_events.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully!'
    });
  } catch (error) {
    logger.error('DELETE error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
