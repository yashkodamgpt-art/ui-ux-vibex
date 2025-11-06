
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from './types';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import MainApp from './MainApp';
// We keep the supabase import for other parts, but won't use it for auth here
import { supabase } from './lib/supabaseClient';

// --- NEW MOCK DATA IMPORT ---
import { MOCK_USER } from './lib/mockData';

type AuthView = 'login' | 'signup';

const App: React.FC = () => {
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  // This state is no longer used, but we keep it to avoid breaking <Login> and <SignUp>
  const [authView, setAuthView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(true);

  const userRef = useRef(currentUser);

  const setCurrentUser = useCallback((userOrUpdater: User | null | ((prevUser: User | null) => User | null)) => {
    if (typeof userOrUpdater === 'function') {
        _setCurrentUser(prevUser => {
            const newUser = userOrUpdater(prevUser);
            userRef.current = newUser;
            return newUser;
        });
    } else {
        userRef.current = userOrUpdater;
        _setCurrentUser(userOrUpdater);
    }
  }, []);

  // --- MOCK AUTHENTICATION ---
  // We've replaced the entire 'loadUserProfile' and 'useEffect' for auth
  // with a simple mock loader.
  useEffect(() => {
    setLoading(true);
    console.log('--- MOCK MODE ACTIVE ---');
    
    // Simulate a network delay, then log in as our MOCK_USER
    const mockLogin = setTimeout(() => {
      console.log(`📥 Loading MOCK_USER: ${MOCK_USER.profile.username}`);
      setCurrentUser(MOCK_USER);
      setLoading(false);
      console.log('✅ Mock user loaded.');
    }, 1000); // 1-second delay

    return () => clearTimeout(mockLogin);
  }, [setCurrentUser]); // We only run this once on mount
  
  // This is the real Supabase logout, which is fine to keep.
  // It will clear the (non-existent) session and we'll just reload the app.
  const handleLogout = useCallback(async () => {
    console.log('Logging out and clearing all storage...');
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    if (error) {
        console.error('Error during sign out:', error.message);
    }
    // Force a reload to go back to the mock login flow
    window.location.reload();
  }, []);

  
  // This function is still passed to MainApp, but it won't be called
  // until we build the real profile page. It's safe to keep.
  const handleProfileUpdate = async (updatedProfile: User['profile']) => {
      if (!currentUser) return;
      console.log('--- MOCK: Profile Update ---', updatedProfile);
      // In mock mode, we just update the state locally.
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          profile: updatedProfile,
        };
      });
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Mock Session...</p>
        </div>
      </div>
    );
  }

  // If mock login fails (which it shouldn't), show an error.
  // We no longer need the Login/SignUp components.
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center p-4">
          <h1 className="text-red-500 text-lg">MOCK_USER failed to load.</h1>
          <p className="text-gray-600">Check `lib/mockData.ts` and `App.tsx`.</p>
        </div>
      </div>
    );
  }

  // Render the app with our MOCK_USER
  return <MainApp user={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
};

export default App;