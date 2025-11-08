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
    <div className="p-4 flex items-center space-x-4 rounded-xl bg-[--color-bg-primary] animate-pulse">
        <div className="relative flex-shrink-0">
            <div className="h-14 w-14 rounded-full bg-[--color-bg-tertiary]"></div>
        </div>
        <div className="flex-grow overflow-hidden space-y-2">
            <div className="h-4 bg-[--color-bg-tertiary] rounded w-1/3"></div>
            <div className="h-3 bg-[--color-bg-tertiary] rounded w-3/4"></div>
            <div className="h-3 bg-[--color-bg-tertiary] rounded w-1/2"></div>
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

  const hasConversations = sortedConversations.length > 0;
  const isEmpty = !isLoading && !hasConversations;

  return (
    <div className={`p-4 space-y-3 h-full ${isEmpty ? 'bg-gradient-to-b from-[--color-bg-secondary] to-[--color-bg-tertiary] flex items-center justify-center' : ''}`}>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
      ) : hasConversations ? (
        sortedConversations.map((conv, index) => {
          const friend = findFriend(conv);
          if (!friend) return null; // Or render a placeholder for unknown users
          return (
            <ConversationPreviewCard
              key={conv.id}
              conversation={conv}
              friend={friend}
              onClick={() => onOpenConversation(conv.id)}
              animationStyle={{ animationDelay: `${index * 50}ms` }}
            />
          );
        })
      ) : (
        <div className="text-center">
          <p className="text-6xl mb-4">💬</p>
          <h3 className="text-xl font-bold text-[--color-text-primary]">Your inbox is quiet</h3>
          <p className="text-[--color-text-secondary] mt-2 max-w-xs mx-auto">Send a message from a friend's profile to start a conversation.</p>
        </div>
      )}
    </div>
  );
};

export default MessagesPanel;