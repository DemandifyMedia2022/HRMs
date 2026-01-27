import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.survey_feedback.findMany({
      orderBy: { created_at: 'desc' },
    });
    const serialized = items.map((it: any) => ({
      ...it,
      id: typeof it.id === 'bigint' ? Number(it.id) : it.id,
      createdAt: it.created_at ? new Date(it.created_at).toISOString() : null,
      updatedAt: it.updated_at ? new Date(it.updated_at).toISOString() : null,
    }));
    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load feedbacks',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['overall', 'culture', 'balance', 'salary', 'growth', 'manager', 'policies', 'recommend'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the feedback record in the database
    const feedback = await prisma.survey_feedback.create({
      data: {
        overall: Number(body.overall),
        culture: Number(body.culture),
        balance: Number(body.balance),
        salary: Number(body.salary),
        growth: Number(body.growth),
        manager: Number(body.manager),
        policies: Number(body.policies),
        recommend: Number(body.recommend),
        comments: body.comments || null,
      },
    });

    const serialized = {
      ...feedback,
      id: typeof (feedback as any).id === 'bigint' ? Number((feedback as any).id) : (feedback as any).id,
      createdAt: (feedback as any).created_at ? new Date((feedback as any).created_at).toISOString() : null,
      updatedAt: (feedback as any).updated_at ? new Date((feedback as any).updated_at).toISOString() : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: serialized,
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
