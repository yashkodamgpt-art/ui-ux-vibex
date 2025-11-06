import React, { useState } from 'react';
import type { User, Conversation, DirectMessage, Friend, Notification } from '../../types';
import { MOCK_CONVERSATIONS, MOCK_FRIENDS } from '../../lib/mockData';
import MessagesPanel from './MessagesPanel';
import NotificationsPanel from './NotificationsPanel';
import DirectMessageModal from './DirectMessageModal';

type AlertsTab = 'Messages' | 'Notifications';

interface AlertsPageProps {
  user: User;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onNotificationAction: (notification: Notification, action: 'accept' | 'reject' | 'view') => void;
}

const AlertsPage: React.FC<AlertsPageProps> = ({ 
    user, 
    notifications, 
    onMarkAsRead, 
    onMarkAllAsRead, 
    onDeleteNotification, 
    onNotificationAction 
}) => {
  const [activeTab, setActiveTab] = useState<AlertsTab>('Messages');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

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
    const newMessage: DirectMessage = { id: `dm-${Date.now()}`, senderId: user.id, text, timestamp: new Date().toISOString() };
    setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, messages: [...c.messages, newMessage] } : c));
    setActiveConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
  };

  const findFriendForConversation = (conversation: Conversation): Friend | undefined => {
      const friendId = conversation.participantIds.find(id => id !== user.id);
      return MOCK_FRIENDS.find(f => f.id === friendId);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Messages':
        return <MessagesPanel conversations={conversations} currentUser={user} friends={MOCK_FRIENDS} onOpenConversation={handleOpenConversation} />;
      case 'Notifications':
        return (
          <NotificationsPanel
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onDelete={onDeleteNotification}
            onAction={onNotificationAction}
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