import React from 'react';
import type { Tag, Friend } from '../../types';
import TagCard from './TagCard';

interface TagsPanelProps {
  isLoading: boolean;
  tags: Tag[];
  friends: Friend[];
  onViewProfile: (friend: Friend) => void;
  onCreateTag: () => void;
  onEditTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
}

const SkeletonTagCard: React.FC = () => (
    <div className="bg-white rounded-xl shadow-md p-3 flex items-center animate-pulse">
        <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-5 w-10 bg-gray-200 rounded-full"></div>
    </div>
);


const TagsPanel: React.FC<TagsPanelProps> = ({ isLoading, tags, friends, onViewProfile, onCreateTag, onEditTag, onDeleteTag }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Create Tag Button */}
      <button 
        onClick={onCreateTag}
        className="w-full flex items-center justify-center p-3 bg-green-100 text-green-800 font-semibold rounded-lg shadow-sm hover:bg-green-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Create New Tag
      </button>

      {/* Tags List */}
      {isLoading ? (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonTagCard key={i} />)}
        </div>
      ) : tags.length > 0 ? (
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
            <h3 className="text-xl font-semibold text-gray-700">Organize your friends with tags!</h3>
            <p className="text-gray-500 mt-2">
                Create custom groups like 'Study Buddies' or 'Gaming Crew'.
            </p>
        </div>
      )}
    </div>
  );
};

export default TagsPanel;