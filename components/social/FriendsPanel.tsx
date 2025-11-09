import React, { useState, useMemo } from 'react';
import type { Friend, Tag } from '../../types';
import FriendCard from './FriendCard';

type SortOption = 'Recent' | 'Cookie Score' | 'Name (A-Z)';

interface FriendsPanelProps {
  friends: Friend[];
  tags: Tag[];
  onViewProfile: (friend: Friend) => void;
  onRemoveFriend: (friendId: string) => void;
  onAssignToTags: (friend: Friend) => void;
  onOpenDM: (friendId: string) => void; // NEW
}

const FriendsPanel: React.FC<FriendsPanelProps> = ({ friends, tags, onViewProfile, onRemoveFriend, onAssignToTags, onOpenDM }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('Recent');

  const sortedAndFilteredFriends = useMemo(() => {
    let filteredFriends = friends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortOption) {
      case 'Cookie Score':
        filteredFriends.sort((a, b) => b.cookieScore - a.cookieScore);
        break;
      case 'Name (A-Z)':
        filteredFriends.sort((a, b) => a.username.localeCompare(b.username));
        break;
      case 'Recent':
      default:
        // 'Recent' sort relies on the default order from the server.
        // A dedicated timestamp would be needed for a more precise sort.
        break;
    }

    return filteredFriends;
  }, [searchQuery, sortOption, friends]);

  return (
    <div className="p-4 space-y-4">
      {/* Search and Sort Controls */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
          style={{fontSize: '16px'}}
        />
        <div className="flex items-center justify-end space-x-2">
            <span className="text-sm font-medium text-[--color-text-secondary]">Sort by:</span>
             <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="text-sm font-semibold text-[--color-accent-primary] bg-transparent border-none focus:ring-0"
             >
                <option>Recent</option>
                <option>Cookie Score</option>
                <option>Name (A-Z)</option>
            </select>
        </div>
      </div>

      {/* Friends List */}
      {sortedAndFilteredFriends.length > 0 ? (
        <div className="space-y-3">
          {sortedAndFilteredFriends.map(friend => (
            <FriendCard 
                key={friend.id} 
                friend={friend} 
                onViewProfile={onViewProfile}
                onRemoveFriend={onRemoveFriend}
                onAssignToTags={onAssignToTags}
                onOpenDM={onOpenDM}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-5xl mb-4">👋🤝</p>
            <h3 className="text-xl font-semibold text-[--color-text-secondary]">
                {searchQuery ? "No friends found" : "Start building your campus network!"}
            </h3>
            <p className="text-[--color-text-secondary] mt-2">
              {searchQuery ? "Try a different search." : "Use the Search tab to find and connect with classmates."}
            </p>
        </div>
      )}
    </div>
  );
};

export default FriendsPanel;