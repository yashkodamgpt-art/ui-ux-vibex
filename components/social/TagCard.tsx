
import React, { useState } from 'react';
import type { Tag, Friend } from '../../types';
import FriendCard from './FriendCard'; // We can reuse the FriendCard for a consistent look

interface TagCardProps {
  tag: Tag;
  allFriends: Friend[];
  onViewProfile: (friend: Friend) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (tagId: string) => void;
}

const tagColors: { [key: string]: string } = {
  green: 'border-green-500',
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  orange: 'border-orange-500',
  red: 'border-red-500',
  pink: 'border-pink-500',
  yellow: 'border-yellow-500',
  gray: 'border-gray-500',
};

const TagCard: React.FC<TagCardProps> = ({ tag, allFriends, onViewProfile, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const members = allFriends.filter(friend => tag.memberIds.includes(friend.id));
  const borderColor = tagColors[tag.color] || 'border-gray-500';

  return (
    <div className={`bg-[--color-bg-primary] rounded-xl shadow-md border-l-4 ${borderColor} overflow-hidden`}>
      {/* Card Header */}
      <div 
        className="flex items-center p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
      >
        <span className="text-2xl mr-3">{tag.emoji}</span>
        <div className="flex-grow">
            <h3 className="font-bold text-[--color-text-primary]">{tag.name}</h3>
            <p className="text-sm text-[--color-text-secondary]">{tag.memberIds.length} members</p>
        </div>
        <div className="flex items-center space-x-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(tag); }} className="p-2 text-[--color-text-secondary] rounded-full hover:bg-[--color-bg-tertiary]"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(tag.id); }} className="p-2 text-red-500 rounded-full hover:bg-red-500/10"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[--color-text-secondary] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-[--color-border]">
            {members.length > 0 ? (
                <div className="space-y-2 mt-2">
                    {members.map(friend => (
                       <div key={friend.id} className="bg-[--color-bg-secondary] p-2 rounded-lg flex items-center space-x-3">
                           <h4 className="flex-grow font-semibold text-sm text-[--color-text-primary]">{friend.username}</h4>
                           <button onClick={() => onViewProfile(friend)} className="text-xs font-semibold text-[--color-accent-primary] hover:underline">View Profile</button>
                       </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-[--color-text-secondary] py-4">No friends in this tag yet.</p>
            )}
        </div>
      )}
    </div>
  );
};

export default React.memo(TagCard);