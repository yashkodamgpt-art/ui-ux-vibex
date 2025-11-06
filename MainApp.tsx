import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Session, SessionMessage, Profile, SessionType, Friend } from './types';
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
import HomeHeader from './components/layout/HomeHeader'; // We keep this for the profile button
import ProfileQuickView from './components/layout/ProfileQuickView';
import SocialPage from './components/social/SocialPage';
import AlertsPage from './components/alerts/AlertsPage';
import ProfilePage from './components/profile/ProfilePage';
import { MOCK_SESSIONS } from './lib/mockData';

// --- NEW IMPORTS ---
import CreateSessionMenu from './components/sessions/CreateSessionMenu';
import FilterChipBar, { type CampusZoneName, type FilterChip } from './components/filters/FilterChipBar';
import ConfirmationDialog from './components/common/ConfirmationDialog';

// --- NEW CAMPUS ZONES DEFINITION ---
const campusZones = {
  "All": { coords: [23.1925, 72.6844] as [number, number], zoom: 16, radius: 9999 }, // Large radius to include everything
  "Library": { coords: [23.1930, 72.6840] as [number, number], zoom: 18, radius: 100 },
  "Hostel Area": { coords: [23.1905, 72.6860] as [number, number], zoom: 17.5, radius: 200 },
  "Sports Complex": { coords: [23.1945, 72.6825] as [number, number], zoom: 17, radius: 250 },
  "Mess 1": { coords: [23.1915, 72.6855] as [number, number], zoom: 18, radius: 80 },
  "Academic Block": { coords: [23.1920, 72.6830] as [number, number], zoom: 17, radius: 200 },
};

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onProfileUpdate: (profile: User['profile']) => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('Home');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [activeVibe, setActiveVibe] = useState<Session | null>(null);
  
  // --- CREATE FLOW STATE ---
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventCoords, setNewEventCoords] = useState<{ lat: number; lng: number } | null>(null);

  // --- NEW FILTER STATE ---
  const [activeFilter, setActiveFilter] = useState<CampusZoneName>('All');

  // Other states
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<SessionMessage[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileQuickViewOpen, setIsProfileQuickViewOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapViewRef = useRef<MapViewRef>(null);
  const [sessionValid, setSessionValid] = useState(true); // Always true in mock mode
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    console.log('🎯 MainApp mounted for user:', user.profile.username);
  }, [user]);

  // --- FILTER LOGIC ---
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const filterChips: FilterChip[] = (Object.keys(campusZones) as CampusZoneName[]).map(name => {
      const zone = campusZones[name];
      const count = sessions.filter(s => {
          if (name === 'All') return true;
          const distance = getDistance(s.lat, s.lng, zone.coords[0], zone.coords[1]);
          return distance <= zone.radius;
      }).length;
      return { name, count };
  });

  const filteredSessions = sessions.filter(s => {
      if (activeFilter === 'All') return true;
      const zone = campusZones[activeFilter];
      const distance = getDistance(s.lat, s.lng, zone.coords[0], zone.coords[1]);
      return distance <= zone.radius;
  });

  const handleFilterSelect = (filter: CampusZoneName) => {
      setActiveFilter(filter);
  };
  
  // --- HANDLERS FOR CREATE FLOW ---
  const handleCancelCreate = useCallback(() => {
    setIsCreateMenuOpen(false);
    setIsPlacementMode(false);
    setSelectedSessionType(null);
    setIsCreateModalOpen(false);
    setNewEventCoords(null);
  }, []);

  const handleCreateButtonClick = () => {
    if (isCreateMenuOpen || isPlacementMode) {
        handleCancelCreate();
    } else {
        setIsCreateMenuOpen(true);
    }
  };
  
  const handleSelectSessionType = (type: SessionType) => {
    setSelectedSessionType(type);
    setIsPlacementMode(true);
    setIsCreateMenuOpen(false);
  };

  const handleMapPlacement = (coords: { lat: number; lng: number }) => {
    if (activeVibe) {
        alert("You are already in a Vibe. Leave or close your current Vibe to create a new one.");
        handleCancelCreate();
        return;
    }
    setNewEventCoords(coords);
    setIsCreateModalOpen(true);
    setIsPlacementMode(false);
  };

  const handleCreateEvent = async (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => {
    if (!newEventCoords || !sessionValid) return;
    
    const newSession: Session = {
      ...eventData,
      id: Math.floor(Math.random() * 10000),
      lat: newEventCoords.lat,
      lng: newEventCoords.lng,
      creator_id: user.id,
      participants: [user.id],
      creator: { username: user.profile.username },
      sessionType: selectedSessionType || 'vibe', 
    };
    
    setSessions(prevSessions => [...prevSessions, newSession]);
    setActiveVibe(newSession);
    handleCancelCreate();
  };
  
  // --- Other Mock Handlers ---
  const handleRecenterMap = () => {
    mapViewRef.current?.recenter();
  };

  const handleCloseEvent = async (sessionId: number) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeVibe?.id === sessionId) {
      setActiveVibe(null);
      setIsChatVisible(false);
    }
  };

  const handleExtendEvent = async (sessionId: number, minutes: number) => {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, duration: s.duration + minutes } : s
      ));
  };

  const handleJoinVibe = async (sessionId: number) => {
    if (activeVibe) {
        alert("You're already in a Vibe. Please leave it before joining another.");
        return;
    }
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
      alert(`Mock Mode: Cannot open profile for ${username}. This feature will be built later.`);
  };

  const handleViewFriendProfile = (friend: Friend) => {
      const userToView: User = {
        id: friend.id,
        email: `${friend.username.toLowerCase()}@campus.dev`,
        profile: {
          username: friend.username,
          bio: `A ${friend.branch} student graduating in ${friend.year}.`,
          branch: friend.branch,
          year: friend.year,
          expertise: [],
          interests: [],
          cookieScore: friend.cookieScore,
          privacy: 'public',
          skillScores: {},
          vouchHistory: [],
        }
      };
      setViewedUser(userToView);
      setIsProfileModalOpen(true);
  };

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-green-50 flex flex-col">
      {activeTab === 'Home' ? (
        <>
          <HomeHeader user={user} onOpenProfile={() => setIsProfileQuickViewOpen(true)} />
          <FilterChipBar filters={filterChips} activeFilter={activeFilter} onSelectFilter={handleFilterSelect} />
        </>
      ) : (
        <PageHeader username={user.profile.username} onLogout={onLogout} />
      )}
      
      <main className="flex-grow relative overflow-hidden">
        {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md w-11/12" role="alert">
                {/* ... error content ... */}
            </div>
        )}
        
          <div className={`h-full w-full ${activeTab === 'Home' ? 'block' : 'hidden'}`}>
            <MapView 
              ref={mapViewRef}
              isVisible={activeTab === 'Home'}
              isCreateMode={isPlacementMode}
              userLocation={userLocation}
              onSetUserLocation={setUserLocation}
              onMapClick={handleMapPlacement}
              events={filteredSessions} 
              user={user}
              activeVibe={activeVibe}
              onCloseEvent={handleCloseEvent}
              onExtendEvent={handleExtendEvent}
              onJoinVibe={handleJoinVibe}
              onViewChat={() => setIsChatVisible(true)}
              activeFilter={activeFilter}
              campusZones={campusZones}
            />
            <div className="fixed bottom-20 right-6 z-[1000] flex flex-col items-center space-y-4">
              <MyLocationButton 
                onClick={handleRecenterMap} 
                disabled={!userLocation} 
              />
              <CreateSessionMenu 
                isOpen={isCreateMenuOpen}
                onSelectType={handleSelectSessionType}
              />
              <CreateEventButton 
                onClick={handleCreateButtonClick} 
                isActive={isCreateMenuOpen || isPlacementMode} 
              />
            </div>
          </div>

          <div className={`h-full overflow-y-auto ${activeTab === 'Social' ? 'block' : 'hidden'}`}><SocialPage user={user} onViewFriendProfile={handleViewFriendProfile} setConfirmation={setConfirmation} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === 'Alerts' ? 'block' : 'hidden'}`}><AlertsPage user={user} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === 'Profile' ? 'block' : 'hidden'}`}><ProfilePage user={user} onProfileUpdate={onProfileUpdate} sessions={sessions} /></div>
        
        <CreateEventModal 
          isOpen={isCreateModalOpen}
          onClose={handleCancelCreate}
          onSubmit={handleCreateEvent}
          sessionType={selectedSessionType}
        />
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
                onClose={() => { setViewedUser(null); setIsProfileModalOpen(false); }}
                userToView={viewedUser}
            />
        )}
        {confirmation && (
            <ConfirmationDialog
                isOpen={true}
                title={confirmation.title}
                message={confirmation.message}
                onConfirm={confirmation.onConfirm}
                onCancel={() => setConfirmation(null)}
            />
        )}
      </main>
      <BottomNavBar activeTab={activeTab} onTabClick={handleTabClick} />
    </div>
  );
};

export default MainApp;