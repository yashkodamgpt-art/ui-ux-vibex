import React, { useState, useEffect, useMemo } from 'react';
import type { Session, SessionType, Tag, Friend, GenderFilter, User } from '../../types';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => void;
    sessionType: SessionType | null;
    tags: Tag[];
    friends: Friend[];
    user: User; // NEW
}

const emojiLists = {
  vibe: ['🎉', '🎮', '🏀', '⚽', '🎵', '🎬', '📚', '☕', '🍕'],
  seek: ['🙋', '💡', '🆘', '📖', '🧮', '💻', '🔬'],
  cookie: ['🍪', '🎓', '💼', '🎨', '🎸', '🏋️'],
  borrow: ['🤝', '🔧', '📐', '🎒', '🚲', '☂️'],
};

const sessionConfigs = {
  vibe: { title: 'Vibe', emoji: '🎉', flow: 'offering' as const, color: 'purple', placeholder: "e.g., Sunset Movie Night" },
  seek: { title: 'Seek Session', emoji: '🙋', flow: 'seeking' as const, color: 'blue', placeholder: "e.g., Help with Calculus problem" },
  cookie: { title: 'Cookie Session', emoji: '🍪', flow: 'offering' as const, color: 'orange', placeholder: "e.g., Offering Python tutoring" },
  borrow: { title: 'Borrow Request', emoji: '🤝', flow: 'seeking' as const, color: 'green', placeholder: "e.g., Need a T-Square for class" },
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit, sessionType, tags, friends, user }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventTimeOffset, setEventTimeOffset] = useState(5);
    const [duration, setDuration] = useState(60);
    const [error, setError] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('');
    const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState<string[]>([]);
    
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('neutral'); // NEW

    useEffect(() => {
        if (isOpen && sessionType) {
            setTitle('');
            setDescription('');
            setEventTimeOffset(5);
            setDuration(60);
            setError('');
            setSelectedEmoji(sessionConfigs[sessionType].emoji);
            setPrivacy('public');
            setSelectedTagIds([]);
            setGenderFilter('neutral'); // NEW: Reset on open
        }
    }, [isOpen, sessionType]);
    
    const uniqueFriendsCount = useMemo(() => {
        if (privacy === 'public') return friends.length;
        const memberSet = new Set<string>();
        tags
            .filter(tag => selectedTagIds.includes(tag.id))
            .forEach(tag => {
                tag.memberIds.forEach(memberId => memberSet.add(memberId));
            });
        return memberSet.size;
    }, [selectedTagIds, tags, privacy, friends]);

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(emoji);
        setRecentlyUsedEmojis(prev => {
            const filtered = prev.filter(e => e !== emoji);
            const updated = [emoji, ...filtered];
            return updated.slice(0, 5);
        });
    };
    
    const handleToggleTag = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim()) { setError('Please provide a title.'); return; }
        if (!sessionType) { setError('A session type must be selected.'); return; }
        if (privacy === 'private' && selectedTagIds.length === 0) {
            setError('Please select at least one tag for a private vibe.');
            return;
        }

        const eventTime = new Date(Date.now() + eventTimeOffset * 60 * 1000).toISOString();
        const config = sessionConfigs[sessionType];

        onSubmit({
            title, description, event_time: eventTime, duration, status: 'active',
            sessionType: sessionType, emoji: selectedEmoji, 
            genderFilter: sessionType === 'vibe' ? genderFilter : 'neutral', // NEW
            flow: config.flow,
            privacy: sessionType === 'vibe' ? privacy : 'public',
            visibleToTags: sessionType === 'vibe' && privacy === 'private' ? selectedTagIds : undefined,
        });
    };

    if (!isOpen || !sessionType) return null;

    const config = sessionConfigs[sessionType];
    const currentEmojiList = emojiLists[sessionType];
    const colors = {
      purple: { ring: 'focus:ring-purple-500', bg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700', text: 'text-purple-600', border: 'border-purple-500' },
      blue: { ring: 'focus:ring-blue-500', bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700', text: 'text-blue-600', border: 'border-blue-500' },
      orange: { ring: 'focus:ring-orange-500', bg: 'bg-orange-600', hoverBg: 'hover:bg-orange-700', text: 'text-orange-600', border: 'border-orange-500' },
      green: { ring: 'focus:ring-green-600', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700', text: 'text-green-600', border: 'border-green-500' },
    }[config.color];

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" aria-hidden="true" />
            <div className="fixed inset-0 z-[2010] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
                <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-4 transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
                    <h2 id="create-event-title" className="text-2xl font-bold text-gray-800">Create a New {config.title}</h2>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Choose an Emoji</label>
                            <div className="mt-2 space-y-3">
                                {recentlyUsedEmojis.length > 0 && (<div><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Recent</h3><div className="flex flex-wrap gap-2">{recentlyUsedEmojis.map(emoji => (<button type="button" key={`recent-${emoji}`} onClick={() => handleEmojiSelect(emoji)} className={`w-12 h-12 text-2xl rounded-lg flex items-center justify-center transition-all ${selectedEmoji === emoji ? `border-2 ${colors.border} bg-purple-100` : 'bg-gray-100 hover:bg-gray-200'}`}>{emoji}</button>))}</div></div>)}
                                <div><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{config.title} Emojis</h3><div className="flex flex-wrap gap-2">{currentEmojiList.map(emoji => (<button type="button" key={emoji} onClick={() => handleEmojiSelect(emoji)} className={`w-12 h-12 text-2xl rounded-lg flex items-center justify-center transition-all ${selectedEmoji === emoji ? `border-2 ${colors.border} bg-purple-100` : 'bg-gray-100 hover:bg-gray-200'}`}>{emoji}</button>))}</div></div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-3xl">{selectedEmoji}</span>
                                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={`block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${colors.ring}`} placeholder={config.placeholder} />
                            </div>
                        </div>

                        <div><label htmlFor="description" className="text-sm font-medium text-gray-700">Description (Optional)</label><textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className={`mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${colors.ring}`} rows={2} placeholder="Add a few details..."></textarea></div>
                        
                        {sessionType === 'vibe' && (
                            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Visibility</label>
                                    <div className="flex rounded-lg bg-gray-200 p-1"><button type="button" onClick={() => setPrivacy('public')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${privacy === 'public' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600'}`}>Public</button><button type="button" onClick={() => setPrivacy('private')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${privacy === 'private' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-600'}`}>Private</button></div>
                                    {privacy === 'private' && (
                                        <div className="mt-3">
                                            <label className="text-sm font-medium text-gray-700">Visible to Tags</label>
                                            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">{tags.map(tag => (<label key={tag.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => handleToggleTag(tag.id)} className="h-4 w-4 rounded text-green-600 border-gray-300 focus:ring-green-500" /><span className="ml-3 flex items-center text-sm"><span className="mr-2">{tag.emoji}</span><span className="font-semibold">{tag.name}</span><span className="text-gray-500 ml-1">({tag.memberIds.length})</span></span></label>))}</div>
                                            <p className="text-xs text-gray-600 mt-1 text-center">Visible to {uniqueFriendsCount} friends.</p>
                                        </div>
                                    )}
                                </div>
                                {privacy === 'public' && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Gender Filter</label>
                                        <p className="text-xs text-gray-500 mb-2">For safety and comfort, you can limit who can join.</p>
                                        <div className="space-y-2">
                                            <label className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${genderFilter === 'neutral' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}><input type="radio" name="genderFilter" value="neutral" checked={genderFilter === 'neutral'} onChange={() => setGenderFilter('neutral')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" /><span className="ml-3 text-sm font-semibold text-gray-800">Anyone</span></label>
                                            <label className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${genderFilter === 'same_gender' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}><input type="radio" name="genderFilter" value="same_gender" checked={genderFilter === 'same_gender'} onChange={() => setGenderFilter('same_gender')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" /><span className="ml-3 text-sm font-semibold text-gray-800">Same gender only</span></label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div><span className="text-sm font-medium text-gray-700">When?</span><div className="mt-2 flex flex-wrap gap-2">{[5, 10, 15, 30].map(min => (<button type="button" key={min} onClick={() => setEventTimeOffset(min)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${eventTimeOffset === min ? `${colors.bg} text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>In {min}m</button>))}</div></div>
                            <div><span className="text-sm font-medium text-gray-700">For how long?</span><div className="mt-2 flex flex-wrap gap-2">{[30, 60, 90, 120].map(d => (<button type="button" key={d} onClick={() => setDuration(d)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${duration === d ? `${colors.bg} text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{d < 60 ? `${d}m` : `${d / 60}h`}</button>))}</div></div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 flex-shrink-0 pt-2 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
                        <button type="submit" className={`px-6 py-2 ${colors.bg} text-white font-semibold rounded-lg shadow-md ${colors.hoverBg} focus:outline-none focus:ring-2 ${colors.ring} focus:ring-offset-2`}>Create</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CreateEventModal;