'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FeedbackState {
  overall: number;
  culture: number;
  balance: number;
  salary: number;
  growth: number;
  manager: number;
  policies: number;
  recommend: number;
  comments: string;
}

const questions: { id: keyof FeedbackState; label: string }[] = [
  { id: 'overall', label: 'How would you rate your overall experience at our company?' },
  { id: 'culture', label: 'How would you rate our company culture?' },
  { id: 'balance', label: 'How would you rate your work-life balance?' },
  { id: 'salary', label: 'How satisfied are you with your salary and benefits?' },
  { id: 'growth', label: 'How would you rate your opportunities for growth and development?' },
  { id: 'manager', label: 'How would you rate your relationship with your manager?' },
  { id: 'policies', label: 'How would you rate our company policies and procedures?' },
  { id: 'recommend', label: 'How likely are you to recommend our company as a great place to work?' }
];

export default function SurveyFormPage() {
  const [feedback, setFeedback] = useState<FeedbackState>({
    overall: 0,
    culture: 0,
    balance: 0,
    salary: 0,
    growth: 0,
    manager: 0,
    policies: 0,
    recommend: 0,
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRatingClick = (questionId: keyof FeedbackState, value: number) => {
    setFeedback(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitted(false);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setSubmitted(true);
      setFeedback({
        overall: 0,
        culture: 0,
        balance: 0,
        salary: 0,
        growth: 0,
        manager: 0,
        policies: 0,
        recommend: 0,
        comments: ''
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Employee Feedback Survey</CardTitle>
          <CardDescription>Your responses help us improve the workplace for everyone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitted && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                Thank you! Your feedback has been submitted.
              </div>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}

            {questions.map(q => (
              <div key={q.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {q.label}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(q.id, star)}
                      className={`text-2xl transition-transform duration-150 ${
                        Number(feedback[q.id]) >= star
                          ? 'text-yellow-400 drop-shadow'
                          : 'text-gray-300'
                      } hover:text-yellow-400 hover:scale-110 focus:outline-none`}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">{Number(feedback[q.id]) || 0}/5</span>
                </div>
              </div>
            ))}

            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                Additional Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={feedback.comments}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
