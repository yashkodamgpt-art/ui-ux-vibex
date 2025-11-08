import React from 'react';
import type { Session } from '../../types';

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onSessionSelect: (session: Session) => void;
}

const typeStyles: Record<Session['sessionType'], { bg: string; text: string }> = {
  vibe: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-800 dark:text-purple-300' },
  seek: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-800 dark:text-blue-300' },
  cookie: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-800 dark:text-orange-300' },
  borrow: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-800 dark:text-green-300' },
};

const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = ({ isOpen, onClose, sessions, onSessionSelect }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" 
        aria-hidden="true"
      />
      <div 
        className={`fixed inset-0 z-[2010] flex items-end sm:items-center justify-center p-0 sm:p-4 ${isOpen ? '' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-sessions-title"
      >
        <div className={`w-full max-w-md bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 space-y-4 modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <h2 id="active-sessions-title" className="text-xl font-bold text-[--color-text-primary]">Your Active Sessions</h2>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sessions.map(session => {
              const styles = typeStyles[session.sessionType];
              return (
                <button
                  key={session.id}
                  onClick={() => onSessionSelect(session)}
                  className="w-full flex items-center p-3 bg-[--color-bg-secondary] rounded-lg hover:bg-[--color-bg-tertiary] text-left"
                >
                  <span className="text-2xl mr-3">{session.emoji}</span>
                  <div className="flex-grow">
                    <p className="font-semibold text-[--color-text-primary]">{session.title}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                      {session.sessionType}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActiveSessionsModal;