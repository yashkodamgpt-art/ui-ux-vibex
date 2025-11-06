import React from 'react';
import type { User } from '../../types';

interface HomeHeaderProps {
  user: User;
  onOpenProfile: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ user, onOpenProfile }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between p-4 h-16 pointer-events-none">
      {/* Profile button */}
      <button 
        onClick={onOpenProfile} 
        className="h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform pointer-events-auto"
        aria-label="Open profile quick view"
      >
        <div className="h-full w-full rounded-full bg-green-200 flex items-center justify-center">
            <span className="text-xl font-bold text-green-700">{user.profile.username.charAt(0).toUpperCase()}</span>
        </div>
      </button>
      
      {/* Logo */}
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md pointer-events-auto">
        <h1 className="text-2xl font-bold">
          <span className="text-green-600">Vibe</span>
          <span className="text-black">X</span>
        </h1>
      </div>

      {/* Placeholder for an action button like Search or Filter */}
      <div className="h-10 w-10" aria-hidden="true"></div>
    </header>
  );
};

export default HomeHeader;
