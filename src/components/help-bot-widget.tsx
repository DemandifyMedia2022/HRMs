'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconMessageCircle, IconSend, IconX, IconLoader2 } from '@tabler/icons-react';

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
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
        <div
          className={`mb-2 w-96 max-w-[95vw] rounded-lg border bg-background shadow-xl origin-bottom-right transform transition-all duration-200 ${open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'pointer-events-none opacity-0 translate-y-2 scale-95'
            }`}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <img
                src="/robot-assistant.png"
                alt="Dexo"
                className="h-6 w-6"
              />
              <h1 className="text-lg font-semibold text-primary">Dexo</h1>
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
              <ScrollArea className="h-80 px-3 py-2">
                <div className="flex flex-col gap-2 text-sm">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={
                        message.from === 'user'
                          ? 'ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground'
                          : 'mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2'
                      }
                    >
                      <div className="mb-1 text-[11px] opacity-80">
                        <span>{message.from === 'user' ? 'You' : 'Dexo'}</span>
                      </div>
                      {message.text.split('\n').map((line, idx) => (
                        <p key={idx}>
                          {line.split(' ').map((word, wordIdx) => {
                            const trimmed = word.replace(/`/g, '');
                            const isInternalLink = trimmed.startsWith('/pages/');
                            const isExternalLink = /^https?:\/\//.test(trimmed);
                            const isLink = isInternalLink || isExternalLink;
                            const href = trimmed;

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
              <div className="flex flex-wrap gap-2 px-3 pb-2">
                {quickQuestions.map(question => (
                  <Button
                    key={question.value}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => void handleSend(question.value)}
                    disabled={loading}
                  >
                    {question.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t px-3 py-2">
                <Input
                  placeholder="Ask Dexo how to do something..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm"
                />
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSend className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          size="icon"
          className="h-24 w-24 rounded-full bg-white pointer-events-auto"
          onClick={() => setOpen(prev => !prev)}
        >
          <video
            src="/Chatbot.webm"
            className="h-28 w-28 rounded-full"
            autoPlay
            loop
            muted
          />
        </Button>
      </div>
    </>
  );
}
