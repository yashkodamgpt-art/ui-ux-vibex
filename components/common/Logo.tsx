
import React from 'react';

const Logo: React.FC = () => {
  return (
    <h1 className="text-3xl font-bold text-center">
      {/* // TODO: Add dark mode variant */}
      <span style={{ color: 'var(--color-accent-primary)' }}>Vibe</span>
      <span style={{ color: 'var(--color-text-primary)' }}>x</span>
    </h1>
  );
};

export default Logo;