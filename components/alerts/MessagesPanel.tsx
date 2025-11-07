import React, { useMemo } from 'react';
import type { Conversation, User, Friend } from '../../types';
import ConversationPreviewCard from './ConversationPreviewCard';

interface MessagesPanelProps {
  conversations: Conversation[];
  currentUser: User;
  friends: Friend[];
  onOpenConversation: (conversationId: string) => void;
  isLoading: boolean;
}

const SkeletonCard: React.FC = () => (
    <div className="p-3 flex items-center space-x-4 rounded-xl bg-white animate-pulse">
        <div className="relative flex-shrink-0">
            <div className="h-14 w-14 rounded-full bg-gray-200"></div>
        </div>
        <div className="flex-grow overflow-hidden">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
    </div>
);


const MessagesPanel: React.FC<MessagesPanelProps> = ({ conversations, currentUser, friends, onOpenConversation, isLoading }) => {

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const lastMsgA = new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime();
      const lastMsgB = new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime();
      return lastMsgB - lastMsgA;
    });
  }, [conversations]);
  
  const findFriend = (conversation: Conversation) => {
      const friendId = conversation.participantIds.find(id => id !== currentUser.id);
      return friends.find(f => f.id === friendId);
  }

  return (
    <div className="p-2 space-y-2">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
      ) : sortedConversations.length > 0 ? (
        sortedConversations.map(conv => {
          const friend = findFriend(conv);
          if (!friend) return null; // Or render a placeholder for unknown users
          return (
            <ConversationPreviewCard
              key={conv.id}
              conversation={conv}
              friend={friend}
              onClick={() => onOpenConversation(conv.id)}
            />
          );
        })
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">💬</p>
          <h3 className="text-xl font-semibold text-gray-700">Your inbox is empty</h3>
          <p className="text-gray-500 mt-2">Messages from friends will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default MessagesPanel;
