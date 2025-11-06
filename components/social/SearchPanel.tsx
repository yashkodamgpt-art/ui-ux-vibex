import React, { useState, useEffect, useMemo } from 'react';
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
    <div className="bg-white p-3 rounded-xl shadow-md flex items-center space-x-4 animate-pulse">
      <div className="h-12 w-12 rounded-full flex-shrink-0 bg-gray-200"></div>
      <div className="flex-grow space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
    </div>
);


const SearchPanel: React.FC<SearchPanelProps> = ({ currentUser, friends, friendRequests, onSendRequest, onAcceptRequest, onRejectRequest, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [incomingRequestUsers, setIncomingRequestUsers] = useState<Friend[]>([]);

  // Debounce search input
  useEffect(() => {
    setIsLoading(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch profiles for incoming friend requests
  useEffect(() => {
    const incomingUserIds = friendRequests
      .filter(req => req.toUserId === currentUser.id)
      .map(req => req.fromUserId);

    if (incomingUserIds.length > 0) {
      const fetchIncomingProfiles = async () => {
        const { data } = await supabaseService.fetchProfilesByIds(incomingUserIds);
        setIncomingRequestUsers(data || []);
      };
      fetchIncomingProfiles();
    } else {
      setIncomingRequestUsers([]);
    }
  }, [friendRequests, currentUser.id]);

  // Fetch search results from backend when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length > 2) {
      setIsLoading(true);
      const performSearch = async () => {
        const { data } = await supabaseService.searchUsers(debouncedQuery, currentUser.id);
        setSearchResults(data || []);
        setIsLoading(false);
      };
      performSearch();
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [debouncedQuery, currentUser.id]);


  const processedData = useMemo(() => {
    const friendIds = new Set(friends.map(f => f.id));
    const outgoingRequestIds = new Set(friendRequests.filter(r => r.fromUserId === currentUser.id).map(r => r.toUserId));
    const incomingRequestIds = new Set(friendRequests.filter(r => r.toUserId === currentUser.id).map(r => r.fromUserId));
    
    const getStatus = (userId: string): RelationshipStatus => {
        if (userId === currentUser.id) return 'self';
        if (friendIds.has(userId)) return 'friend';
        if (outgoingRequestIds.has(userId)) return 'request_sent';
        if (incomingRequestIds.has(userId)) return 'request_received';
        return 'none';
    };
    
    return {
        incomingRequests: incomingRequestUsers.map(u => ({ user: u, status: getStatus(u.id) })),
        searchResults: searchResults.map(u => ({ user: u, status: getStatus(u.id) }))
    };
  }, [currentUser.id, friends, friendRequests, searchResults, incomingRequestUsers]);

  const handleAction = (userId: string, status: RelationshipStatus) => {
      switch(status) {
          case 'none': onSendRequest(userId); break;
          case 'request_received': onAcceptRequest(userId); break;
          // Reject is handled by a separate button
      }
  };

  return (
    <div className="p-4 space-y-6">
      <input
        type="text"
        placeholder="Search by username or ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        style={{fontSize: '16px'}}
      />

      {/* Incoming Requests */}
      {processedData.incomingRequests.length > 0 && (
          <div className="space-y-3">
              <h2 className="font-bold text-gray-700">Friend Requests</h2>
              {processedData.incomingRequests.map(({user, status}) => (
                  <UserSearchCard 
                    key={user.id}
                    user={user}
                    status={status}
                    onAction={(action) => {
                        if (action === 'accept') onAcceptRequest(user.id);
                        if (action === 'reject') onRejectRequest(user.id);
                    }}
                    onViewProfile={onViewProfile}
                  />
              ))}
          </div>
      )}

      {/* Search Results */}
      <div className="space-y-3">
        {debouncedQuery.length > 2 && <h2 className="font-bold text-gray-700">Search Results</h2>}
        
        {isLoading && debouncedQuery.length > 2 && Array.from({length: 3}).map((_, i) => <SkeletonCard key={i} />) }

        {!isLoading && debouncedQuery.length > 2 && processedData.searchResults.length === 0 && (
            <div className="text-center py-10">
                <h3 className="text-lg font-semibold text-gray-600">No users found</h3>
                <p className="text-gray-500 mt-1">Try a different name or check for typos.</p>
            </div>
        )}

        {!isLoading && processedData.searchResults.length > 0 && processedData.searchResults.map(({user, status}) => (
            <UserSearchCard 
                key={user.id}
                user={user}
                status={status}
                onAction={() => handleAction(user.id, status)}
                onViewProfile={onViewProfile}
            />
        ))}

        {!isLoading && debouncedQuery.length > 2 && processedData.searchResults.length >= 20 && (
            <p className="text-center text-sm text-gray-500 pt-4">Showing top 20 results.</p>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
