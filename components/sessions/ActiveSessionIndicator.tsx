
import React, { useState, useEffect, useRef } from 'react';
import type { Session } from '../../types';

interface ActiveSessionIndicatorProps {
  activeSession: Session;
  otherSessionsCount: number;
  onTap: () => void;
  onTapPlus: () => void;
  onLongPress: () => void;
}

const typeStyles: Record<Session['sessionType'], { bg: string; text: string }> = {
  vibe: { bg: 'bg-purple-500', text: 'text-white' },
  seek: { bg: 'bg-blue-500', text: 'text-white' },
  cookie: { bg: 'bg-orange-500', text: 'text-white' },
  borrow: { bg: 'bg-green-600', text: 'text-white' },
};

const formatRemainingTime = (endTime: Date): string => {
  const now = new Date();
  const diffMinutes = Math.round((endTime.getTime() - now.getTime()) / 60000);
  if (diffMinutes < 1) return 'Ending soon';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
};

const ActiveSessionIndicator: React.FC<ActiveSessionIndicatorProps> = ({ activeSession, otherSessionsCount, onTap, onTapPlus, onLongPress }) => {
  const [now, setNow] = useState(() => new Date());
  // FIX: Initialize useRef with null and update type to handle null value.
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const handleMouseDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      onLongPress();
    }, 800); // 800ms for long press
  };

  const handleMouseUp = () => {
    // FIX: Check against null to avoid issues if timer ID is 0, and ensure type safety.
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
    }
  };
  
  const handleTouchStart = () => handleMouseDown();
  const handleTouchEnd = () => handleMouseUp();

  const styles = typeStyles[activeSession.sessionType];
  const endTime = new Date(new Date(activeSession.event_time).getTime() + activeSession.duration * 60000);

  return (
    <div className="fixed bottom-20 left-4 z-[1010] flex items-center gap-2">
      <button
        onClick={onTap}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className={`active-session-indicator flex items-center h-12 pl-3 pr-4 rounded-full shadow-lg ${styles.bg} ${styles.text} font-semibold transition-transform hover:scale-105`}
      >
        <span className="text-2xl mr-2">{activeSession.emoji}</span>
        <div className="text-left leading-tight">
          <p className="text-sm capitalize">{activeSession.sessionType}</p>
          <p className="text-xs opacity-80">{formatRemainingTime(endTime)}</p>
        </div>
      </button>
      {otherSessionsCount > 0 && (
        <button
            onClick={onTapPlus}
            className="h-9 w-9 flex items-center justify-center bg-gray-700 text-white text-sm font-bold rounded-full shadow-lg transition-transform hover:scale-110"
        >
          +{otherSessionsCount}
        </button>
      )}
    </div>
  );
};

export default ActiveSessionIndicator;
