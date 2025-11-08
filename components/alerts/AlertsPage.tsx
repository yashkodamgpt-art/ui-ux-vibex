import React, { useState, useEffect, useCallback } from 'react';
import type { User, Conversation, DirectMessage, Friend, Notification } from '../../types';
import MessagesPanel from './MessagesPanel';
import NotificationsPanel from './NotificationsPanel';
import DirectMessageModal from './DirectMessageModal';
import { useSwipeGesture } from '../../lib/useSwipeGesture';
import * as supabaseService from '../../lib/supabaseService';
import * as subscriptions from '../../lib/subscriptions';
import type { RealtimeChannel } from '@supabase/supabase-js';

type AlertsTab = 'Messages' | 'Notifications';

interface AlertsPageProps {
  user: User;
  friends: Friend[]; // Receive friends from parent
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onNotificationAction: (notification: Notification, action: 'accept' | 'reject' | 'view') => void;
  dmTarget: Omit<Conversation, 'messages' | 'unreadCount'> | null; // NEW
  onDmTargetHandled: () => void; // NEW
}

const AlertsPage: React.FC<AlertsPageProps> = ({ 
    user, 
    friends,
    notifications, 
    onMarkAsRead, 
    onMarkAllAsRead, 
    onDeleteNotification, 
    onNotificationAction,
    dmTarget,
    onDmTargetHandled
}) => {
  const [activeTab, setActiveTab] = useState<AlertsTab>('Messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial conversations and subscribe to DMs
  useEffect(() => {
    const fetchAndSubscribe = async () => {
        setIsLoading(true);
        const { data: initialConvos, error } = await supabaseService.fetchConversationsForUser(user.id);

        if (error || !initialConvos) {
            console.error("Could not fetch conversations");
            setIsLoading(false);
            return;
        }

        const conversationsWithMessages = await Promise.all(
            initialConvos.map(async (convo: any) => {
                const { data: messages } = await supabaseService.fetchMessagesForConversation(convo.id);
                return { ...convo, messages: messages || [], unreadCount: 0 };
            })
        );
        
        setConversations(conversationsWithMessages);
        setIsLoading(false);

        const channels: RealtimeChannel[] = [];
        conversationsWithMessages.forEach(convo => {
            const channel = subscriptions.subscribeToDirectMessages(convo.id, (newMessage) => {
                setConversations(prevConvos => {
                    return prevConvos.map(c => {
                        if (c.id === newMessage.conversation_id) {
                            // If it's our own message, try to replace the optimistic one
                            if (newMessage.senderId === user.id) {
                                const optimisticIndex = c.messages.findIndex(m => 
                                    m.id.startsWith('temp-') && 
                                    m.text === newMessage.text
                                );
                                
                                if (optimisticIndex > -1) {
                                    const updatedMessages = [...c.messages];
                                    updatedMessages[optimisticIndex] = newMessage; // replace
                                    return { ...c, messages: updatedMessages };
                                }
                            }
                            
                            // Otherwise, if it's not our message, or we couldn't find an optimistic one, just add it.
                            // But first, make sure we don't already have it (from another subscription event)
                            if (c.messages.some(m => m.id === newMessage.id)) return c;
                            return { ...c, messages: [...c.messages, newMessage] };
                        }
                        return c;
                    });
                });
            });
            channels.push(channel);
        });

        return () => {
            channels.forEach(channel => channel.unsubscribe());
        };
    };

    fetchAndSubscribe();
  }, [user.id]);

  // NEW: Effect to handle opening a DM when triggered from another tab
  useEffect(() => {
    if (dmTarget) {
      const exists = conversations.some(c => c.id === dmTarget.id);
      if (!exists) {
        // It's a new conversation, add it to the state.
        // Messages will be fetched when the conversation is opened.
        const newConvo = { ...dmTarget, messages: [], unreadCount: 0 };
        setConversations(prev => [newConvo, ...prev]);
      }
      
      // Open the modal for it
      handleOpenConversation(dmTarget.id);

      // Tell parent we're done
      onDmTargetHandled();
    }
  }, [dmTarget, onDmTargetHandled]);
  
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
  
  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newMessage: DirectMessage = { id: tempId, senderId: user.id, text, timestamp: new Date().toISOString(), conversation_id: activeConversation.id };
    setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, messages: [...c.messages, newMessage] } : c));
    setActiveConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);

    // Send to backend
    await supabaseService.sendDirectMessage(activeConversation.id, user.id, text);
    // The subscription will handle receiving the confirmed message from the DB
  };

  const findFriendForConversation = useCallback((conversation: Conversation): Friend | undefined => {
      const friendId = conversation.participantIds.find(id => id !== user.id);
      return friends.find(f => f.id === friendId);
  }, [user.id, friends]);

  const handleSwipeLeft = () => {
    if (activeTab === 'Messages') setActiveTab('Notifications');
  };

  const handleSwipeRight = () => {
    if (activeTab === 'Notifications') setActiveTab('Messages');
  };

  const swipeHandlers = useSwipeGesture(handleSwipeLeft, handleSwipeRight);

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b border-[--color-border] px-4 bg-[--color-bg-primary]">
          <nav className="flex justify-around -mb-px">
            <button
              onClick={() => setActiveTab('Messages')}
              className={`w-full py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'Messages' ? 'border-[--color-accent-primary] text-[--color-accent-primary]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border]'}`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('Notifications')}
              className={`w-full py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'Notifications' ? 'border-[--color-accent-primary] text-[--color-accent-primary]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border]'}`}
            >
              Notifications
            </button>
          </nav>
        </div>
        <div 
          className="flex-grow overflow-hidden relative"
          {...swipeHandlers}
        >
          <div className="h-full flex transition-transform duration-300 ease-out"
               style={{ transform: `translateX(${activeTab === 'Messages' ? '0%' : '-100%'})` }}>
            <div className="min-w-full h-full overflow-y-auto bg-[--color-bg-secondary]">
               <MessagesPanel conversations={conversations} currentUser={user} friends={friends} onOpenConversation={handleOpenConversation} isLoading={isLoading} />
            </div>
            <div className="min-w-full h-full overflow-y-auto bg-[--color-bg-secondary]">
              <NotificationsPanel
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onDelete={onDeleteNotification}
                onAction={onNotificationAction}
              />
            </div>
          </div>
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