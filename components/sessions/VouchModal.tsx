import React, { useState } from 'react';
import type { Session } from '../../types';

interface VouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onVouch: (creatorId: string, skill: string, rating: number) => void;
}

const StarIcon: React.FC<{ filled: boolean; onClick: () => void; onHover: () => void; }> = ({ filled, onClick, onHover }) => (
    <button type="button" onClick={onClick} onMouseEnter={onHover} className="text-4xl text-yellow-400 transition-transform hover:scale-110">
        {filled ? '★' : '☆'}
    </button>
);


const VouchModal: React.FC<VouchModalProps> = ({ isOpen, onClose, session, onVouch }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen) return null;

  const handleVouch = () => {
    if (session.skillTag) {
      // Rating is ignored - backend calculates points automatically
      onVouch(session.creator_id, session.skillTag, rating);
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[3000] transition-opacity duration-300 opacity-100" 
        aria-hidden="true"
      />
      <div 
        className={`fixed inset-0 z-[3010] flex items-end sm:items-center justify-center p-0 sm:p-4 ${isOpen ? '' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vouch-title"
      >
        <div className={`w-full max-w-sm bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 space-y-4 text-center modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <h2 id="vouch-title" className="text-xl font-bold text-[--color-text-primary]">Rate Your Experience</h2>
          <p className="text-[--color-text-secondary]">
            Did <span className="font-semibold text-orange-500">{session.creator.username}</span> help you with <span className="font-semibold text-orange-500">{session.skillTag}</span>?
          </p>

          {/* Star Rating */}
          <div className="flex justify-center my-4" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map(star => (
                  <StarIcon 
                    key={star} 
                    filled={(hoverRating || rating) >= star}
                    onClick={() => setRating(star)}
                    onHover={() => setHoverRating(star)}
                  />
              ))}
          </div>

          <p className="text-sm text-[--color-text-secondary]">
            Vouching for them will award them Cookie points!
          </p>

          <div className="flex flex-col space-y-3 pt-2">
            <button 
              onClick={handleVouch} 
              className="w-full px-4 py-3 bg-orange-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Vouch & Give 🍪
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full px-4 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border]"
            >
              No, thanks
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VouchModal;