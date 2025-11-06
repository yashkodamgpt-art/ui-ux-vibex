import React from 'react';
import type { Notification } from '../../types';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onAction: (action: 'accept' | 'reject' | 'view') => void;
}

const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkAsRead, onDelete, onAction }) => {
  const { type, user, session, tag, timestamp, isRead } = notification;

  const content = React.useMemo(() => {
    switch (type) {
      case 'friend_request_received':
        return { icon: '🧑‍🤝‍🧑', text: <strong>{user?.username}</strong>, message: 'sent you a friend request.', actions: ['accept', 'reject'] };
      case 'friend_request_accepted':
        return { icon: '✅', text: <strong>{user?.username}</strong>, message: 'accepted your friend request.' };
      case 'session_join':
        return { icon: session?.emoji || '🎉', text: <strong>{user?.username}</strong>, message: `joined your session: "${session?.title}"`, actions: ['view'] };
      case 'session_ending_soon':
        return { icon: '⏳', text: 'Your session', message: `"${session?.title}" is ending in 10 minutes.`, actions: ['view'] };
      case 'session_invite':
        return { icon: '💌', text: <strong>{user?.username}</strong>, message: `invited you to: "${session?.title}"`, actions: ['view'] };
      case 'tag_add':
        return { icon: '🏷️', text: <strong>{user?.username}</strong>, message: `added you to the tag: "${tag?.name}"` };
      case 'ownership_transfer':
        return { icon: '👑', text: 'You are now the leader', message: `of the session: "${session?.title}"`, actions: ['view'] };
      default:
        return { icon: '🔔', text: 'New notification' };
    }
  }, [type, user, session, tag]);

  return (
    <div
      onClick={onMarkAsRead}
      className={`p-3 flex items-start space-x-3 rounded-xl transition-colors cursor-pointer ${
        isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
      }`}
    >
      <div className="flex-shrink-0 h-10 w-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">
        {content.icon}
      </div>

      <div className="flex-grow overflow-hidden">
        <p className="text-sm text-gray-700">
          {content.text} {content.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(timestamp)}</p>
        
        {content.actions && (
          <div className="mt-2 flex items-center space-x-2">
            {content.actions.includes('accept') && (
              <button onClick={(e) => { e.stopPropagation(); onAction('accept'); }} className="px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg">Accept</button>
            )}
            {content.actions.includes('reject') && (
               <button onClick={(e) => { e.stopPropagation(); onAction('reject'); }} className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Reject</button>
            )}
            {content.actions.includes('view') && (
               <button onClick={(e) => { e.stopPropagation(); onAction('view'); }} className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">View</button>
            )}
          </div>
        )}
      </div>

      {!isRead && (
        <div className="flex-shrink-0 h-3 w-3 bg-blue-500 rounded-full self-center" title="Unread"></div>
      )}
    </div>
  );
};

export default NotificationCard;