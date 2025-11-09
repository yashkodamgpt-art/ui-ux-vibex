
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  const userRef = useRef(currentUser);

  // This custom setter ensures the ref is always in sync with the state, immediately.
  // It's wrapped in useCallback to maintain a stable reference for dependency arrays.
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

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
  
    root.classList.toggle('dark', isDark);
  
    if (theme !== 'system') {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  }, [theme]);

  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    if (authUser.aud !== 'authenticated') {
      console.log('User session detected, but email not confirmed.');
      setCurrentUser(null);
      return;
    }
    console.log(`📥 Loading profile for: ${authUser.id}`);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error.message);
      setCurrentUser(null);
    } else if (profile) {
      console.log(`✅ Profile loaded: ${profile.username}`);
      // Ensure all profile fields from types.ts are populated
      setCurrentUser({
        id: authUser.id,
        email: authUser.email,
        profile: {
          username: profile.username,
          bio: profile.bio || '',
          branch: profile.branch || 'Not set',
          year: profile.year || 2025,
          expertise: profile.expertise || [],
          interests: profile.interests || [],
          cookieScore: profile.cookie_score || 0,
          privacy: profile.privacy || 'public',
          skillScores: profile.skill_scores || {},
          vouchHistory: [],
        }
      });
    } else {
      // Profile doesn't exist, let's try to create it from signup metadata
      const newUsername = authUser.user_metadata?.username;
      if (newUsername) {
        console.warn(`Profile for user ${authUser.id} not found. Attempting to create one.`);
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            username: newUsername,
            bio: authUser.user_metadata?.bio || '',
            privacy: authUser.user_metadata?.privacy || 'public',
            branch: 'Not set', // Add defaults for new fields
            year: 2025,
            expertise: [],
            interests: [],
            cookie_score: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile fallback:", insertError.message);
          setCurrentUser(null);
        } else if (newProfile) {
          console.log("Successfully created fallback profile.");
          setCurrentUser({
            id: authUser.id,
            email: authUser.email,
            profile: {
              username: newProfile.username,
              bio: newProfile.bio || '',
              branch: newProfile.branch || 'Not set',
              year: newProfile.year || 2025,
              expertise: newProfile.expertise || [],
              interests: newProfile.interests || [],
              cookieScore: newProfile.cookie_score || 0,
              privacy: newProfile.privacy || 'public',
              skillScores: newProfile.skill_scores || {},
              vouchHistory: [],
            }
          });
        }
      } else {
        console.error(`No profile found for user ${authUser.id} and username not found in metadata.`);
        setCurrentUser(null);
      }
    }
  }, [setCurrentUser]);
  
  useEffect(() => {
    setLoading(true);

    // This subscription needs to be accessible to the cleanup function.
    let subscription: { unsubscribe: () => void; } | null = null;

    // This function serializes the initial load and the listener setup to prevent race conditions.
    const initializeAndListen = async () => {
        // 1. Get the initial session on load
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Error getting session:", error.message);
            setCurrentUser(null);
        } else if (session?.user) {
            console.log("Found initial session, loading profile...");
            await loadUserProfile(session.user);
        } else {
            setCurrentUser(null);
        }
        
        setLoading(false);

        // 2. AFTER the initial load is complete, set up the listener for future changes.
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`🔔 Auth state changed: ${event}`);
            
            // By this point, userRef is already populated from the initial load,
            // so this check correctly handles redundant SIGNED_IN events.
            if (event === 'SIGNED_IN' && session?.user) {
                if (session.user.id !== userRef.current?.id) {
                    await loadUserProfile(session.user);
                } else {
                    console.log('Ignoring redundant SIGNED_IN event for already loaded user.');
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
            }
        });
        subscription = data.subscription;
    };

    initializeAndListen();

    // 3. Clean up the listener on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserProfile, setCurrentUser]);
  
  const handleLogout = useCallback(async () => {
    // The onAuthStateChange listener will handle setting the user to null.
    // We still clear storage as per user request to ensure a clean slate.
    console.log('Logging out and clearing all storage...');
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    if (error) {
        console.error('Error during sign out:', error.message);
        // If there was an error, we can still force a UI refresh to the root.
        window.location.href = '/';
    }
    // On success, the onAuthStateChange listener will automatically handle
    // updating the state and showing the login screen without a page reload.
  }, []);

  // CRITICAL FIX: This effect adds a listener that validates the session every time
  // the user focuses on the tab. This prevents crashes from "zombie sessions" where
  // the React state is out of sync with the true authentication state.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      // Only run the check if the app's state thinks a user is logged in.
      if (userRef.current) { // Use ref here
        console.log('🩺 Tab is visible, re-validating session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's no session, an error, or the user IDs don't match, it's a zombie/mismatched session.
        if (error || !session || session.user.id !== userRef.current.id) {
          console.error('💔 Session invalid or mismatched on tab focus! Forcing hard logout.', error);
          alert("Your session has expired or is invalid. The application will now refresh. Please log in again.");
          handleLogout();
        } else {
          console.log('✅ Session OK on tab focus.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleLogout]); // Dependency is only handleLogout (which is stable)

  const handleProfileUpdate = (updatedProfile: User['profile']) => {
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          profile: updatedProfile,
        };
      });
  };
  
  // SAFETY NET: This effect adds a timeout to the loading state
  useEffect(() => {
    // If the app is stuck in the loading state for too long, it might be a caching issue
    // or a problem with the Supabase session. This acts as a safety net to prevent
    // the user from being stuck on a loading screen indefinitely.
    if (loading) {
        const timeoutId = setTimeout(() => {
            if (userRef.current) {
              // If userRef has a user but loading is still true, something is wrong.
              // But if userRef is null, we are likely just on the login screen, which is fine.
              console.warn("App is taking too long to initialize (>10s) despite user session. Forcing a hard refresh and clearing storage.");
              alert("Application is taking a while to load. We'll perform a quick refresh to resolve any potential issues.");
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            } else if (document.visibilityState === 'visible') {
              // If no user and still loading, and tab is visible, it's also a problem.
              console.warn("App is taking too long to initialize (>10s) with no user. Forcing a hard refresh.");
              alert("Application is taking a while to load. We'll perform a quick refresh to resolve any potential issues.");
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }

        }, 10000); // 10 seconds

        // If loading completes before the timeout, this cleanup function will clear it.
        return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[--color-bg-secondary]">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-accent-primary] mx-auto mb-4"></div>
          <p className="text-[--color-text-secondary]">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (authView === 'login') {
      return <Login switchToSignUp={() => setAuthView('signup')} />;
    } else {
      return <SignUp switchToLogin={() => setAuthView('login')} />;
    }
  }

  return <MainApp user={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} theme={theme} setTheme={setTheme} />;
};

export default App;