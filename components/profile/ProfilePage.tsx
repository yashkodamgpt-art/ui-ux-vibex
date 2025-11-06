import React, { useState, useEffect } from 'react';
import type { User, Profile, Session } from '../../types';
import CookieScoreDashboard from './CookieScoreDashboard';
import SessionHistory from './SessionHistory';

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
  sessions: Session[];
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <button type="button" onClick={() => setOpenSection(isOpen ? null : sectionId)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <svg className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                <div className="p-4 pt-2 border-t border-gray-200">
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
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
            } ${disabled && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            {label}
        </button>
    );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onProfileUpdate, sessions }) => {
  const [profileData, setProfileData] = useState<Profile>(user.profile);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('history');

  useEffect(() => {
    setProfileData(user.profile);
  }, [user]);
  
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

  const handleSave = () => {
    setIsSaving(true);
    setShowSuccess(false);
    // Simulate network delay
    setTimeout(() => {
        onProfileUpdate(profileData);
        setIsSaving(false);
        setShowSuccess(true);
        // After 1.5s, hide the success message and revert to text
        setTimeout(() => {
            setShowSuccess(false);
        }, 1500);
    }, 1000); // 1s save spinner
  };
  
  const initial = user.profile.username.charAt(0).toUpperCase();
  const bioColors = getCharLimitColors(profileData.bio.length, BIO_MAX_CHARS);

  return (
    <div className="pb-24"> {/* Padding bottom for fixed save button */}
      {/* Header */}
      <div className="p-4 pt-6 text-center">
          <div className="h-24 w-24 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-md">
              <span className="text-5xl font-bold text-green-700">{initial}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{user.profile.username}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{user.profile.branch}</span>
              <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Class of {user.profile.year}</span>
          </div>
      </div>

      <CookieScoreDashboard profile={user.profile} />

      <div className="p-4 space-y-4">
          <AccordionSection title="Session History & Stats" sectionId="history" openSection={openSection} setOpenSection={setOpenSection}>
            <SessionHistory user={user} allSessions={sessions} />
          </AccordionSection>
      
          <AccordionSection title="Edit Personal Info" sectionId="personal" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                {/* Branch & Year */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <select id="branch" name="branch" value={profileData.branch} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                        <select id="year" name="year" value={profileData.year} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea id="bio" name="bio" value={profileData.bio} onChange={handleChange} maxLength={BIO_MAX_CHARS} rows={4} className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${bioColors.border}`} placeholder="Tell us a little about yourself..." style={{fontSize: '16px'}}></textarea>
                    <p className={`text-right text-xs mt-1 ${bioColors.text}`}>{profileData.bio.length}/{BIO_MAX_CHARS}</p>
                </div>

                {/* Privacy */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Privacy</label>
                    <div className="space-y-2">
                        {(['public', 'friends', 'private'] as const).map(p => (
                            <label key={p} className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${profileData.privacy === p ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}>
                                <input type="radio" name="privacy" value={p} checked={profileData.privacy === p} onChange={() => handlePrivacyChange(p)} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                                <span className="ml-3 text-sm font-semibold text-gray-800 capitalize">{p}</span>
                            </label>
                        ))}
                    </div>
                </div>
              </div>
          </AccordionSection>

          <AccordionSection title="Edit Expertise" sectionId="expertise" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select up to 5 skills you're good at. This helps others find you for Cookie sessions!</p>
                {Object.entries(expertiseData).map(([category, skills]) => (
                    <div key={category}>
                        <h4 className="text-md font-bold text-gray-700 mb-2 pt-2 border-t border-gray-100 first:pt-0 first:border-t-0">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <SelectionTile key={skill} label={skill} isSelected={profileData.expertise.includes(skill)} onToggle={() => handleExpertiseToggle(skill)} disabled={profileData.expertise.length >= 5 && !profileData.expertise.includes(skill)} />
                            ))}
                        </div>
                    </div>
                ))}
                {profileData.expertise.length >= 5 && (
                    <p className="text-xs text-center text-blue-600 mt-2">Maximum reached. Deselect to choose others.</p>
                )}
              </div>
          </AccordionSection>
          
          <AccordionSection title="Edit Interests" sectionId="interests" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select up to 8 interests. This helps in finding like-minded people for Vibes.</p>
                {Object.entries(interestsData).map(([category, interestsList]) => (
                    <div key={category}>
                        <h4 className="text-md font-bold text-gray-700 mb-2 pt-2 border-t border-gray-100 first:pt-0 first:border-t-0">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                            {interestsList.map(interest => (
                                <SelectionTile key={interest} label={interest} isSelected={profileData.interests.includes(interest)} onToggle={() => handleInterestsToggle(interest)} disabled={profileData.interests.length >= 8 && !profileData.interests.includes(interest)} />
                            ))}
                        </div>
                    </div>
                ))}
                 {profileData.interests.length >= 8 && (
                    <p className="text-xs text-center text-blue-600 mt-2">Maximum reached. Deselect to choose others.</p>
                )}
              </div>
          </AccordionSection>
      </div>
      
      {/* Save Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <button
            onClick={handleSave}
            disabled={isSaving || showSuccess}
            className="w-full h-12 flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-green-400"
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