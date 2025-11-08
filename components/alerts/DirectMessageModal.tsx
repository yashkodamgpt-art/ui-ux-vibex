import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, User, Friend, DirectMessage } from '../../types';
import { containsOffensiveContent } from '../../lib/contentFilter'; // NEW

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUser: User;
  friend?: Friend;
  onSendMessage: (text: string) => void;
}

const QUICK_REPLIES = ["Yes", "No", "Maybe", "Busy now", "Talk later"];
const MAX_CHARS = 60;

const getCharLimitColors = (length: number, limit: number) => {
    if (length >= limit) return { text: 'text-[--color-error]', border: 'border-red-500 ring-red-500' };
    if (length >= limit - 10) return { text: 'text-orange-500', border: 'border-orange-400 ring-orange-400' };
    return { text: 'text-[--color-text-secondary]', border: 'border-transparent' };
};

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ isOpen, onClose, conversation, currentUser, friend, onSendMessage }) => {
  const [messageText, setMessageText] = useState('');
  const [inputError, setInputError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, conversation.messages]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !messageText.trim()) return;
    
    if (containsOffensiveContent(messageText)) {
        setInputError(true);
        setTimeout(() => setInputError(false), 500);
        return;
    }
    
    setIsSending(true);
    onSendMessage(messageText);
    setMessageText('');
    setTimeout(() => setIsSending(false), 1000); // Prevent spamming
  };

  if (!isOpen) return null;

  const charColors = getCharLimitColors(messageText.length, MAX_CHARS);

  return (
    <div 
        className="fixed inset-0 z-[2010] bg-[--color-bg-secondary] flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
        role="dialog"
        aria-modal="true"
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center p-3 border-b border-[--color-border] bg-[--color-bg-primary]/80 backdrop-blur-sm">
        <button onClick={onClose} className="p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-[--color-text-primary] mx-auto">{friend?.username || 'Chat'}</h2>
        <div className="w-8"></div> {/* Spacer */}
      </header>

      {/* Message List */}
      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        {conversation.messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-green-600 text-white rounded-br-lg' : 'bg-[--color-bg-primary] text-[--color-text-primary] rounded-bl-lg shadow-sm'}`}>
              <p className="text-md break-words">{msg.text}</p>
              <p className="text-xs opacity-70 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 bg-[--color-bg-primary] border-t border-[--color-border] p-2">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {QUICK_REPLIES.map(reply => (
            <button key={reply} onClick={() => onSendMessage(reply)} className="px-4 py-1.5 text-sm font-medium rounded-full bg-[--color-bg-tertiary] text-[--color-text-primary] hover:bg-[--color-border] transition-colors">
              {reply}
            </button>
          ))}
        </div>
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <div className="relative flex-grow">
              <input 
                  type="text" 
                  value={messageText} 
                  onChange={e => setMessageText(e.target.value)}
                  maxLength={MAX_CHARS}
                  placeholder="Type a message..."
                  className={`w-full px-4 py-3 bg-[--color-bg-tertiary] border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${inputError ? 'shake-error border-red-500' : charColors.border}`}
                  style={{fontSize: '16px'}}
              />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold ${charColors.text}`}>
                  {messageText.length}/{MAX_CHARS}
              </span>
            </div>
            <button type="submit" className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600" disabled={!messageText.trim() || isSending}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </form>
      </footer>
    </div>
  );
};

export default DirectMessageModal;