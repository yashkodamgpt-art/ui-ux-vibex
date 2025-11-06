import React, { useState } from 'react';
import type { User, Conversation, DirectMessage, Friend, Notification } from '../../types';
import { MOCK_CONVERSATIONS, MOCK_FRIENDS, MOCK_NOTIFICATIONS } from '../../lib/mockData';
import MessagesPanel from './MessagesPanel';
import NotificationsPanel from './NotificationsPanel';
import DirectMessageModal from './DirectMessageModal';

type AlertsTab = 'Messages' | 'Notifications';

interface AlertsPageProps {
  user: User;
}

const AlertsPage: React.FC<AlertsPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<AlertsTab>('Messages');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const handleOpenConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversation(conversation);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    }
  };

  const handleCloseConversation = () => {
    setActiveConversation(null);
  };
  
  const handleSendMessage = (text: string) => {
    if (!activeConversation) return;

    const newMessage: DirectMessage = {
      id: `dm-${Date.now()}`,
      senderId: user.id,
      text,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => prev.map(c => 
      c.id === activeConversation.id 
        ? { ...c, messages: [...c.messages, newMessage] } 
        : c
    ));

    setActiveConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
  };

  const findFriendForConversation = (conversation: Conversation): Friend | undefined => {
      const friendId = conversation.participantIds.find(id => id !== user.id);
      return MOCK_FRIENDS.find(f => f.id === friendId);
  }

  // --- Notification Handlers ---
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };
  
  const handleNotificationAction = (notification: Notification, action: 'accept' | 'reject' | 'view') => {
    console.log(`Action '${action}' on notification:`, notification);
    
    if (notification.type === 'friend_request_received') {
      if (action === 'accept') {
        alert(`MOCK: Accepted friend request from ${notification.user?.username}!`);
      } else if (action === 'reject') {
        alert(`MOCK: Rejected friend request from ${notification.user?.username}.`);
      }
      handleDeleteNotification(notification.id);
    } 
    else if (notification.type === 'session_invite' || notification.type === 'session_join' || notification.type === 'session_ending_soon') {
      if (action === 'view') {
        alert(`MOCK: Navigating to session: "${notification.session?.title}". This would switch to the Home tab.`);
        // In a real app, this would call a function passed from MainApp to switch tabs and focus the map.
      }
      handleMarkAsRead(notification.id);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Messages':
        return <MessagesPanel conversations={conversations} currentUser={user} friends={MOCK_FRIENDS} onOpenConversation={handleOpenConversation} />;
      case 'Notifications':
        return (
          <NotificationsPanel
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDeleteNotification}
            onAction={handleNotificationAction}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 px-4">
          <nav className="flex justify-around -mb-px">
            <button
              onClick={() => setActiveTab('Messages')}
              className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Messages' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('Notifications')}
              className={`w-full py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'Notifications' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Notifications
            </button>
          </nav>
        </div>
        <div className="flex-grow overflow-y-auto bg-gray-50">
          {renderContent()}
        </div>
      </div>
      
      {activeConversation && (
        <DirectMessageModal 
          isOpen={!!activeConversation}
          onClose={handleCloseConversation}
          conversation={activeConversation}
          currentUser={user}
          friend={findFriendForConversation(activeConversation)}
          onSendMessage={handleSendMessage}
        />
      )}
    </>
  );
};

export default AlertsPage;