import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { helpTopics, type HelpUserRole } from '@/lib/help-bot-knowledge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const message = body?.message as string | undefined;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Invalid or empty message' }, { status: 400 });
    }

    let role: HelpUserRole = 'user';
    const token = req.cookies.get('access_token')?.value;

    if (token) {
      try {
        const payload = verifyToken(token) as any;
        const rawRole = String(payload?.role || 'user').toLowerCase();
        if (rawRole === 'admin' || rawRole === 'hr' || rawRole === 'user') {
          role = rawRole;
        }
      } catch (e) {
        // Ignore token errors and default to user role
      }
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Help bot is not configured. Missing OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const relevantTopics = helpTopics.filter(topic => topic.role === 'all' || topic.role === role);

    const topicsSummary = relevantTopics
      .map(topic => `- ${topic.title} -> ${topic.url}\n  ${topic.description}`)
      .join('\n');

    const systemPrompt = [
      'You are the in-app help assistant for the Demandify HRMS web application.',
      'Your job is to guide the user on how to use the HRMS, which menu items to click, and which exact URL route to open.',
      'Always reply in short, clear steps. Prefer bullet points.',
      'When you recommend a page, always include the exact route path like `/pages/hr/bank-challan` so the user can navigate there.',
      'Never invent new routes. Only use the routes provided to you.',
      'If something is not possible in the system, say that honestly.',
      'The user can be an admin, HR, or regular user. Only suggest routes that are available to their role.',
      'If the user question is vague, briefly ask a clarifying question and then suggest the most likely useful pages.'
    ].join('\n');

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'system',
        content: `Available features and routes for this user role (${role}):\n${topicsSummary}`
      },
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Help bot OpenAI API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to get help response from AI.' },
        { status: 500 }
      );
    }

    const data = (await response.json()) as any;
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json({ success: false, error: 'Empty response from help bot.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reply, role });
  } catch (error: any) {
    console.error('Help bot error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
