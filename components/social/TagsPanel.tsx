import React from 'react';
import type { Tag, Friend } from '../../types';
import TagCard from './TagCard';

interface TagsPanelProps {
  tags: Tag[];
  friends: Friend[];
  onViewProfile: (friend: Friend) => void;
  onCreateTag: () => void;
  onEditTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
}

const TagsPanel: React.FC<TagsPanelProps> = ({ tags, friends, onViewProfile, onCreateTag, onEditTag, onDeleteTag }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Create Tag Button */}
      <button 
        onClick={onCreateTag}
        className="w-full flex items-center justify-center p-3 bg-[--color-accent-primary]/10 text-[--color-accent-primary] font-semibold rounded-lg shadow-sm hover:bg-[--color-accent-primary]/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Create New Tag
      </button>

      {/* Tags List */}
      {tags.length > 0 ? (
        <div className="space-y-3">
          {tags.map(tag => (
            <TagCard 
              key={tag.id} 
              tag={tag} 
              allFriends={friends}
              onViewProfile={onViewProfile}
              onEdit={onEditTag}
              onDelete={onDeleteTag}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-5xl mb-4">🏷️</p>
            <h3 className="text-xl font-semibold text-[--color-text-secondary]">Organize your friends with tags!</h3>
            <p className="text-[--color-text-secondary] mt-2">
                Create custom groups like 'Study Buddies' or 'Gaming Crew'.
            </p>
        </div>
      )}
    </div>
  );
};

export default TagsPanel;