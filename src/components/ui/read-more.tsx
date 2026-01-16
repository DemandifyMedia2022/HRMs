'use client';

import { useState } from 'react';

interface ReadMoreProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ReadMore({ text, maxLength = 150, className = '' }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className={className}>
      <p>
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-1 text-blue-600 hover:text-blue-800 text-sm font-medium underline"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      </p>
    </div>
  );
}
