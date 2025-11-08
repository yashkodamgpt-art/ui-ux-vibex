import React from 'react';
import type { Conversation, Friend } from '../../types';

interface ConversationPreviewCardProps {
  conversation: Conversation;
  friend: Friend;
  onClick: () => void;
  animationStyle: React.CSSProperties;
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


const ConversationPreviewCard: React.FC<ConversationPreviewCardProps> = ({ conversation, friend, onClick, animationStyle }) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const isUnread = conversation.unreadCount > 0;
  
  const initial = friend.username.charAt(0).toUpperCase();
  const bgColor = stringToColor(friend.id);

  return (
    <button 
      onClick={onClick}
      style={animationStyle}
      className="animate-fade-slide-up w-full text-left p-4 flex items-center space-x-4 rounded-xl bg-[--color-bg-primary] hover:bg-[--color-bg-secondary] hover:shadow-md active:scale-[0.98] transition-transform duration-150"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div 
          className="h-14 w-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <span className="text-2xl font-bold text-white">{initial}</span>
        </div>
        {isUnread && (
            <div className="absolute top-0 right-0 flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-green-500 text-white text-xs font-bold ring-2 ring-[--color-bg-primary] animate-pulse-dot" title={`${conversation.unreadCount} unread messages`}>
                {conversation.unreadCount}
            </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow overflow-hidden">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold text-base text-[--color-text-primary] truncate">{friend.username}</h3>
          <p className="text-xs text-[--color-text-secondary]/70 flex-shrink-0 ml-2">{lastMessage ? formatRelativeTime(lastMessage.timestamp) : ''}</p>
        </div>
        <div className="mt-1">
          <p className={`text-sm line-clamp-2 ${isUnread ? 'text-[--color-text-primary] font-semibold' : 'text-[--color-text-secondary]'}`}>
            {lastMessage ? lastMessage.text : 'No messages yet'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default ConversationPreviewCard;