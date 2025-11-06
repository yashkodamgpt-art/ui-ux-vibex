

import React from 'react';
import type { SessionType } from '../../types';

interface CreateSessionMenuProps {
  isOpen: boolean;
  onSelectType: (type: SessionType) => void;
}

const buttons = [
  { type: 'vibe' as SessionType, emoji: '🎉', label: 'Vibe', color: 'bg-purple-500 hover:bg-purple-600' },
  { type: 'seek' as SessionType, emoji: '🙋', label: 'Seek', color: 'bg-blue-500 hover:bg-blue-600' },
  { type: 'cookie' as SessionType, emoji: '🍪', label: 'Cookie', color: 'bg-orange-500 hover:bg-orange-600' },
  { type: 'borrow' as SessionType, emoji: '🤝', label: 'Borrow', color: 'bg-green-600 hover:bg-green-700' },
];

const CreateSessionMenu: React.FC<CreateSessionMenuProps> = ({ isOpen, onSelectType }) => {
  return (
    <div
      className="fixed bottom-20 right-24 z-[1000] flex items-center space-x-3 transition-all duration-300 ease-in-out"
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateX(0)' : 'translateX(50px)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.type}
          onClick={() => onSelectType(btn.type)}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg transition-transform hover:scale-110 ${btn.color}`}
          aria-label={`Create ${btn.label}`}
          title={btn.label}
        >
          {btn.emoji}
        </button>
      ))}
    </div>
  );
};

export default CreateSessionMenu;