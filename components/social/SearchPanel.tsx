import React, { useState, useEffect, useCallback } from 'react';
import type { User, Friend, FriendRequest } from '../../types';
import UserSearchCard from './UserSearchCard';
import * as supabaseService from '../../lib/supabaseService';

type RelationshipStatus = 'self' | 'friend' | 'request_sent' | 'request_received' | 'none';

interface SearchPanelProps {
  currentUser: User;
  friends: Friend[];
  friendRequests: FriendRequest[];
  onSendRequest: (toUserId: string) => void;
  onAcceptRequest: (fromUserId: string) => void;
  onRejectRequest: (fromUserId: string) => void;
  onViewProfile: (friend: Friend) => void;
}

const SkeletonCard: React.FC = () => (
    <div className="bg-[--color-bg-primary] p-3 rounded-xl shadow-md flex items-center space-x-4 animate-pulse">
      <div className="h-12 w-12 rounded-full flex-shrink-0 bg-[--color-bg-tertiary]"></div>
      <div className="flex-grow space-y-2">
        <div className="h-4 bg-[--color-bg-tertiary] rounded w-3/4"></div>
        <div className="h-3 bg-[--color-bg-tertiary] rounded w-1/2"></div>
      </div>
    </div>
);

export const SearchPanel: React.FC<SearchPanelProps> = ({
  currentUser,
  friends,
  friendRequests,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onViewProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      if (hasSearched) setHasSearched(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(async () => {
      const { data, error } = await supabaseService.searchUsers(searchQuery, currentUser.id);
      if (error) {
        console.error("Error searching users:", error);
      } else {
        setSearchResults(data || []);
      }
      setIsLoading(false);
      if (!hasSearched) setHasSearched(true);
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentUser.id, hasSearched]);

  const getRelationshipStatus = useCallback((userId: string): RelationshipStatus => {
    if (userId === currentUser.id) return 'self';
    if (friends.some(friend => friend.id === userId)) return 'friend';
    if (friendRequests.some(req => req.fromUserId === currentUser.id && req.toUserId === userId)) return 'request_sent';
    if (friendRequests.some(req => req.fromUserId === userId && req.toUserId === currentUser.id)) return 'request_received';
    return 'none';
  }, [currentUser.id, friends, friendRequests]);

  const handleAction = (userId: string, action: 'add' | 'accept' | 'reject') => {
    switch (action) {
      case 'add':
        onSendRequest(userId);
        break;
      case 'accept':
        onAcceptRequest(userId);
        break;
      case 'reject':
        onRejectRequest(userId);
        break;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        placeholder="Search users by username..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
        style={{fontSize: '16px'}}
      />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : searchResults.length > 0 ? (
          searchResults.map(user => (
            <UserSearchCard
              key={user.id}
              user={user}
              status={getRelationshipStatus(user.id)}
              onAction={(action) => handleAction(user.id, action)}
              onViewProfile={onViewProfile}
            />
          ))
        ) : hasSearched ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🤷</p>
            <h3 className="text-xl font-semibold text-[--color-text-secondary]">No users found</h3>
            <p className="text-[--color-text-secondary] mt-2">Try a different search term.</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-[--color-text-secondary]">Find your friends</h3>
            <p className="text-[--color-text-secondary] mt-2">Search for classmates by their username (at least 3 characters).</p>
          </div>
        )}
      </div>
    </div>
  );
};
