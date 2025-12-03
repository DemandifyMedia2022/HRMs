'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconMessageCircle, IconSend, IconX, IconLoader2 } from '@tabler/icons-react';
import SiriOrb from '@/components/smoothui/siri-orb';

type ChatMessage = {
  id: number;
  from: 'user' | 'bot';
  text: string;
};

export function HelpBotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 1,
    from: 'bot',
    text:
      'Hi, I am your HRMS assistant. Ask me any questions about HRMS.'
  }]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const quickQuestions = [
    { label: 'Apply for leave', value: 'How do I apply for leave?' },
    { label: 'Download my payslip', value: 'Where can I download my payslip?' },
    { label: 'Bank challan details', value: 'How to check bank challan details?' }
  ];

  const handleSend = async (overrideMessage?: string) => {
    const source = overrideMessage ?? input;
    const trimmed = source.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      from: 'user',
      text: trimmed
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overrideMessage) {
      setInput('');
    }
    setLoading(true);

    try {
      const res = await fetch('/api/help-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: trimmed })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Help bot request failed:', text);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            from: 'bot',
            text: 'Sorry, I was unable to fetch help right now. Please try again in a moment.'
          }
        ]);
        return;
      }

      const data = (await res.json().catch(() => null)) as { success?: boolean; reply?: string } | null;

      if (!data || !data.success || !data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            from: 'bot',
            text: 'Sorry, I could not understand the response. Please try rephrasing your question.'
          }
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: data.reply!
        }
      ]);
    } catch (error) {
      console.error('Help bot network error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: 'Network error while contacting help bot.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 pointer-events-none">
        <div
          className={`mb-1 w-96 max-w-[95vw] rounded-2xl border border-border/70 bg-background shadow-2xl origin-bottom-right transform transition-all duration-200 ${open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'pointer-events-none opacity-0 translate-y-2 scale-95'
            }`}
        >
          <div className="flex items-center justify-between border-b px-4 py-3 bg-background/80 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-background flex items-center justify-center shadow-sm">
                <SiriOrb size="28px" />
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-sm font-semibold text-primary">Dexo</h1>
                <span className="text-[11px] text-muted-foreground">HRMS assistant</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setOpen(false)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <div className="flex max-h-[60vh] flex-col">
              <ScrollArea className="h-80 px-4 py-3">
                <div className="flex flex-col gap-3 text-sm">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={
                        message.from === 'user'
                          ? 'ml-auto max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground shadow-sm'
                          : 'mr-auto max-w-[80%] rounded-2xl bg-muted px-3 py-2 shadow-sm border border-border/40'
                      }
                    >
                      <div className="mb-1 text-[11px] opacity-70">
                        <span>{message.from === 'user' ? 'You' : 'Dexo'}</span>
                      </div>
                      {message.text.split('\n').map((line, idx) => (
                        <p key={idx}>
                          {line.split(' ').map((word, wordIdx) => {
                            // Remove backticks and trailing punctuation so
                            // links like "/pages/hr" or "https://..." still
                            // work even if followed by a full stop.
                            const trimmed = word.replace(/`/g, '');
                            const cleaned = trimmed.replace(/[.,!?;:)\]]+$/u, '');
                            const isInternalLink = cleaned.startsWith('/pages/');
                            const isExternalLink = /^https?:\/\//.test(cleaned);
                            const isLink = isInternalLink || isExternalLink;
                            const href = cleaned;

                            if (isLink) {
                              return (
                                <span key={wordIdx}>
                                  {wordIdx > 0 ? ' ' : null}
                                  <a
                                    href={href}
                                    className="underline text-primary"
                                    target={isExternalLink ? '_blank' : undefined}
                                    rel={isExternalLink ? 'noreferrer' : undefined}
                                  >
                                    {trimmed}
                                  </a>
                                </span>
                              );
                            }

                            return (
                              <span key={wordIdx}>
                                {wordIdx > 0 ? ' ' : null}
                                {word}
                              </span>
                            );
                          })}
                        </p>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {quickQuestions.map(question => (
                  <Button
                    key={question.value}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full border-border/70 bg-background/70 hover:bg-background"
                    onClick={() => void handleSend(question.value)}
                    disabled={loading}
                  >
                    {question.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t px-3 py-2 bg-background/80 rounded-b-2xl">
                <Input
                  placeholder="Ask Dexo how to do something..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSend className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="pointer-events-auto rounded-full shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          onClick={() => setOpen(prev => !prev)}
        >
          <SiriOrb size="72px" />
        </button>
      </div>
    </>
  );
}
