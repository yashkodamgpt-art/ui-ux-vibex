import React, { useState } from 'react';
import type { Session } from '../../types';

interface SessionHistoryCardProps {
  session: Session;
}

const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const typeStyles: Record<Session['sessionType'], { bg: string; text: string; border: string }> = {
  vibe: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-500' },
  seek: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-500' },
  cookie: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-500' },
  borrow: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-800 dark:text-green-300', border: 'border-green-500' },
};

const SessionHistoryCard: React.FC<SessionHistoryCardProps> = ({ session }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = typeStyles[session.sessionType];

  return (
    <div className={`border-l-4 ${styles.border} bg-[--color-bg-primary] rounded-lg shadow-sm overflow-hidden`}>
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{session.emoji}</span>
            <div>
              <h4 className="font-bold text-[--color-text-primary]">{session.title}</h4>
              <div className="flex items-center gap-2 text-xs text-[--color-text-secondary] mt-1">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${styles.bg} ${styles.text}`}>{session.sessionType}</span>
                <span>{formatRelativeTime(session.event_time)}</span>
              </div>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[--color-text-secondary]/70 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-[--color-border]">
          <div className="mt-2 text-sm space-y-2">
            {session.description && <p className="text-[--color-text-secondary]">{session.description}</p>}
             <div className="grid grid-cols-2 gap-2 text-xs">
                 <p className="text-[--color-text-secondary]"><span className="font-semibold text-[--color-text-primary]">Duration:</span> {session.duration} mins</p>
                 <p className="text-[--color-text-secondary]"><span className="font-semibold text-[--color-text-primary]">Participants:</span> {session.participants.length}</p>
             </div>
             <div>
                <h5 className="font-semibold text-[--color-text-primary] text-xs mb-1">Participants:</h5>
                <div className="flex flex-wrap gap-1">
                    {session.participants.map((p, index) => (
                        <span key={index} className="bg-[--color-bg-tertiary] text-[--color-text-secondary] px-2 py-0.5 text-xs rounded-full">{p === session.creator_id ? session.creator.username : `User...${p.slice(-4)}`}</span>
                    ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionHistoryCard;