import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, User, Friend, DirectMessage } from '../../types';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUser: User;
  friend?: Friend;
  onSendMessage: (text: string) => void;
}

const QUICK_REPLIES = ["Yes", "No", "On my way", "Busy", "Later"];
const MAX_CHARS = 100;

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ isOpen, onClose, conversation, currentUser, friend, onSendMessage }) => {
  const [messageText, setMessageText] = useState('');
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
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[2010] bg-gray-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
        role="dialog"
        aria-modal="true"
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center p-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-900 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-800 mx-auto">{friend?.username || 'Chat'}</h2>
        <div className="w-8"></div> {/* Spacer */}
      </header>

      {/* Message List */}
      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        {conversation.messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-green-600 text-white rounded-br-lg' : 'bg-white text-gray-800 rounded-bl-lg shadow-sm'}`}>
              <p className="text-md">{msg.text}</p>
              <p className="text-xs opacity-70 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-200 p-2">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {QUICK_REPLIES.map(reply => (
            <button key={reply} onClick={() => onSendMessage(reply)} className="px-4 py-1.5 text-sm font-medium rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors">
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
                  className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {messageText.length > 50 && (
                <span className="absolute right-4 bottom-3 text-xs text-gray-500">
                    {messageText.length}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button type="submit" className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:bg-gray-400" disabled={!messageText.trim()}>
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