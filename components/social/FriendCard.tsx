import React, { useState, useRef, useEffect } from 'react';
import type { Friend } from '../../types';

interface FriendCardProps {
  friend: Friend;
  onViewProfile: (friend: Friend) => void;
  onRemoveFriend: (friendId: string) => void;
  onAssignToTags: (friend: Friend) => void;
  onOpenDM: (friendId: string) => void;
}

// Simple hash to get a color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onViewProfile, onRemoveFriend, onAssignToTags, onOpenDM }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = friend.username.charAt(0).toUpperCase();
  const bgColor = stringToColor(friend.id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      onClick={() => onOpenDM(friend.id)}
      className="bg-[--color-bg-primary] p-3 rounded-xl shadow-md flex items-center space-x-4 cursor-pointer hover:bg-[--color-bg-secondary] active:scale-[0.98] transition-all duration-200 ease-out"
      role="button"
      tabIndex={0}
      aria-label={`Message ${friend.username}`}
    >
      {/* Profile Initial */}
      <div 
        className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <span className="text-2xl font-bold text-white">{initial}</span>
      </div>

      {/* Friend Info */}
      <div className="flex-grow">
        <h3 className="font-bold text-[--color-text-primary]">{friend.username}</h3>
        <p className="text-sm text-[--color-text-secondary]">{friend.branch}, Year {friend.year}</p>
        <div className="flex items-center text-sm text-yellow-500 font-semibold mt-1">
          <span>🍪</span>
          <span className="ml-1">{friend.cookieScore}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0 relative" ref={menuRef}>
        <button
            onClick={(e) => {
                e.stopPropagation(); // Prevent onOpenDM from firing
                setIsMenuOpen(prev => !prev);
            }}
            className="p-2 text-[--color-text-secondary] rounded-full hover:bg-[--color-bg-tertiary] z-10"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            aria-label="More options"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {isMenuOpen && (
             <div className="absolute right-0 mt-2 w-48 bg-[--color-bg-primary] rounded-md shadow-lg z-20 origin-top-right transition-all duration-200 ease-in-out transform opacity-100 scale-100" role="menu" aria-orientation="vertical">
                <div className="py-1" role="none">
                    <button onClick={(e) => { e.stopPropagation(); onViewProfile(friend); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[--color-text-primary] hover:bg-[--color-bg-secondary]" role="menuitem">View Profile</button>
                    <button onClick={(e) => { e.stopPropagation(); onAssignToTags(friend); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-[--color-text-primary] hover:bg-[--color-bg-secondary]" role="menuitem">Add to Tag</button>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveFriend(friend.id); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-500/10" role="menuitem">Remove Friend</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FriendCard);