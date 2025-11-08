import React from 'react';
import type { Friend } from '../../types';

type RelationshipStatus = 'self' | 'friend' | 'request_sent' | 'request_received' | 'none';
type ActionType = 'add' | 'accept' | 'reject';

interface UserSearchCardProps {
  user: Friend;
  status: RelationshipStatus;
  onAction: (action: ActionType) => void;
  onViewProfile: (friend: Friend) => void;
}

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

const ActionButton: React.FC<{ status: RelationshipStatus, onAction: (action: ActionType) => void }> = ({ status, onAction }) => {
    switch (status) {
        case 'friend':
            return <span className="px-4 py-2 text-sm font-semibold text-[--color-text-secondary] bg-[--color-bg-tertiary] rounded-lg">Friends</span>;
        case 'request_sent':
            return <button disabled className="px-4 py-2 text-sm font-semibold text-[--color-text-secondary] bg-[--color-bg-tertiary] rounded-lg cursor-not-allowed">Request Sent</button>;
        case 'request_received':
            return (
                <div className="flex space-x-2">
                    <button onClick={() => onAction('reject')} className="px-3 py-2 text-sm font-bold text-[--color-text-primary] bg-[--color-bg-tertiary] hover:bg-[--color-border] rounded-lg">Reject</button>
                    <button onClick={() => onAction('accept')} className="px-3 py-2 text-sm font-bold text-white bg-[--color-accent-primary] hover:bg-green-700 dark:hover:bg-green-500 rounded-lg">Accept</button>
                </div>
            );
        case 'none':
        default:
            return <button onClick={() => onAction('add')} className="px-4 py-2 text-sm font-bold text-white bg-[--color-accent-secondary] hover:bg-purple-700 dark:hover:bg-purple-500 rounded-lg">Add Friend</button>;
    }
};


const UserSearchCard: React.FC<UserSearchCardProps> = ({ user, status, onAction, onViewProfile }) => {
  const initial = user.username.charAt(0).toUpperCase();
  const bgColor = stringToColor(user.id);

  return (
    <div className="bg-[--color-bg-primary] p-3 rounded-xl shadow-md flex items-center space-x-4">
      <button onClick={() => onViewProfile(user)} className="flex items-center space-x-4 flex-grow text-left">
          <div 
            className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-2xl font-bold text-white">{initial}</span>
          </div>

          <div className="flex-grow">
            <h3 className="font-bold text-[--color-text-primary]">{user.username}</h3>
            <p className="text-sm text-[--color-text-secondary]">{user.branch}, {user.year}</p>
            {user.mutualFriends > 0 && <p className="text-xs text-[--color-text-secondary]/80 mt-1">{user.mutualFriends} mutual friends</p>}
          </div>
      </button>

      <div className="flex-shrink-0">
        <ActionButton status={status} onAction={onAction} />
      </div>
    </div>
  );
};

export default UserSearchCard;
