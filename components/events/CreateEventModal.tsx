import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Session, SessionType, Tag, Friend, User } from '../../types';
import { containsOffensiveContent } from '../../lib/contentFilter'; // NEW

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => void;
    sessionType: SessionType | null;
    tags: Tag[];
    friends: Friend[];
    user: User;
}

const TITLE_MAX_CHARS = 50;
const DESC_MAX_CHARS = 150;

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
  borrow: { title: 'Borrow Request', emoji: '🤝', flow: 'seeking' as const, color: 'green', placeholder: "e.g., T-Square for class" },
};

const getCharLimitColors = (length: number, limit: number) => {
    if (length >= limit) return { text: 'text-[--color-error]', border: 'border-red-500 ring-red-500' };
    if (length >= limit - 20) return { text: 'text-orange-500', border: 'border-orange-400 ring-orange-400' };
    return { text: 'text-[--color-text-secondary]', border: 'border-[--color-border]' };
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit, sessionType, tags, friends, user }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventTimeOffset, setEventTimeOffset] = useState(5);
    const [duration, setDuration] = useState(60);
    const [error, setError] = useState('');
    const [errorField, setErrorField] = useState<string | null>(null);
    const [selectedEmoji, setSelectedEmoji] = useState('');
    const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState<string[]>([]);
    
    // Vibe specific
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    
    // Seek/Cookie specific
    const [helpCategory, setHelpCategory] = useState<'Academic' | 'Project' | 'Tech' | 'General'>('General');
    const [skillTag, setSkillTag] = useState('');
    const [expectedOutcome, setExpectedOutcome] = useState('');

    // Borrow specific
    const [returnTime, setReturnTime] = useState('');
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Low');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && sessionType) {
            const now = new Date();
            const defaultReturnDate = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Default to 3 hours from now
            const formattedDateTime = defaultReturnDate.toISOString().slice(0, 16);

            // Reset common fields
            setTitle(''); setDescription(''); setEventTimeOffset(5);
            setDuration(60); setError(''); setErrorField(null); setSelectedEmoji(sessionConfigs[sessionType].emoji);
            
            // Reset Vibe fields
            setPrivacy('public'); setSelectedTagIds([]);

            // Reset Seek/Cookie fields
            setHelpCategory('General');
            setSkillTag(user.profile.expertise[0] || '');
            setExpectedOutcome('');

            // Reset Borrow fields
            setReturnTime(formattedDateTime);
            setUrgency('Low');
            
            // Auto-focus first input
            setTimeout(() => titleInputRef.current?.focus(), 150);
        }
    }, [isOpen, sessionType, user.profile.expertise]);
    
    const uniqueFriendsCount = useMemo(() => {
        if (privacy === 'public') return friends.length;
        const memberSet = new Set<string>();
        tags.filter(tag => selectedTagIds.includes(tag.id)).forEach(tag => { tag.memberIds.forEach(memberId => memberSet.add(memberId)); });
        return memberSet.size;
    }, [selectedTagIds, tags, privacy, friends]);

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(emoji);
        setRecentlyUsedEmojis(prev => { const filtered = prev.filter(e => e !== emoji); const updated = [emoji, ...filtered]; return updated.slice(0, 5); });
    };
    
    const handleToggleTag = (tagId: string) => { setSelectedTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setError(''); setErrorField(null);
        if (!title.trim()) { setError('Please provide a title.'); setErrorField('title'); return; }
        if (!sessionType) { setError('A session type must be selected.'); return; }
        
        if (containsOffensiveContent(title)) { setError('Please use appropriate language in the title.'); setErrorField('title'); return; }
        if (containsOffensiveContent(description)) { setError('Please use appropriate language in the description.'); setErrorField('description'); return; }
        
        if (sessionType === 'vibe' && privacy === 'private' && selectedTagIds.length === 0) { setError('Please select at least one tag for a private vibe.'); return; }
        if (sessionType === 'cookie' && !skillTag) { setError('Please select a skill tag for your Cookie session.'); return; }
        if (sessionType === 'borrow') {
            if (!returnTime) { setError('Please set a return time.'); return; }
            if (new Date(returnTime) <= new Date()) { setError('Return time must be in the future.'); return; }
        }

        setIsSubmitting(true);
        const eventTime = new Date(Date.now() + eventTimeOffset * 60 * 1000).toISOString();
        const config = sessionConfigs[sessionType];
        const creatorRole = (sessionType === 'seek' || sessionType === 'borrow') ? 'seeking' : 'offering';

        setTimeout(() => { // Simulate network delay
            onSubmit({
                title, description, event_time: eventTime, duration, status: 'active', sessionType, emoji: selectedEmoji,
                privacy: sessionType === 'vibe' ? privacy : 'public',
                visibleToTags: sessionType === 'vibe' && privacy === 'private' ? selectedTagIds : undefined,
                helpCategory: sessionType === 'seek' ? helpCategory : undefined,
                skillTag: sessionType === 'cookie' ? skillTag : undefined,
                expectedOutcome: sessionType === 'cookie' ? expectedOutcome : undefined,
                returnTime: sessionType === 'borrow' ? new Date(returnTime).toISOString() : undefined,
                urgency: sessionType === 'borrow' ? urgency : undefined,
                participantRoles: { [user.id]: creatorRole },
            });
            setIsSubmitting(false);
        }, 500);
    };

    if (!isOpen || !sessionType) return null;

    // FIX: Define currentEmojiList based on the sessionType prop.
    const currentEmojiList = emojiLists[sessionType];

    const config = sessionConfigs[sessionType];
    const colors = {
      purple: { ring: 'focus:ring-purple-500', bg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700', text: 'text-purple-600', border: 'border-purple-500' },
      blue: { ring: 'focus:ring-blue-500', bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700', text: 'text-blue-600', border: 'border-blue-500' },
      orange: { ring: 'focus:ring-orange-500', bg: 'bg-orange-600', hoverBg: 'hover:bg-orange-700', text: 'text-orange-600', border: 'border-orange-500' },
      green: { ring: 'focus:ring-green-600', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700', text: 'text-green-600', border: 'border-green-600' },
    }[config.color];

    const titleColors = getCharLimitColors(title.length, TITLE_MAX_CHARS);
    const descColors = getCharLimitColors(description.length, DESC_MAX_CHARS);
    const isFormValid = title.trim().length > 0;

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" aria-hidden="true" />
            <div className={`fixed inset-0 z-[2010] flex items-end sm:items-center justify-center p-0 sm:p-4 ${isOpen ? '' : 'pointer-events-none'}`} role="dialog" aria-modal="true" aria-labelledby="create-event-title">
                <form onSubmit={handleSubmit} className={`w-full max-w-lg bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] flex flex-col modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <h2 id="create-event-title" className="text-2xl font-bold text-[--color-text-primary]">{config.title}</h2>
                    {error && <p className="text-[--color-error] text-sm">{error}</p>}
                    
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                        <div>
                            <label className="text-sm font-medium text-[--color-text-secondary]">Choose an Emoji</label>
                            <div className="mt-2 space-y-3">
                                {recentlyUsedEmojis.length > 0 && (<div><h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-1">Recent</h3><div className="horizontal-snap flex gap-2 pb-2">{recentlyUsedEmojis.map(emoji => (<button type="button" key={`recent-${emoji}`} onClick={() => handleEmojiSelect(emoji)} className={`flex-shrink-0 w-12 h-12 text-2xl rounded-lg flex items-center justify-center transition-all ${selectedEmoji === emoji ? `border-2 ${colors.border} bg-purple-100 dark:bg-purple-500/20` : 'bg-[--color-bg-tertiary] hover:bg-[--color-border]'}`}>{emoji}</button>))}</div></div>)}
                                <div><h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-1">{config.title} Emojis</h3><div className="horizontal-snap flex gap-2 pb-2">{currentEmojiList.map(emoji => (<button type="button" key={emoji} onClick={() => handleEmojiSelect(emoji)} className={`flex-shrink-0 w-12 h-12 text-2xl rounded-lg flex items-center justify-center transition-all ${selectedEmoji === emoji ? `border-2 ${colors.border} bg-purple-100 dark:bg-purple-500/20` : 'bg-[--color-bg-tertiary] hover:bg-[--color-border]'}`}>{emoji}</button>))}</div></div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="title" className="text-sm font-medium text-[--color-text-secondary]">{sessionType === 'borrow' ? 'Item Name' : 'Title'}</label>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-3xl">{selectedEmoji}</span>
                                <input ref={titleInputRef} id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={TITLE_MAX_CHARS} required className={`block w-full px-4 py-2 bg-[--color-bg-tertiary] border rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring} ${errorField === 'title' ? 'border-red-500' : titleColors.border}`} placeholder={config.placeholder} style={{fontSize: '16px'}} />
                            </div>
                            <p className={`text-right text-xs mt-1 ${titleColors.text}`}>{title.length}/{TITLE_MAX_CHARS}</p>
                        </div>

                        <div>
                            <label htmlFor="description" className="text-sm font-medium text-[--color-text-secondary]">{sessionType === 'borrow' ? 'Reason (Optional)' : 'Description (Optional)'}</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} maxLength={DESC_MAX_CHARS} className={`mt-1 block w-full px-4 py-2 bg-[--color-bg-tertiary] border rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring} ${errorField === 'description' ? 'border-red-500' : descColors.border}`} rows={2} placeholder="Add a few details..." style={{fontSize: '16px'}}></textarea>
                            <p className={`text-right text-xs mt-1 ${descColors.text}`}>{description.length}/{DESC_MAX_CHARS}</p>
                        </div>
                        
                        {sessionType === 'vibe' && (
                          <div className="p-3 bg-[--color-bg-secondary] rounded-lg space-y-3">
                            <div>
                              <label className="text-sm font-medium text-[--color-text-secondary] mb-2 block">Visibility</label>
                              <div className="flex rounded-lg bg-[--color-bg-tertiary] p-1">
                                <button type="button" onClick={() => setPrivacy('public')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${privacy === 'public' ? 'bg-[--color-bg-primary] text-[--color-text-primary] shadow-sm' : 'bg-transparent text-[--color-text-secondary]'}`}>Public</button>
                                <button type="button" onClick={() => setPrivacy('private')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${privacy === 'private' ? 'bg-[--color-bg-primary] text-[--color-text-primary] shadow-sm' : 'bg-transparent text-[--color-text-secondary]'}`}>Private</button>
                              </div>
                              {privacy === 'private' && (
                                <div className="mt-3">
                                  <label className="text-sm font-medium text-[--color-text-secondary]">Visible to Tags</label>
                                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-[--color-border] rounded-lg p-2 bg-[--color-bg-primary]">{tags.map(tag => (
                                    <label key={tag.id} className="flex items-center p-2 rounded-lg hover:bg-[--color-bg-secondary] cursor-pointer">
                                      <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => handleToggleTag(tag.id)} className="h-4 w-4 rounded text-green-600 border-[--color-border] focus:ring-[--color-accent-primary]" />
                                      <span className="ml-3 flex items-center text-sm"><span className="mr-2">{tag.emoji}</span><span className="font-semibold">{tag.name}</span><span className="text-[--color-text-secondary] ml-1">({tag.memberIds.length})</span></span>
                                    </label>
                                  ))}</div>
                                  <p className="text-xs text-[--color-text-secondary] mt-1 text-center">Visible to {uniqueFriendsCount} friends.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {sessionType === 'seek' && ( <div className="p-3 bg-[--color-bg-secondary] rounded-lg"> <label htmlFor="helpCategory" className="text-sm font-medium text-[--color-text-secondary] mb-2 block">Help Category</label> <select id="helpCategory" value={helpCategory} onChange={e => setHelpCategory(e.target.value as any)} className={`block w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring}`} style={{fontSize: '16px'}}> <option>General</option><option>Academic</option><option>Project</option><option>Tech</option> </select> </div> )}
                        {sessionType === 'cookie' && ( <div className="p-3 bg-[--color-bg-secondary] rounded-lg space-y-3"> <div><label htmlFor="skillTag" className="text-sm font-medium text-[--color-text-secondary] mb-2 block">Skill Tag</label><select id="skillTag" value={skillTag} onChange={e => setSkillTag(e.target.value)} className={`block w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring}`} style={{fontSize: '16px'}}>{user.profile.expertise.length > 0 ? user.profile.expertise.map(skill => <option key={skill}>{skill}</option>) : <option disabled>Add skills in your profile!</option>}</select></div> <div><label htmlFor="expectedOutcome" className="text-sm font-medium text-[--color-text-secondary]">Expected Outcome (Optional)</label><input id="expectedOutcome" type="text" value={expectedOutcome} onChange={e => setExpectedOutcome(e.target.value)} className={`mt-1 block w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring}`} placeholder="e.g., You'll be able to build a simple web page" style={{fontSize: '16px'}}/></div> </div> )}

                        {sessionType === 'borrow' && ( <div className="p-3 bg-[--color-bg-secondary] rounded-lg space-y-3"> <div> <label htmlFor="returnTime" className="text-sm font-medium text-[--color-text-secondary]">Return By</label> <input id="returnTime" type="datetime-local" value={returnTime} onChange={e => setReturnTime(e.target.value)} className={`mt-1 block w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring}`} style={{fontSize: '16px'}}/> </div> <div> <label htmlFor="urgency" className="text-sm font-medium text-[--color-text-secondary]">Urgency</label> <select id="urgency" value={urgency} onChange={e => setUrgency(e.target.value as any)} className={`mt-1 block w-full px-4 py-2 bg-[--color-bg-primary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${colors.ring}`} style={{fontSize: '16px'}}> <option>Low</option> <option>Medium</option> <option>High</option> </select> </div> </div> )}

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div><span className="text-sm font-medium text-[--color-text-secondary]">When?</span><div className="mt-2 flex flex-wrap gap-2">{[5, 10, 15, 30].map(min => (<button type="button" key={min} onClick={() => setEventTimeOffset(min)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${eventTimeOffset === min ? `${colors.bg} text-white` : 'bg-[--color-bg-tertiary] text-[--color-text-secondary] hover:bg-[--color-border]'}`}>In {min}m</button>))}</div></div>
                            <div><span className="text-sm font-medium text-[--color-text-secondary]">For how long?</span><div className="mt-2 flex flex-wrap gap-2">{[30, 60, 90, 120].map(d => (<button type="button" key={d} onClick={() => setDuration(d)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${duration === d ? `${colors.bg} text-white` : 'bg-[--color-bg-tertiary] text-[--color-text-secondary] hover:bg-[--color-border]'}`}>{d < 60 ? `${d}m` : `${d / 60}h`}</button>))}</div></div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 flex-shrink-0 pt-2 border-t border-[--color-border]">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
                        <button type="submit" disabled={!isFormValid || isSubmitting} className={`px-6 py-2 ${colors.bg} text-white font-semibold rounded-lg shadow-md ${colors.hoverBg} focus:outline-none focus:ring-2 ${colors.ring} focus:ring-offset-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed`}>
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default React.memo(CreateEventModal);