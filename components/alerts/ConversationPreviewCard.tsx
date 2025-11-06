import React from 'react';
import type { Conversation, Friend } from '../../types';

interface ConversationPreviewCardProps {
  conversation: Conversation;
  friend: Friend;
  onClick: () => void;
}

// Helper to format relative time
const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diff / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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


const ConversationPreviewCard: React.FC<ConversationPreviewCardProps> = ({ conversation, friend, onClick }) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const isUnread = conversation.unreadCount > 0;
  
  const initial = friend.username.charAt(0).toUpperCase();
  const bgColor = stringToColor(friend.id);

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-3 flex items-center space-x-4 rounded-xl transition-colors ${isUnread ? 'bg-green-100' : 'bg-white hover:bg-gray-50'}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div 
          className="h-14 w-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <span className="text-2xl font-bold text-white">{initial}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-grow overflow-hidden">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold text-gray-800 truncate">{friend.username}</h3>
          <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{lastMessage ? formatRelativeTime(lastMessage.timestamp) : ''}</p>
        </div>
        <div className="flex items-start justify-between mt-1">
          <p className={`text-sm truncate pr-2 ${isUnread ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
            {lastMessage ? lastMessage.text : 'No messages yet'}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationPreviewCard;