
import React from 'react';
import type { User } from '../../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToView: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userToView }) => {
    if (!isOpen) return null;

    // FIX: The 'community' privacy option does not exist. Only 'public' profiles are viewable.
    const canViewProfile = userToView.profile.privacy === 'public';

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
                aria-labelledby="profile-title"
            >
                <div className={`w-full max-w-md bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 sm:p-8 space-y-4 text-center modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex justify-center">
                         <div className="h-20 w-20 bg-[--color-accent-primary]/20 rounded-full flex items-center justify-center">
                             <span className="text-3xl font-bold text-[--color-accent-primary]">{userToView.profile.username.charAt(0).toUpperCase()}</span>
                         </div>
                    </div>

                    <h2 id="profile-title" className="text-2xl font-bold text-[--color-text-primary]">{userToView.profile.username}</h2>
                    
                    <div className="py-4 border-t border-b border-[--color-border]">
                        {canViewProfile ? (
                            <p className="text-[--color-text-secondary] italic">
                                {userToView.profile.bio || 'This user hasn\'t set a bio yet.'}
                            </p>
                        ) : (
                            <p className="text-[--color-text-secondary] bg-[--color-bg-tertiary] p-3 rounded-lg">
                                This user's profile is private.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <button type="button" onClick={onClose} className="px-8 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Close</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileModal;