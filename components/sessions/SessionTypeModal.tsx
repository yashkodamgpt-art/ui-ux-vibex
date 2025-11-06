
import React from 'react';
import type { SessionType } from '../../types';

interface SessionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: SessionType) => void;
}

// Data for our 4 session types
const sessionTypes = [
  {
    type: 'vibe' as SessionType,
    emoji: '🎉',
    title: 'Vibe',
    description: 'Start a spontaneous social event, like a game or a study group.',
    color: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
  },
  {
    type: 'seek' as SessionType,
    emoji: '🙋',
    title: 'Seek',
    description: 'Ask for help or knowledge from the campus community.',
    color: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
  },
  {
    type: 'cookie' as SessionType,
    emoji: '🍪',
    title: 'Cookie',
    description: 'Offer a skill or your expertise and earn Cookie Score!',
    color: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
  },
  {
    type: 'borrow' as SessionType,
    emoji: '🤝',
    title: 'Borrow',
    description: 'Request to borrow a physical item from someone nearby.',
    color: 'bg-green-600',
    hover: 'hover:bg-green-700',
  },
];

const SessionTypeModal: React.FC<SessionTypeModalProps> = ({ isOpen, onClose, onSelectType }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100"
        aria-hidden="true"
      />
      {/* Modal Dialog */}
      <div
        className="fixed inset-0 z-[2010] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-type-title"
      >
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 scale-100">
          <div className="flex justify-between items-center mb-4">
            <h2 id="session-type-title" className="text-2xl font-bold text-gray-800">
              Create a new...
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {sessionTypes.map((session) => (
              <button
                key={session.type}
                onClick={() => onSelectType(session.type)}
                className={`w-full p-4 ${session.color} ${session.hover} text-white rounded-lg flex items-center transition-colors shadow-md`}
              >
                <div className="text-4xl mr-4">{session.emoji}</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold">{session.title}</h3>
                  <p className="text-sm opacity-90">{session.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionTypeModal;