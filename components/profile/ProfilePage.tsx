import React, { useState, useEffect } from 'react';
import type { User, Profile, Session, Vouch } from '../../types';
import CookieScoreDashboard from './CookieScoreDashboard';
import SessionHistory from './SessionHistory';
import * as supabaseService from '../../lib/supabaseService';

// Data for selectors
const branches = ['Computer Science', 'Electrical Eng.', 'Mechanical Eng.', 'Chemical Eng.', 'Civil Eng.', 'Materials Sci.', 'Physics', 'Mathematics', 'Chemistry'];
const years = [2028, 2027, 2026, 2025, 2024, 2023, 2022];
const BIO_MAX_CHARS = 200;

const expertiseData = {
  "Programming": ["Python", "Java", "C++", "JavaScript", "React", "Node.js"],
  "Design": ["CAD", "3D Modeling", "Graphic Design", "UI/UX"],
  "Academic": ["Math", "Physics", "Chemistry", "Biology"],
  "Creative": ["Music", "Art", "Writing", "Guitar"],
};

const interestsData = {
    "Sports": ["Chess", "Football", "Badminton", "Cricket", "Basketball", "Tennis"],
    "Entertainment": ["Movies", "Gaming", "Music", "Anime"],
    "Hobbies": ["Reading", "Cooking", "Photography", "Hiking", "Gardening"],
};

interface ProfilePageProps {
  user: User;
  onProfileUpdate: (profile: Profile) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const getCharLimitColors = (length: number, limit: number) => {
    if (length >= limit) return { text: 'text-red-600', border: 'border-red-500 focus:ring-red-500' };
    if (length >= limit - 20) return { text: 'text-orange-500', border: 'border-orange-400 focus:ring-orange-400' };
    return { text: 'text-gray-500', border: 'border-gray-300 focus:ring-green-500' };
};

// Reusable Accordion Component
const AccordionSection: React.FC<{title: string; sectionId: string; openSection: string | null; setOpenSection: (id: string | null) => void; children: React.ReactNode;}> = ({ title, sectionId, openSection, setOpenSection, children }) => {
    const isOpen = openSection === sectionId;
    return (
        <div className="bg-[--color-bg-primary] rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <button type="button" onClick={() => setOpenSection(isOpen ? null : sectionId)} className="w-full p-4 flex justify-between items-center bg-[--color-bg-primary] hover:bg-[--color-bg-tertiary] transition-colors">
                <h3 className="text-lg font-bold text-[--color-text-primary]">{title}</h3>
                <svg className={`h-6 w-6 text-[--color-text-secondary] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                <div className="p-4 pt-2 border-t border-[--color-border]">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Reusable Tile Component for multi-select
const SelectionTile: React.FC<{label: string; isSelected: boolean; onToggle: () => void; disabled?: boolean;}> = ({ label, isSelected, onToggle, disabled }) => {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-all duration-200 ease-in-out ${
                isSelected
                    ? 'bg-[--color-accent-primary] text-[--color-text-on-accent] border-[--color-accent-primary] shadow-sm'
                    : 'bg-[--color-bg-primary] text-[--color-text-primary] border-[--color-border] hover:border-[--color-accent-primary]'
            } ${disabled && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            {label}
        </button>
    );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onProfileUpdate, theme, setTheme }) => {
  const [profileData, setProfileData] = useState<Profile>(user.profile);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('settings');

  // FIX: Separated useEffect hooks to prevent race conditions when updating the profile.

  // Effect 1: Sync local profile data with the user prop from App.tsx.
  // This ensures optimistic updates (like from vouching) are reflected immediately.
  useEffect(() => {
    setProfileData(user.profile);
  }, [user.profile]);

  // Effect 2: Fetch vouch history from the database.
  // This runs only when the user ID changes (i.e., on initial load) to avoid
  // re-fetching and potentially overwriting optimistically updated state.
  useEffect(() => {
    const loadVouchHistory = async () => {
        const { data, error } = await supabaseService.fetchUserVouchHistory(user.id);
        if (!error && data) {
            // Update only the vouch history part of the state, preserving other fields
            // that might have been optimistically updated (like cookieScore).
            setProfileData(prev => ({
                ...prev,
                vouchHistory: data,
            }));
        }
    };
    loadVouchHistory();
  }, [user.id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) : value }));
  };

  const handlePrivacyChange = (value: Profile['privacy']) => {
      setProfileData(prev => ({...prev, privacy: value}));
  };
  
  const handleExpertiseToggle = (skill: string) => {
      setProfileData(prev => {
          const currentExpertise = prev.expertise || [];
          const newExpertise = currentExpertise.includes(skill)
              ? currentExpertise.filter(s => s !== skill)
              : [...currentExpertise, skill];
          if (newExpertise.length > 5) return prev;
          return { ...prev, expertise: newExpertise };
      });
  };

  const handleInterestsToggle = (interest: string) => {
       setProfileData(prev => {
          const currentInterests = prev.interests || [];
          const newInterests = currentInterests.includes(interest)
              ? currentInterests.filter(i => i !== interest)
              : [...currentInterests, interest];
          if (newInterests.length > 8) return prev;
          return { ...prev, interests: newInterests };
      });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setShowSuccess(false);

    const { data, error } = await supabaseService.updateUserProfile(user.id, profileData);

    setIsSaving(false);
    
    if (error || !data || data.length === 0) {
      console.error("Failed to update profile", error);
      // Ideally, show an error toast to the user
      return;
    }
    
    onProfileUpdate(data[0]);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
  };
  
  const initial = user.profile.username.charAt(0).toUpperCase();
  const bioColors = getCharLimitColors(profileData.bio.length, BIO_MAX_CHARS);

  return (
    <div className="pb-24"> {/* Padding bottom for fixed save button */}
      {/* Header */}
      <div className="p-4 pt-6 text-center">
          <div className="h-24 w-24 bg-[--color-bg-tertiary] rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-[--color-bg-primary] shadow-md">
              <span className="text-5xl font-bold text-[--color-accent-primary]">{initial}</span>
          </div>
          <h2 className="text-2xl font-bold text-[--color-text-primary]">{user.profile.username}</h2>
          <p className="text-sm text-[--color-text-secondary]">{user.email}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold bg-[--color-bg-tertiary] text-[--color-text-primary] px-2 py-1 rounded-full">{user.profile.branch}</span>
              <span className="text-xs font-semibold bg-[--color-bg-tertiary] text-[--color-text-primary] px-2 py-1 rounded-full">Class of {user.profile.year}</span>
          </div>
      </div>

      <CookieScoreDashboard profile={profileData} />

      <div className="p-4 space-y-4">
        <AccordionSection title="App Settings" sectionId="settings" openSection={openSection} setOpenSection={setOpenSection}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[--color-text-secondary] mb-2">
              Theme
            </label>
            <div className="flex w-full rounded-lg bg-[--color-bg-tertiary] p-1.5">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`w-1/3 py-2 text-sm font-semibold rounded-md transition-colors ${
                    theme === mode
                      ? 'bg-[--color-bg-primary] text-[--color-text-primary] shadow-sm'
                      : 'bg-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'
                  }`}
                >
                  <span className="capitalize">{mode}</span>
                </button>
              ))}
            </div>
          </div>
        </AccordionSection>

          <AccordionSection title="Session History & Stats" sectionId="history" openSection={openSection} setOpenSection={setOpenSection}>
            <SessionHistory user={user} />
          </AccordionSection>
      
          <AccordionSection title="Edit Personal Info" sectionId="personal" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                {/* Branch & Year */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-[--color-text-secondary] mb-1">Branch</label>
                        <select id="branch" name="branch" value={profileData.branch} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]">
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-[--color-text-secondary] mb-1">Graduation Year</label>
                        <select id="year" name="year" value={profileData.year} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-[--color-text-secondary] mb-1">Bio</label>
                    <textarea id="bio" name="bio" value={profileData.bio} onChange={handleChange} maxLength={BIO_MAX_CHARS} rows={4} className={`w-full px-4 py-2 bg-[--color-bg-tertiary] border rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 ${bioColors.border.replace('focus:ring-green-500', 'focus:ring-[--color-accent-primary]')}`} placeholder="Tell us a little about yourself..." style={{fontSize: '16px'}}></textarea>
                    <p className={`text-right text-xs mt-1 ${bioColors.text}`}>{profileData.bio.length}/{BIO_MAX_CHARS}</p>
                </div>

                {/* Privacy */}
                <div>
                    <label className="block text-sm font-medium text-[--color-text-secondary] mb-2">Profile Privacy</label>
                    <div className="space-y-2">
                        {(['public', 'friends', 'private'] as const).map(p => (
                            <label key={p} className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${profileData.privacy === p ? 'bg-[--color-bg-tertiary] border-[--color-accent-primary]' : 'bg-[--color-bg-primary] border-[--color-border] hover:border-[--color-text-secondary]'}`}>
                                <input type="radio" name="privacy" value={p} checked={profileData.privacy === p} onChange={() => handlePrivacyChange(p)} className="h-4 w-4 text-[--color-accent-primary] border-[--color-border] focus:ring-[--color-accent-primary] bg-transparent" />
                                <span className="ml-3 text-sm font-semibold text-[--color-text-primary] capitalize">{p}</span>
                            </label>
                        ))}
                    </div>
                </div>
              </div>
          </AccordionSection>

          <AccordionSection title="Edit Expertise" sectionId="expertise" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                <p className="text-sm text-[--color-text-secondary]">Select up to 5 skills you're good at. This helps others find you for Cookie sessions!</p>
                {Object.entries(expertiseData).map(([category, skills]) => (
                    <div key={category}>
                        <h4 className="text-md font-bold text-[--color-text-primary] mb-2 pt-2 border-t border-[--color-border] first:pt-0 first:border-t-0">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <SelectionTile key={skill} label={skill} isSelected={profileData.expertise.includes(skill)} onToggle={() => handleExpertiseToggle(skill)} disabled={profileData.expertise.length >= 5 && !profileData.expertise.includes(skill)} />
                            ))}
                        </div>
                    </div>
                ))}
                {profileData.expertise.length >= 5 && (
                    <p className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2">Maximum reached. Deselect to choose others.</p>
                )}
              </div>
          </AccordionSection>
          
          <AccordionSection title="Edit Interests" sectionId="interests" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                <p className="text-sm text-[--color-text-secondary]">Select up to 8 interests. This helps in finding like-minded people for Vibes.</p>
                {Object.entries(interestsData).map(([category, interestsList]) => (
                    <div key={category}>
                        <h4 className="text-md font-bold text-[--color-text-primary] mb-2 pt-2 border-t border-[--color-border] first:pt-0 first:border-t-0">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                            {interestsList.map(interest => (
                                <SelectionTile key={interest} label={interest} isSelected={profileData.interests.includes(interest)} onToggle={() => handleInterestsToggle(interest)} disabled={profileData.interests.length >= 8 && !profileData.interests.includes(interest)} />
                            ))}
                        </div>
                    </div>
                ))}
                 {profileData.interests.length >= 8 && (
                    <p className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2">Maximum reached. Deselect to choose others.</p>
                )}
              </div>
          </AccordionSection>
      </div>
      
      {/* Save Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[--color-bg-primary]/80 backdrop-blur-sm border-t border-[--color-border]">
        <button
            onClick={handleSave}
            disabled={isSaving || showSuccess}
            className="w-full h-12 flex items-center justify-center px-6 py-3 bg-[--color-accent-primary] text-white font-semibold rounded-lg shadow-md hover:bg-green-700 dark:hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50"
        >
            {isSaving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : showSuccess ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                'Save Changes'
            )}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;