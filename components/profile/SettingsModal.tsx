
import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (updatedProfile: User['profile']) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [bio, setBio] = useState('');
    const [privacy, setPrivacy] = useState<User['profile']['privacy']>('public');
    const bioInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (user && isOpen) {
            setBio(user.profile.bio);
            setPrivacy(user.profile.privacy);
            setTimeout(() => bioInputRef.current?.focus(), 150);
        }
    }, [user, isOpen]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Spread the existing profile to ensure all fields are passed, then override the changed ones.
        onSave({ ...user.profile, bio, privacy });
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                onClick={onClose}
                className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" 
                aria-hidden="true"
            />
            <div 
                className={`fixed inset-0 z-[2010] flex items-end sm:items-center justify-center p-0 sm:p-4 ${isOpen ? '' : 'pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
            >
                <form onSubmit={handleSave} className={`w-full max-w-lg bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 sm:p-8 space-y-6 modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <h2 id="settings-title" className="text-2xl font-bold text-[--color-text-primary]">Profile & Settings</h2>
                    
                    <div>
                        <label htmlFor="bio" className="text-sm font-medium text-[--color-text-secondary]">Your Bio</label>
                        <textarea ref={bioInputRef} id="bio" value={bio} onChange={e => setBio(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]" rows={3} placeholder="Tell others a little about yourself..." style={{fontSize: '16px'}}></textarea>
                    </div>

                    <div>
                        <span className="text-sm font-medium text-[--color-text-secondary]">Profile Privacy</span>
                        <div className="mt-2 space-y-2">
                           { (['public', 'friends', 'private'] as const).map(p => (
                             <label key={p} className="flex items-center p-3 bg-[--color-bg-tertiary] rounded-lg hover:bg-[--color-border] cursor-pointer">
                                <input type="radio" name="privacy" value={p} checked={privacy === p} onChange={() => setPrivacy(p)} className="h-4 w-4 text-[--color-accent-primary] border-[--color-border] focus:ring-[--color-accent-primary]" />
                                <span className="ml-3 text-sm text-[--color-text-primary] capitalize">{p}</span>
                            </label>
                           ))}
                        </div>
                         <p className="mt-2 text-xs text-[--color-text-secondary]">
                            {privacy === 'public' && 'Anyone can view your profile.'}
                            {privacy === 'friends' && 'Only friends can view your profile.'}
                            {privacy === 'private' && 'Only you can see your profile.'}
                        </p>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-[--color-border]">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-[--color-accent-primary] text-[--color-text-on-accent] font-semibold rounded-lg shadow-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:ring-offset-2">Save Changes</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default SettingsModal;