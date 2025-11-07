
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      // If there's an error (like profile not found), log the user out.
      // This prevents the app from crashing if the profile creation trigger fails or is delayed.
      if (error || !data) {
        console.error('Error fetching profile or profile not found for user:', authUser.id, error);
        await supabase.auth.signOut();
        setCurrentUser(null);
        return;
      }

      // Successfully fetched profile, construct the full User object.
      const appUser: User = {
        id: authUser.id,
        email: authUser.email,
        profile: data,
      };
      setCurrentUser(appUser);

    } catch (error) {
      console.error('An unexpected error occurred in loadUserProfile:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser]);

  useEffect(() => {
    setLoading(true);

    // Check for an existing session on initial load.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user);
      } else {
        setLoading(false); // No session, stop loading.
      }
    });
    
    // Set up a listener for auth state changes (sign in, sign out, token refresh).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          // A user is signed in or their token was refreshed.
          await loadUserProfile(session.user);
        } else {
          // The user signed out.
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    // Clean up the listener on component unmount.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUserProfile, setCurrentUser]);
  
  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error during sign out:', error.message);
    }
    // The onAuthStateChange listener will handle setting user to null and re-rendering.
    // No need to manually set user state here.
  }, []);
  
  const handleProfileUpdate = (updatedProfile: User['profile']) => {
      // Sync the app's top-level state after a profile update from a child component.
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
