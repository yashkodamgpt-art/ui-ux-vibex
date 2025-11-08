import React from 'react';

interface HomeHeaderProps {
  // No props needed anymore
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between p-4 h-16 pointer-events-none">
      {/* Placeholder to keep logo centered */}
      <div className="h-10 w-10" aria-hidden="true"></div>
      
      {/* Logo */}
      <div className="bg-[--color-bg-primary]/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md pointer-events-auto">
        <h1 className="text-2xl font-bold">
          <span className="text-[--color-accent-primary]">Vibe</span>
          <span className="text-[--color-text-primary]">X</span>
        </h1>
      </div>

      {/* Placeholder for an action button like Search or Filter */}
      <div className="h-10 w-10" aria-hidden="true"></div>
    </header>
  );
};

export default HomeHeader;