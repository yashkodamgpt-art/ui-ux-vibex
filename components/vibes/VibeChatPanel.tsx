
import React, { useEffect, useRef, useState } from 'react';
import type { User, Session, SessionMessage, Friend } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { containsOffensiveContent } from '../../lib/contentFilter';

interface VibeChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    vibe: Session;
    messages: SessionMessage[];
    user: User;
    onSendMessage: (text: string, isSystemMessage?: boolean) => void;
    onLeaveVibe: (eventId: number) => void;
    onViewProfile: (username: string) => void;
    onTransferOwnership: (sessionId: number, newOwnerId: string, newOwnerUsername: string) => void;
    setConfirmation: (confirmation: { title: string; message: string; onConfirm: () => void } | null) => void;
}

const QUICK_REPLIES_VIBE = ["On the way", "In 5 min", "At the library", "Running late"];
const QUICK_REPLIES_BORROW = ["Where can we meet?", "I'm at the library", "I have the item", "I'll be there in 5."];
const MAX_CHARS = 100;

const getCharLimitColors = (length: number, limit: number) => {
    if (length >= limit) return { text: 'text-[--color-error]', border: 'border-red-500 ring-red-500' };
    if (length >= limit - 20) return { text: 'text-orange-500', border: 'border-orange-400 ring-orange-400' };
    return { text: 'text-[--color-text-secondary]', border: 'border-[--color-border]' };
};

