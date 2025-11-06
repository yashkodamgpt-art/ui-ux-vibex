import React, { useState } from 'react';
import type { Profile, Vouch } from '../../types';

interface CookieScoreDashboardProps {
  profile: Profile;
}

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
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="p-4 pt-2 space-y-4 border-t border-gray-200">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Vouch History Row
const VouchRow: React.FC<{ vouch: Vouch }> = ({ vouch }) => {
    const formattedDate = new Date(vouch.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
            <div>
                <p className="font-semibold text-gray-700">{vouch.voucherUsername} <span className="font-normal text-gray-500">vouched for</span> {vouch.skill}</p>
                <p className="text-xs text-gray-400">{formattedDate}</p>
            </div>
            <span className="font-bold text-green-600">+{vouch.points} 🍪</span>
        </div>
    );
};

const CookieScoreDashboard: React.FC<CookieScoreDashboardProps> = ({ profile }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  
  // FIX: Changed sort function to use index access (b[1] - a[1]) to resolve TypeScript error.
  // This helps the compiler correctly infer the types for the arithmetic operation.
  const sortedSkills = Object.entries(profile.skillScores || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 space-y-4">
      {/* Total Score Display */}
      <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-2xl shadow-lg text-center">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Your Cookie Score</h3>
        <p className="text-6xl font-extrabold my-2">
          <span className="mr-2">🍪</span>
          {profile.cookieScore}
        </p>
        <p className="opacity-80">Keep up the great work!</p>
      </div>

      {/* Skill Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Score Breakdown</h3>
        <div className="space-y-2">
            {sortedSkills.length > 0 ? sortedSkills.map(([skill, score]) => (
                <div key={skill} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{skill}</span>
                    </div>
                    <span className="font-bold text-green-700">{score} 🍪</span>
                </div>
            )) : (
                <p className="text-sm text-gray-500 text-center py-4">No scores yet. Help others in Cookie sessions to earn points!</p>
            )}
        </div>
      </div>
      
      {/* Vouching History */}
      <AccordionSection title="Recent Vouches" sectionId="vouches" openSection={openSection} setOpenSection={setOpenSection}>
          {profile.vouchHistory && profile.vouchHistory.length > 0 ? (
            <div className="space-y-1">
                {profile.vouchHistory.slice(0, 10).map(vouch => <VouchRow key={vouch.id} vouch={vouch} />)}
                {profile.vouchHistory.length > 10 && <button className="w-full text-center text-sm font-semibold text-green-600 mt-2 hover:underline">View all</button>}
            </div>
          ) : (
             <p className="text-sm text-gray-500 text-center py-4">No one has vouched for you yet.</p>
          )}
      </AccordionSection>

      {/* How it Works */}
      <AccordionSection title="How Vouching Works" sectionId="how-it-works" openSection={openSection} setOpenSection={setOpenSection}>
          <div className="text-sm text-gray-600 space-y-3">
            <p>When someone joins your <span className="font-bold text-orange-600">Cookie session</span>, they get an option to vouch for your skill after the session ends.</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><span className="font-bold">1st vouch</span> from a user = <span className="font-bold text-green-600">10 🍪</span></li>
                <li><span className="font-bold">2nd vouch</span> from the same user = <span className="font-bold text-green-600">8 🍪</span></li>
                <li><span className="font-bold">3rd vouch</span> = <span className="font-bold text-green-600">6 🍪</span></li>
                <li><span className="font-bold">4th vouch</span> = <span className="font-bold text-green-600">4 🍪</span></li>
                <li><span className="font-bold">5th vouch</span> = <span className="font-bold text-green-600">2 🍪</span></li>
            </ul>
            <p>After 5 vouches for the same skill from the same person, you won't get more points from them for that skill.</p>
            <p className="font-semibold text-gray-700">A higher Cookie Score boosts the visibility of your sessions!</p>
          </div>
      </AccordionSection>
    </div>
  );
};

export default CookieScoreDashboard;