
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from './types';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import MainApp from './MainApp';
import { supabase } from './lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type AuthView = 'login' | 'signup';

const App: React.FC = () => {
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
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

  // --- REAL AUTHENTICATION ---
  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile for user, signing out:', authUser.id, error);
        // If profile doesn't exist yet (e.g., due to db trigger delay/failure),
        // sign them out to prevent app crash and force a re-login.
        await supabase.auth.signOut();
        setCurrentUser(null);
        return;
      }

      if (data) {
        const appUser: User = {
          id: authUser.id,
          email: authUser.email,
          profile: data,
        };
        setCurrentUser(appUser);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser]);

  useEffect(() => {
    setLoading(true);

    // Check for an existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });
    
    // Set up a listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // A user is signed in or their token was refreshed.
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          // The user signed out.
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUserProfile, setCurrentUser]);
  
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
          <p className="text-gray-600">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return authView === 'login' ? (
      <Login switchToSignUp={() => setAuthView('signup')} />
    ) : (
      <SignUp switchToLogin={() => setAuthView('login')} />
    );
  }

  // Render the app with our authenticated user
  return <MainApp user={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
};

export default App;