const ParticipantMenu: React.FC<{ onMakeLeader: () => void }> = ({ onMakeLeader }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-3 text-[--color-text-secondary] rounded-full hover:bg-[--color-bg-tertiary]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-[--color-bg-primary] rounded-md shadow-lg z-20 origin-bottom-right">
                    <div className="py-1">
                        <button onClick={() => { onMakeLeader(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-[--color-text-primary] hover:bg-[--color-bg-secondary]">
                            <span className="mr-2">👑</span> Make Leader
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const VibeChatPanel: React.FC<VibeChatPanelProps> = ({ isOpen, onClose, vibe, messages, user, onSendMessage, onLeaveVibe, onViewProfile, onTransferOwnership, setConfirmation }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messageText, setMessageText] = useState('');
    const [participants, setParticipants] = useState<{id: string; username: string}[]>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
    const [inputError, setInputError] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isCreator = user.id === vibe.creator_id;
    const isGiver = vibe.sessionType === 'borrow' && vibe.participantRoles?.[user.id] === 'giver';

    useEffect(() => { if (vibe?.participants?.length > 0) { const fetchParticipants = async () => { const { data, error } = await supabase.from('profiles').select('id, username').in('id', vibe.participants); if (error) console.error("Error fetching participants:", error); else setParticipants(data || []); }; fetchParticipants(); } else { setParticipants([]); } }, [vibe]);
    
    const handleFormSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        const trimmedMessage = messageText.trim();
        if (isSending || !trimmedMessage) return;
        
        if (containsOffensiveContent(trimmedMessage)) { 
            setInputError(true); 
            setTimeout(() => setInputError(false), 500); 
            return; 
        } 
        
        setIsSending(true);
        onSendMessage(trimmedMessage); 
        setMessageText('');
        setTimeout(() => setIsSending(false), 1000); // Prevent spamming
    };
    
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { if(isOpen) { setActiveTab('chat'); } }, [isOpen]);
    useEffect(() => { if (activeTab === 'chat') { scrollToBottom(); } }, [messages, activeTab]);
    
    const handleMakeLeader = (participant: {id: string; username: string}) => {
        setConfirmation({
            title: `Make ${participant.username} the leader?`,
            message: `You will transfer ownership of this session to them. This cannot be undone.`,
            onConfirm: () => onTransferOwnership(vibe.id, participant.id, participant.username)
        });
    };

    const quickReplies = vibe.sessionType === 'borrow' ? QUICK_REPLIES_BORROW : QUICK_REPLIES_VIBE;
    const charColors = getCharLimitColors(messageText.length, MAX_CHARS);

    const renderChat = () => (
        <>
            <div className="flex-grow overflow-y-auto py-4 px-2 space-y-4">
                {messages.length > 0 ? messages.map(msg => (
                    msg.sender_id === 'system' ? (
                        <div key={msg.id} className="text-center my-2">
                            <span className="text-xs text-[--color-text-secondary] bg-[--color-bg-tertiary] px-2 py-1 rounded-full">{msg.text}</span>
                        </div>
                    ) : (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender_id === user.id ? 'bg-[--color-accent-secondary] text-[--color-text-on-accent] rounded-br-lg' : 'bg-[--color-bg-primary] text-[--color-text-primary] rounded-bl-lg shadow-sm'}`}>
                            <p className="font-bold text-sm">{msg.sender_id === user.id ? 'You' : (msg.sender?.username || 'Unknown')}</p>
                            <p className="text-md break-words">{msg.text}</p>
                            <p className="text-xs opacity-70 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))) : ( <div className="text-center text-[--color-text-secondary] pt-16">No messages yet. Say hi!</div> )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 pt-2">
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                    {quickReplies.map(reply => ( <button key={reply} onClick={() => setMessageText(reply)} className="px-4 py-2 text-sm font-medium rounded-full bg-[--color-accent-secondary]/10 text-[--color-accent-secondary] hover:bg-[--color-accent-secondary]/20 transition-colors">{reply}</button>))}
                </div>
                 <form onSubmit={handleFormSubmit} className="flex items-center gap-2 p-2">
                    <div className="relative w-full">
                        <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} maxLength={MAX_CHARS} placeholder="Type your message..." className={`w-full px-4 py-2 bg-[--color-bg-primary] border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputError ? 'shake-error border-red-500' : charColors.border}`} style={{fontSize: '16px'}}/>
                        <p className={`absolute right-4 bottom-[-18px] text-xs ${charColors.text}`}>{messageText.length}/{MAX_CHARS}</p>
                    </div>
                    <button type="submit" disabled={isSending || !messageText.trim()} className="p-3 bg-[--color-accent-secondary] text-white rounded-full hover:bg-purple-700 dark:hover:bg-purple-500 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /> </svg> </button>
                </form>
            </div>
        </>
    );

    const renderParticipants = () => (
        <div className="flex-grow overflow-y-auto py-4 px-2">
            <ul className="space-y-2">
                {participants.map(participant => {
                    const role = vibe.participantRoles?.[participant.id];
                    let roleText = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : '';
                    if (vibe.sessionType === 'borrow') { roleText = role === 'seeking' ? 'Borrower' : (role === 'giver' ? 'Lender' : ''); }
                    const roleColor = role === 'seeking' || role === 'giver' ? (role === 'seeking' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300') : null;
                    const canTransfer = isCreator && participant.id !== user.id && vibe.privacy === 'public';

                    return (
                        <li key={participant.id}>
                            <div className="w-full flex items-center justify-between p-3 bg-[--color-bg-primary] rounded-lg shadow-sm">
                                <button onClick={() => onViewProfile(participant.username)} className="flex flex-col text-left">
                                    <span className="font-semibold text-[--color-text-primary]">{participant.username} {participant.id === user.id && '(You)'} {participant.id === vibe.creator_id && '👑'}</span>
                                    {roleText && <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full self-start ${roleColor}`}>{roleText}</span>}
                                </button>
                                {canTransfer && <ParticipantMenu onMakeLeader={() => handleMakeLeader(participant)} />}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    );

    return (
        <>
            <div onClick={onClose} className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden="true" />
            <div className={`fixed bottom-0 left-0 right-0 z-[2010] bg-[--color-bg-secondary] rounded-t-2xl shadow-2xl modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '75vh' }} role="dialog" aria-modal="true" aria-labelledby="vibe-chat-title">
                <div className="p-4 flex flex-col h-full">
                    <div className="flex-shrink-0 text-center pb-2 relative"> <div className="mx-auto w-12 h-1.5 bg-[--color-border] rounded-full mb-2" /> <h2 id="vibe-chat-title" className="text-xl font-bold text-[--color-text-primary] truncate px-12">{vibe?.title ?? 'Chat'}</h2> <button onClick={onClose} className="absolute top-1 right-2 p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-full hover:bg-[--color-bg-tertiary]" aria-label="Close chat"> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button> </div>
                    {vibe?.sessionType === 'borrow' && (<div className="flex-shrink-0 p-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200 text-xs text-center border-y border-yellow-200 dark:border-yellow-500/30"><strong>Safety first!</strong> Be cautious when sharing contact info. Meet in public places.</div>)}
                    <div className="flex-shrink-0 border-b border-[--color-border]"> <nav className="flex justify-around -mb-px"> <button onClick={() => setActiveTab('chat')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'chat' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-gray-300 dark:hover:border-gray-600'}`}>Chat</button> <button onClick={() => setActiveTab('participants')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'participants' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-gray-300 dark:hover:border-gray-600'}`}>Participants ({vibe?.participants?.length ?? 0})</button> </nav> </div>
                    <div className="flex-grow flex flex-col overflow-hidden"> {activeTab === 'participants' ? renderParticipants() : renderChat()} </div>
                    <div className="flex-shrink-0 pt-2 border-t border-[--color-border]">
                        {isGiver && ( <button onClick={() => alert("MOCK: Marked as returned!")} className="w-full mt-1 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">Mark as Returned</button> )}
                        {!isCreator && ( <button onClick={() => onLeaveVibe(vibe.id)} className="w-full mt-2 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors">Leave Session</button> )} 
                    </div>
                </div>
            </div>
        </>
    );
};
export default VibeChatPanel;