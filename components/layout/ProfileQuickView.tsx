import React from 'react';
import type { User } from '../../types';

interface ProfileQuickViewProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onEditProfile: () => void;
}

const ProfileQuickView: React.FC<ProfileQuickViewProps> = ({ isOpen, onClose, user, onEditProfile }) => {
    if (!isOpen) return null;

    const privacyColor = {
        public: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        friends: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
        private: 'bg-[--color-bg-tertiary] text-[--color-text-primary]',
    };
    const privacyText = {
        public: 'Public',
        friends: 'Friends',
        private: 'Private',
    };

    return (
        <>
            <div 
                onClick={onClose}
                className={`fixed inset-0 bg-black/40 z-[2000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                aria-hidden="true"
            />
            <div 
                className={`fixed top-4 left-4 z-[2010] w-full max-w-xs bg-[--color-bg-primary] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                style={{ transformOrigin: 'top left' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-quick-view-title"
            >
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 text-white text-center">
                    <div className="h-20 w-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-4xl font-bold text-white">{user.profile.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <h2 id="profile-quick-view-title" className="text-2xl font-bold">{user.profile.username}</h2>
                    <p className="text-sm opacity-90">{user.email}</p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-[--color-text-secondary] mb-1">Bio</h3>
                        <p className="text-[--color-text-primary] italic text-sm">
                            {user.profile.bio || 'No bio yet. Add one in the settings!'}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[--color-text-secondary] mb-1">Privacy</h3>
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${privacyColor[user.profile.privacy]}`}>
                            {privacyText[user.profile.privacy]}
                        </span>
                    </div>
                    <div className="pt-2">
                         <button 
                            onClick={onEditProfile}
                            className="w-full px-4 py-2 bg-[--color-accent-primary] text-[--color-text-on-accent] font-semibold rounded-lg shadow-md hover:bg-green-700 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:ring-offset-2 transition-colors duration-200"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileQuickView;