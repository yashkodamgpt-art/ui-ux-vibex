
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Session, SessionMessage, Profile } from './types';
import MapView, { type MapViewRef } from './components/map/MapView';
import CreateEventModal from './components/events/CreateEventModal';
import MyLocationButton from './components/common/MyLocationButton';
import CreateEventButton from './components/common/CreateEventButton';
import VibeChatPanel from './components/vibes/VibeChatPanel';
import SettingsModal from './components/profile/SettingsModal';
import ProfileModal from './components/profile/ProfileModal';
import { supabase } from './lib/supabaseClient';
import BottomNavBar, { type AppTab } from './components/layout/BottomNavBar';
import PageHeader from './components/layout/PageHeader';
import HomeHeader from './components/layout/HomeHeader';
import ProfileQuickView from './components/layout/ProfileQuickView';
import SocialPage from './components/social/SocialPage';
import AlertsPage from './components/alerts/AlertsPage';
import ProfilePage from './components/profile/ProfilePage';

// --- NEW MOCK DATA IMPORT ---
import { MOCK_SESSIONS } from './lib/mockData';

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onProfileUpdate: (profile: User['profile']) => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('Home');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventCoords, setNewEventCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // --- MOCK DATA STATE ---
  // We now load our mock sessions directly into state.
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [activeVibe, setActiveVibe] = useState<Session | null>(null);
  
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<SessionMessage[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileQuickViewOpen, setIsProfileQuickViewOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapViewRef = useRef<MapViewRef>(null);
  const [sessionValid, setSessionValid] = useState(true); // Always true in mock mode

  useEffect(() => {
    console.log('🎯 MainApp mounted for user:', user.profile.username);
  }, [user]);

  // --- ALL SUPABASE LOGIC IS NOW COMMENTED OUT ---

  // useEffect(() => {
  //   if (!sessionValid) return;
  //   const fetchEvents = async () => { ... };
  //   fetchEvents();
  //   const eventsSubscription = supabase.channel(...)
  //   return () => { supabase.removeChannel(eventsSubscription); };
  // }, [sessionValid, onLogout]);
  
  // useEffect(() => {
  //   if (!sessionValid) return;
  //   let messagesSubscription: any = null;
  //   if (isChatVisible && activeVibe) {
  //       const fetchMessages = async () => { ... };
  //       fetchMessages();
  //       messagesSubscription = supabase.channel(...)
  //   }
  //   return () => {
  //       if(messagesSubscription) {
  //           supabase.removeChannel(messagesSubscription);
  //       }
  //   };
  // }, [isChatVisible, activeVibe, sessionValid, onLogout]);

  const handleMapClickInCreateMode = (coords: { lat: number; lng: number }) => {
    if (activeVibe) {
        alert("You are already in a Vibe. Leave or close your current Vibe to create a new one.");
        setIsCreateMode(false);
        return;
    }
    setNewEventCoords(coords);
    setIsCreateModalOpen(true);
  };

  const handleCreateEvent = async (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => {
    if (!newEventCoords || !sessionValid) return;
    console.log('--- MOCK: Creating Event ---', eventData);
    // In mock mode, we just add it to our local state.
    const newSession: Session = {
      ...eventData,
      id: Math.floor(Math.random() * 10000), // Random ID
      lat: newEventCoords.lat,
      lng: newEventCoords.lng,
      creator_id: user.id,
      participants: [user.id],
      creator: { username: user.profile.username },
    };
    setSessions(prevSessions => [...prevSessions, newSession]);
    setActiveVibe(newSession);
    setIsCreateModalOpen(false);
    setNewEventCoords(null);
    setIsCreateMode(false);
  };
  
  const handleRecenterMap = () => {
    mapViewRef.current?.recenter();
  };

  const handleCloseEvent = async (sessionId: number) => {
    console.log('--- MOCK: Closing Session ---', sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeVibe?.id === sessionId) {
      setActiveVibe(null);
      setIsChatVisible(false);
    }
  };

  const handleExtendEvent = async (sessionId: number) => {
      console.log('--- MOCK: Extending Session ---', sessionId);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, duration: s.duration + 15 } : s
      ));
  };

  const handleJoinVibe = async (sessionId: number) => {
    if (activeVibe) {
        alert("You're already in a Vibe. Please leave it before joining another.");
        return;
    }
    console.log('--- MOCK: Joining Session ---', sessionId);
    let joinedSession: Session | null = null;
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const newParticipants = [...s.participants, user.id];
        joinedSession = { ...s, participants: newParticipants };
        return joinedSession;
      }
      return s;
    }));
    
    if (joinedSession) {
      setActiveVibe(joinedSession);
    }
  };

  const handleLeaveVibe = async (sessionId: number) => {
      console.log('--- MOCK: Leaving Session ---', sessionId);
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, participants: s.participants.filter(pId => pId !== user.id) };
        }
        return s;
      }));
      setActiveVibe(null);
      setIsChatVisible(false);
  };

  const handleSendMessage = async (text: string) => {
      if (!activeVibe) return;
      console.log('--- MOCK: Sending Message ---', text);
      const newMessage: SessionMessage = {
        id: Math.floor(Math.random() * 10000),
        sender_id: user.id,
        session_id: activeVibe.id,
        text: text,
        created_at: new Date().toISOString(),
        sender: { username: user.profile.username },
      };
      setChatMessages(prev => [...prev, newMessage]);
  };

  const handleOpenProfile = async (username: string) => {
      console.log('--- MOCK: Opening Profile ---', username);
      // In a real app, we'd fetch this. In mock, we can't.
      // We'll just show an alert.
      alert(`Mock Mode: Cannot open profile for ${username}. This feature will be built later.`);
  };

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
  };

  if (!sessionValid) {
    // This should not be reachable in mock mode
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-green-50 flex flex-col">
      {/* Conditionally render header based on active tab */}
      {activeTab === 'Home' ? (
        <HomeHeader user={user} onOpenProfile={() => setIsProfileQuickViewOpen(true)} />
      ) : (
        <PageHeader username={user.profile.username} onLogout={onLogout} />
      )}
      
      <main className="flex-grow relative overflow-hidden">
        {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md w-11/12" role="alert">
                {/* ... error content ... */}
            </div>
        )}
        
          {/* Home Tab Content */}
          <div className={`h-full w-full ${activeTab === 'Home' ? 'block' : 'hidden'}`}>
            <MapView 
              ref={mapViewRef}
              isVisible={activeTab === 'Home'}
              isCreateMode={isCreateMode}
              userLocation={userLocation}
              onSetUserLocation={setUserLocation}
              onMapClick={handleMapClickInCreateMode}
              events={sessions} // Pass 'sessions' state
              user={user}
              activeVibe={activeVibe}
              onCloseEvent={handleCloseEvent}
              onExtendEvent={handleExtendEvent}
              onJoinVibe={handleJoinVibe}
              onViewChat={() => setIsChatVisible(true)}
            />
            <div className="fixed bottom-20 right-6 z-[1000] flex flex-col items-center space-y-4">
              <MyLocationButton 
                onClick={handleRecenterMap} 
                disabled={!userLocation} 
              />
              <CreateEventButton 
                onClick={() => setIsCreateMode(!isCreateMode)} 
                isActive={isCreateMode} 
              />
            </div>
          </div>

          {/* Social Tab Content */}
          <div className={`h-full overflow-y-auto ${activeTab === 'Social' ? 'block' : 'hidden'}`}>
            <SocialPage />
          </div>

          {/* Alerts Tab Content */}
          <div className={`h-full overflow-y-auto ${activeTab === 'Alerts' ? 'block' : 'hidden'}`}>
            <AlertsPage />
          </div>

          {/* Profile Tab Content */}
          <div className={`h-full overflow-y-auto ${activeTab === 'Profile' ? 'block' : 'hidden'}`}>
            <ProfilePage />
          </div>
        
        
        {newEventCoords && (
          <CreateEventModal 
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setNewEventCoords(null);
              setIsCreateMode(false);
            }}
            onSubmit={handleCreateEvent}
          />
        )}
        {activeVibe && (
            <VibeChatPanel
                isOpen={isChatVisible}
                onClose={() => setIsChatVisible(false)}
                vibe={activeVibe}
                messages={chatMessages}
                user={user}
                onSendMessage={handleSendMessage}
                onLeaveVibe={handleLeaveVibe}
                onViewProfile={handleOpenProfile}
            />
        )}
        <ProfileQuickView
            isOpen={isProfileQuickViewOpen}
            onClose={() => setIsProfileQuickViewOpen(false)}
            user={user}
            onEditProfile={() => {
              setIsProfileQuickViewOpen(false);
              setIsSettingsModalOpen(true);
            }}
        />
        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            user={user}
            onSave={(profile) => {
              onProfileUpdate(profile);
              setIsSettingsModalOpen(false);
            }}
        />
        {viewedUser && (
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userToView={viewedUser}
            />
        )}
      </main>
      <BottomNavBar activeTab={activeTab} onTabClick={handleTabClick} />
    </div>
  );
};

export default MainApp;
