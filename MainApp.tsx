import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { User, Session, SessionMessage, Profile, SessionType, Friend, Tag, FriendRequest, GenderFilter } from './types';
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
import { MOCK_SESSIONS, MOCK_FRIENDS, MOCK_TAGS, MOCK_FRIEND_REQUESTS, MOCK_USERS_DATABASE } from './lib/mockData';
import CreateSessionMenu from './components/sessions/CreateSessionMenu';
import FilterChipBar, { type CampusZoneName, type FilterChip } from './components/filters/FilterChipBar';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import CreateTagModal from './components/social/CreateTagModal';
import AssignTagModal from './components/social/AssignTagModal';
import VouchModal from './components/sessions/VouchModal'; // NEW

const campusZones = {
  "All": { coords: [23.1925, 72.6844] as [number, number], zoom: 16, radius: 9999 },
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
  
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventCoords, setNewEventCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [activeFilter, setActiveFilter] = useState<CampusZoneName>('All');
  
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(MOCK_FRIEND_REQUESTS);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isAssignTagModalOpen, setIsAssignTagModalOpen] = useState(false);
  const [assigningFriend, setAssigningFriend] = useState<Friend | null>(null);

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<SessionMessage[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileQuickViewOpen, setIsProfileQuickViewOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapViewRef = useRef<MapViewRef>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  
  // NEW: State for Vouching
  const [vouchingSession, setVouchingSession] = useState<Session | null>(null);

  useEffect(() => {
    console.log('🎯 MainApp mounted for user:', user.profile.username);
  }, [user]);

  // --- SOCIAL HANDLERS ---
  const handleOpenCreateTagModal = () => { setEditingTag(null); setIsCreateTagModalOpen(true); };
  const handleOpenEditTagModal = (tag: Tag) => { setEditingTag(tag); setIsCreateTagModalOpen(true); };
  const handleSaveTag = (tagData: Omit<Tag, 'id' | 'memberIds'>) => {
    if (editingTag) { setTags(prevTags => prevTags.map(t => t.id === editingTag.id ? { ...t, ...tagData } : t)); } 
    else { const newTag: Tag = { ...tagData, id: `tag-${Date.now()}`, memberIds: [] }; setTags(prevTags => [...prevTags, newTag]); }
    setIsCreateTagModalOpen(false); setEditingTag(null);
  };
  const handleDeleteTag = (tagId: string) => { setConfirmation({ title: "Delete Tag?", message: "Are you sure? Friends will not be removed.", onConfirm: () => { setTags(prevTags => prevTags.filter(t => t.id !== tagId)); setConfirmation(null); } }); };
  const handleOpenAssignTagModal = (friend: Friend) => { setAssigningFriend(friend); setIsAssignTagModalOpen(true); };
  const handleSaveFriendTags = (friendId: string, selectedTagIds: string[]) => {
      setTags(prevTags => prevTags.map(tag => {
          const hasFriend = tag.memberIds.includes(friendId); const shouldHaveFriend = selectedTagIds.includes(tag.id);
          if (hasFriend && !shouldHaveFriend) return { ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) };
          if (!hasFriend && shouldHaveFriend) return { ...tag, memberIds: [...tag.memberIds, friendId] };
          return tag;
      }));
      setIsAssignTagModalOpen(false); setAssigningFriend(null);
  };
  const handleRemoveFriend = (friendId: string) => {
    const friendToRemove = friends.find(f => f.id === friendId); if (!friendToRemove) return;
    setConfirmation({ title: `Remove ${friendToRemove.username}?`, message: `Are you sure you want to remove ${friendToRemove.username}?`, onConfirm: () => { setFriends(prev => prev.filter(f => f.id !== friendId)); setTags(prev => prev.map(tag => ({ ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) }))); setConfirmation(null); } });
  };
  const handleSendRequest = (toUserId: string) => { setFriendRequests(prev => [...prev, { fromUserId: user.id, toUserId }]); };
  const handleAcceptRequest = (fromUserId: string) => {
      const userToAdd = MOCK_USERS_DATABASE.find(u => u.id === fromUserId); if (userToAdd) { setFriends(prev => [...prev, userToAdd]); }
      setFriendRequests(prev => prev.filter(req => !(req.fromUserId === fromUserId && req.toUserId === user.id)));
  };
  const handleRejectRequest = (fromUserId: string) => { setFriendRequests(prev => prev.filter(req => !(req.fromUserId === fromUserId && req.toUserId === user.id))); };

  // --- VISIBILITY & FILTER LOGIC ---
  const visibleSessions = useMemo(() => {
    const userTagIds = new Set<string>();
    tags.forEach(tag => { if (tag.memberIds.includes(user.id)) { userTagIds.add(tag.id); } });
    return sessions.filter(session => {
        if (session.privacy !== 'private') return true; if (session.creator_id === user.id) return true;
        if (session.visibleToTags) { return session.visibleToTags.some(tagId => userTagIds.has(tagId)); }
        return false;
    });
  }, [sessions, user.id, tags]);
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c;
  }
  const filterChips: FilterChip[] = (Object.keys(campusZones) as CampusZoneName[]).map(name => {
      const zone = campusZones[name];
      const count = visibleSessions.filter(s => { if (name === 'All') return true; const d = getDistance(s.lat, s.lng, zone.coords[0], zone.coords[1]); return d <= zone.radius; }).length;
      return { name, count };
  });
  const filteredSessions = visibleSessions.filter(s => {
      if (activeFilter === 'All') return true; const zone = campusZones[activeFilter];
      const d = getDistance(s.lat, s.lng, zone.coords[0], zone.coords[1]); return d <= zone.radius;
  });
  const handleFilterSelect = (filter: CampusZoneName) => setActiveFilter(filter);
  
  // --- CREATE FLOW ---
  const handleCancelCreate = useCallback(() => { setIsCreateMenuOpen(false); setIsPlacementMode(false); setSelectedSessionType(null); setIsCreateModalOpen(false); setNewEventCoords(null); }, []);
  const handleCreateButtonClick = () => { if (isCreateMenuOpen || isPlacementMode) { handleCancelCreate(); } else { setIsCreateMenuOpen(true); } };
  const handleSelectSessionType = (type: SessionType) => { setSelectedSessionType(type); setIsPlacementMode(true); setIsCreateMenuOpen(false); };
  const handleMapPlacement = (coords: { lat: number; lng: number }) => { if (activeVibe) { alert("You are already in a Vibe."); handleCancelCreate(); return; } setNewEventCoords(coords); setIsCreateModalOpen(true); setIsPlacementMode(false); };
  const handleCreateEvent = async (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => {
    if (!newEventCoords || !sessionValid) return;
    const newSession: Session = { ...eventData, id: Math.floor(Math.random() * 10000), lat: newEventCoords.lat, lng: newEventCoords.lng, creator_id: user.id, participants: [user.id], creator: { username: user.profile.username }, sessionType: selectedSessionType || 'vibe', creatorGender: user.profile.gender };
    setSessions(prevSessions => [...prevSessions, newSession]);
    setActiveVibe(newSession);
    handleCancelCreate();
  };
  
  // --- SESSION HANDLERS ---
  const handleRecenterMap = () => mapViewRef.current?.recenter();
  const handleCloseEvent = async (sessionId: number) => { setSessions(prev => prev.filter(s => s.id !== sessionId)); if (activeVibe?.id === sessionId) { setActiveVibe(null); setIsChatVisible(false); } };
  const handleExtendEvent = async (sessionId: number, minutes: number) => { setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, duration: s.duration + minutes } : s)); };
  const handleJoinVibe = async (sessionId: number, role: 'seeking' | 'offering' | 'participant' = 'participant') => {
    if (activeVibe) { alert("You're already in a Vibe."); return; }
    let joinedSession: Session | null = null;
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const newParticipants = [...s.participants, user.id];
        
        // FIX: The 'participantRoles' type only accepts 'seeking' or 'offering'.
        // We conditionally add the role only if it's not 'participant' to prevent a type error.
        let newRoles = s.participantRoles;
        if (role === 'seeking' || role === 'offering') {
          newRoles = { ...s.participantRoles, [user.id]: role };
        }

        joinedSession = { ...s, participants: newParticipants, participantRoles: newRoles };
        return joinedSession;
      }
      return s;
    }));
    if (joinedSession) { setActiveVibe(joinedSession); }
  };
  const handleLeaveVibe = async (sessionId: number) => {
      const leavingSession = sessions.find(s => s.id === sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, participants: s.participants.filter(pId => pId !== user.id) } : s));
      setActiveVibe(null); setIsChatVisible(false);
      if (leavingSession?.sessionType === 'cookie' && leavingSession.creator_id !== user.id) {
          setVouchingSession(leavingSession);
      }
  };
  const handleSendMessage = async (text: string) => {
      if (!activeVibe) return;
      const newMessage: SessionMessage = { id: Math.floor(Math.random() * 10000), sender_id: user.id, session_id: activeVibe.id, text: text, created_at: new Date().toISOString(), sender: { username: user.profile.username } };
      setChatMessages(prev => [...prev, newMessage]);
  };

  // --- NEW: VOUCH HANDLER ---
  const handleVouch = (creatorId: string, skill: string, rating: number) => {
      console.log(`Vouching for ${creatorId} in skill ${skill} with rating ${rating}`);
      // MOCK LOGIC: Update friend's cookie score in local state
      const vouchPoints = [10, 8, 6, 4, 2];
      // In a real app, we'd check history for diminishing returns. Here we'll just give 10 points.
      const points = 10;
      setFriends(prev => prev.map(f => f.id === creatorId ? { ...f, cookieScore: f.cookieScore + points } : f));
      setVouchingSession(null);
  };
  
  // --- PROFILE HANDLERS ---
  const handleOpenProfile = async (username: string) => alert(`Mock Mode: Cannot open profile for ${username}.`);
  const handleViewFriendProfile = (friend: Friend) => {
      const userToView: User = { id: friend.id, email: `${friend.username.toLowerCase()}@campus.dev`, profile: { username: friend.username, bio: `A ${friend.branch} student graduating in ${friend.year}.`, branch: friend.branch, year: friend.year, expertise: [], interests: [], cookieScore: friend.cookieScore, privacy: 'public', skillScores: {}, vouchHistory: [], gender: friend.gender, } };
      setViewedUser(userToView); setIsProfileModalOpen(true);
  };
  const handleTabClick = (tab: AppTab) => setActiveTab(tab);

  return (
    <div className="h-screen w-screen overflow-hidden bg-green-50 flex flex-col">
      {activeTab === 'Home' ? ( <> <HomeHeader user={user} onOpenProfile={() => setIsProfileQuickViewOpen(true)} /> <FilterChipBar filters={filterChips} activeFilter={activeFilter} onSelectFilter={handleFilterSelect} /> </> ) : ( <PageHeader username={user.profile.username} onLogout={onLogout} /> )}
      
      <main className="flex-grow relative overflow-hidden">
        {error && (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md w-11/12" role="alert">{/* ... */}</div>)}
          <div className={`h-full w-full ${activeTab === 'Home' ? 'block' : 'hidden'}`}>
            <MapView ref={mapViewRef} isVisible={activeTab === 'Home'} isCreateMode={isPlacementMode} userLocation={userLocation} onSetUserLocation={setUserLocation} onMapClick={handleMapPlacement} events={filteredSessions} user={user} activeVibe={activeVibe} onCloseEvent={handleCloseEvent} onExtendEvent={handleExtendEvent} onJoinVibe={handleJoinVibe} onViewChat={() => setIsChatVisible(true)} activeFilter={activeFilter} campusZones={campusZones} friends={friends}/>
            <div className="fixed bottom-20 right-6 z-[1000] flex flex-col items-center space-y-4">
              <MyLocationButton onClick={handleRecenterMap} disabled={!userLocation} />
              <CreateSessionMenu isOpen={isCreateMenuOpen} onSelectType={handleSelectSessionType} />
              <CreateEventButton onClick={handleCreateButtonClick} isActive={isCreateMenuOpen || isPlacementMode} />
            </div>
          </div>
          <div className={`h-full overflow-y-auto ${activeTab === 'Social' ? 'block' : 'hidden'}`}><SocialPage user={user} friends={friends} tags={tags} friendRequests={friendRequests} onSaveTag={handleSaveTag} onDeleteTag={handleDeleteTag} onRemoveFriend={handleRemoveFriend} onSaveFriendTags={handleSaveFriendTags} onSendRequest={handleSendRequest} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onViewFriendProfile={handleViewFriendProfile} setConfirmation={setConfirmation} onOpenCreateTagModal={handleOpenCreateTagModal} onOpenEditTagModal={handleOpenEditTagModal} onOpenAssignTagModal={handleOpenAssignTagModal} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === 'Alerts' ? 'block' : 'hidden'}`}><AlertsPage user={user} /></div>
          <div className={`h-full overflow-y-auto ${activeTab === 'Profile' ? 'block' : 'hidden'}`}><ProfilePage user={user} onProfileUpdate={onProfileUpdate} sessions={sessions} /></div>
        
        <CreateEventModal isOpen={isCreateModalOpen} onClose={handleCancelCreate} onSubmit={handleCreateEvent} sessionType={selectedSessionType} tags={tags} friends={friends} user={user} />
        {activeVibe && ( <VibeChatPanel isOpen={isChatVisible} onClose={() => setIsChatVisible(false)} vibe={activeVibe} messages={chatMessages} user={user} onSendMessage={handleSendMessage} onLeaveVibe={handleLeaveVibe} onViewProfile={handleOpenProfile} /> )}
        <ProfileQuickView isOpen={isProfileQuickViewOpen} onClose={() => setIsProfileQuickViewOpen(false)} user={user} onEditProfile={() => { setIsProfileQuickViewOpen(false); setIsSettingsModalOpen(true); }} />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} user={user} onSave={(profile) => { onProfileUpdate(profile); setIsSettingsModalOpen(false); }} />
        {viewedUser && ( <ProfileModal isOpen={isProfileModalOpen} onClose={() => { setViewedUser(null); setIsProfileModalOpen(false); }} userToView={viewedUser} /> )}
        {confirmation && ( <ConfirmationDialog isOpen={true} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation(null)} /> )}
        <CreateTagModal isOpen={isCreateTagModalOpen} onClose={() => setIsCreateTagModalOpen(false)} onSave={handleSaveTag} existingTag={editingTag} />
        {assigningFriend && ( <AssignTagModal isOpen={isAssignTagModalOpen} onClose={() => setIsAssignTagModalOpen(false)} friend={assigningFriend} tags={tags} onSave={handleSaveFriendTags} onCreateTag={handleOpenCreateTagModal} /> )}
        {vouchingSession && ( <VouchModal isOpen={true} onClose={() => setVouchingSession(null)} session={vouchingSession} onVouch={handleVouch} /> )}
      </main>
      <BottomNavBar activeTab={activeTab} onTabClick={handleTabClick} />
    </div>
  );
};

export default MainApp;