import React from 'react';
import type { Notification } from '../../types';
import NotificationCard from './NotificationCard';

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  onAction: (notification: Notification, action: 'accept' | 'reject' | 'view') => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onAction,
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-2 space-y-2">
      {notifications.length > 0 && (
        <div className="px-2 py-1 flex justify-end">
          <button 
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm font-semibold text-green-600 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length > 0 ? (
        notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => onMarkAsRead(notification.id)}
            onDelete={() => onDelete(notification.id)}
            onAction={(action) => onAction(notification, action)}
          />
        ))
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔔</p>
          <h3 className="text-xl font-semibold text-gray-700">All caught up!</h3>
          <p className="text-gray-500 mt-2">You'll see updates about sessions and friends here.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;