
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

  // Using a ref to get the latest user state in callbacks without causing re-renders
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

  // Fetches the user's profile from the 'profiles' table.
  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      console.log(`📥 Loading profile for: ${authUser.id}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching profile or profile not found for user:', authUser.id, error);
        await supabase.auth.signOut();
        setCurrentUser(null);
        return;
      }

      const appUser: User = {
        id: authUser.id,
        email: authUser.email,
        profile: {
          ...data,
          bio: data.bio || '',
          expertise: data.expertise || [],
          interests: data.interests || [],
          skillScores: data.skillScores || {}, 
          vouchHistory: data.vouchHistory || [],
        },
      };
      setCurrentUser(appUser);

    } catch (error) {
      console.error('An unexpected error occurred in loadUserProfile:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser]);

  // This single useEffect, using onAuthStateChange, is the most robust way to handle Supabase auth.
  // It correctly handles the initial session on page load, sign-ins, sign-outs, and token refreshes.
  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // A session exists. We only load the profile if the user in state is different.
          // This prevents re-loading the profile on events like TOKEN_REFRESHED (e.g., tab focus).
          if (userRef.current?.id !== session.user.id) {
            await loadUserProfile(session.user);
          } else {
            // The user is the same, so we don't need to reload the profile.
            // We just ensure the loading screen is turned off.
            setLoading(false);
          }
        } else {
          // No session exists, so the user is signed out.
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile, setCurrentUser]);
  
  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error during sign out:', error.message);
    }
    // onAuthStateChange listener will handle setting user to null.
  }, []);
  
  const handleProfileUpdate = (updatedProfile: User['profile']) => {
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          profile: updatedProfile,
        };
      });
  };

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

  return <MainApp user={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
};

export default App;
