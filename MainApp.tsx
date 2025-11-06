
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// FIX: Removed non-existent 'GenderFilter' from import.
import type { User, Session, SessionMessage, Profile, SessionType, Friend, Tag, FriendRequest, Notification } from './types';
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
import { MOCK_SESSIONS, MOCK_FRIENDS, MOCK_TAGS, MOCK_FRIEND_REQUESTS, MOCK_USERS_DATABASE, MOCK_NOTIFICATIONS } from './lib/mockData';
import CreateSessionMenu from './components/sessions/CreateSessionMenu';
import FilterChipBar, { type CampusZoneName, type FilterChip } from './components/filters/FilterChipBar';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import CreateTagModal from './components/social/CreateTagModal';
import AssignTagModal from './components/social/AssignTagModal';
import VouchModal from './components/sessions/VouchModal';
import ActiveSessionIndicator from './components/sessions/ActiveSessionIndicator';
import ActiveSessionsModal from './components/sessions/ActiveSessionsModal';
import ToastContainer, { type Toast } from './components/common/ToastContainer';

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
  const [vouchingSession, setVouchingSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isAllSessionsModalOpen, setIsAllSessionsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { console.log('🎯 MainApp mounted for user:', user.profile.username); }, [user]);

  // --- TOAST NOTIFICATION SYSTEM ---
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const newToast: Toast = { id: Date.now(), message, type };
    setToasts(prev => {
      const updatedToasts = [newToast, ...prev];
      return updatedToasts.slice(0, 3); // Keep only the 3 newest toasts
    });
  }, []);
  const removeToast = useCallback((id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);

  // --- NOTIFICATION HANDLERS ---
  const handleMarkAsRead = useCallback((notificationId: string) => { setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)); }, []);
  const handleMarkAllAsRead = useCallback(() => { setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); }, []);
  const handleDeleteNotification = useCallback((notificationId: string) => { setNotifications(prev => prev.filter(n => n.id !== notificationId)); }, []);
  const createNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => { const newNotif: Notification = { ...notification, id: `notif-${Date.now()}`, timestamp: new Date().toISOString(), isRead: false }; setNotifications(prev => [newNotif, ...prev]); addToast('You have a new notification!', 'info'); }, [addToast]);
  
  // --- SOCIAL HANDLERS (with try-catch) ---
  const handleSocialActions = useMemo(() => ({
    handleSendRequest: (toUserId: string) => { try { setFriendRequests(prev => [...prev, { fromUserId: user.id, toUserId }]); addToast('Friend request sent!', 'success'); } catch (e) { console.error("Error sending friend request:", e); addToast("Could not send request.", "error"); } },
    handleAcceptRequest: (fromUserId: string) => { try { const userToAdd = MOCK_USERS_DATABASE.find(u => u.id === fromUserId); if (userToAdd) { setFriends(prev => [...prev, userToAdd]); addToast(`You are now friends with ${userToAdd.username}!`, 'success'); } setFriendRequests(prev => prev.filter(req => !(req.fromUserId === fromUserId && req.toUserId === user.id))); } catch (e) { console.error("Error accepting request:", e); addToast("Could not accept request.", "error"); } },
    handleRejectRequest: (fromUserId: string) => { try { setFriendRequests(prev => prev.filter(req => !(req.fromUserId === fromUserId && req.toUserId === user.id))); addToast('Friend request rejected.', 'info'); } catch (e) { console.error("Error rejecting request:", e); addToast("Could not reject request.", "error"); } },
  }), [user.id, addToast]);
  const { handleSendRequest, handleAcceptRequest, handleRejectRequest } = handleSocialActions;

  const handleNotificationAction = useCallback((notification: Notification, action: 'accept' | 'reject' | 'view') => { try { console.log(`Action '${action}' on notification:`, notification); if (notification.type === 'friend_request_received' && notification.user) { if (action === 'accept') { handleAcceptRequest(notification.user.id); } else if (action === 'reject') { handleRejectRequest(notification.user.id); } handleDeleteNotification(notification.id); } else if (action === 'view' && notification.session) { addToast(`Navigating to "${notification.session.title}"...`, 'info'); setActiveTab('Home'); setTimeout(() => { const sessionToFly = sessions.find(s => s.id === notification.session?.id); if (sessionToFly) mapViewRef.current?.flyToSession(sessionToFly); }, 100); handleMarkAsRead(notification.id); } } catch (e) { console.error("Error handling notification action:", e); } }, [handleAcceptRequest, handleRejectRequest, handleDeleteNotification, addToast, sessions, handleMarkAsRead]);
  const handleOpenCreateTagModal = useCallback(() => { setEditingTag(null); setIsCreateTagModalOpen(true); }, []);
  const handleOpenEditTagModal = useCallback((tag: Tag) => { setEditingTag(tag); setIsCreateTagModalOpen(true); }, []);
  const handleSaveTag = useCallback((tagData: Omit<Tag, 'id' | 'memberIds'>) => { try { if (editingTag) { setTags(prevTags => prevTags.map(t => t.id === editingTag.id ? { ...t, ...tagData } : t)); addToast("Tag updated!", "success"); } else { const newTag: Tag = { ...tagData, id: `tag-${Date.now()}`, memberIds: [] }; setTags(prevTags => [...prevTags, newTag]); addToast("Tag created!", "success"); } setIsCreateTagModalOpen(false); setEditingTag(null); } catch (e) { console.error("Error saving tag:", e); addToast("Could not save tag.", "error"); } }, [editingTag, addToast]);
  const handleDeleteTag = useCallback((tagId: string) => { setConfirmation({ title: "Delete Tag?", message: "Are you sure? This action cannot be undone.", onConfirm: () => { try { setTags(prevTags => prevTags.filter(t => t.id !== tagId)); setConfirmation(null); addToast("Tag deleted.", "success"); } catch (e) { console.error("Error deleting tag:", e); addToast("Could not delete tag.", "error"); } } }); }, [addToast]);
  const handleOpenAssignTagModal = useCallback((friend: Friend) => { setAssigningFriend(friend); setIsAssignTagModalOpen(true); }, []);
  const handleSaveFriendTags = useCallback((friendId: string, selectedTagIds: string[]) => { try { setTags(prevTags => prevTags.map(tag => { const hasFriend = tag.memberIds.includes(friendId); const shouldHaveFriend = selectedTagIds.includes(tag.id); if (hasFriend && !shouldHaveFriend) return { ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) }; if (!hasFriend && shouldHaveFriend) return { ...tag, memberIds: [...tag.memberIds, friendId] }; return tag; })); setIsAssignTagModalOpen(false); setAssigningFriend(null); addToast("Tags updated for friend.", "success"); } catch (e) { console.error("Error saving friend tags:", e); addToast("Could not update tags.", "error"); } }, [addToast]);
  const handleRemoveFriend = useCallback((friendId: string) => { const friendToRemove = friends.find(f => f.id === friendId); if (!friendToRemove) return; setConfirmation({ title: `Remove ${friendToRemove.username}?`, message: `This will remove them from all your tags.`, onConfirm: () => { try { setFriends(prev => prev.filter(f => f.id !== friendId)); setTags(prev => prev.map(tag => ({ ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) }))); setConfirmation(null); addToast(`${friendToRemove.username} removed.`, "success"); } catch (e) { console.error("Error removing friend:", e); addToast("Could not remove friend.", "error"); } } }); }, [friends, addToast]);
  
  // --- VISIBILITY & FILTER LOGIC ---
  const visibleSessions = useMemo(() => { const userTagIds = new Set<string>(); tags.forEach(tag => { if (tag.memberIds.includes(user.id)) { userTagIds.add(tag.id); } }); return sessions.filter(session => { if (session.privacy !== 'private') return true; if (session.creator_id === user.id) return true; if (session.visibleToTags) { return session.visibleToTags.some(tagId => userTagIds.has(tagId)); } return false; }); }, [sessions, user.id, tags]);
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => { const R = 6371e3; const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180; const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180; const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c; }
  const filterChips: FilterChip[] = (Object.keys(campusZones) as CampusZoneName[]).map(name => { const zone = campusZones[name]; const count = visibleSessions.filter(s => { if (name === 'All') return true; const d = getDistance(s.lat, s.lng, zone.coords[0], zone.coords[1]); return d <= zone.radius; }).length; return { name, count }; });
  const filteredSessions = visibleSessions.filter(s => { if (activeFilter === 'All') return true; const zone = campusZones[activeFilter]; const d = getDistance(s.lat, s.lng, zone.coords[0], zone.coords[1]); return d <= zone.radius; });
  const handleFilterSelect = useCallback((filter: CampusZoneName) => setActiveFilter(filter), []);
  
  // --- CREATE FLOW ---
  const handleCancelCreate = useCallback(() => { setIsCreateMenuOpen(false); setIsPlacementMode(false); setSelectedSessionType(null); setIsCreateModalOpen(false); setNewEventCoords(null); }, []);
  const handleCreateButtonClick = useCallback(() => { if (isCreateMenuOpen || isPlacementMode) { handleCancelCreate(); } else { setIsCreateMenuOpen(true); } }, [isCreateMenuOpen, isPlacementMode, handleCancelCreate]);
  const handleSelectSessionType = useCallback((type: SessionType) => { setSelectedSessionType(type); setIsPlacementMode(true); setIsCreateMenuOpen(false); }, []);
  const handleMapPlacement = useCallback((coords: { lat: number; lng: number }) => { if (activeVibe) { addToast("You are already in a Vibe.", 'info'); handleCancelCreate(); return; } setNewEventCoords(coords); setIsCreateModalOpen(true); setIsPlacementMode(false); }, [activeVibe, handleCancelCreate, addToast]);
  const handleCreateEvent = useCallback(async (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => { try { if (!newEventCoords || !sessionValid) return; 
// FIX: Removed non-existent 'creatorGender' property from Session object creation.
const newSession: Session = { ...eventData, id: Math.floor(Math.random() * 10000), lat: newEventCoords.lat, lng: newEventCoords.lng, creator_id: user.id, participants: [user.id], creator: { username: user.profile.username }, sessionType: selectedSessionType || 'vibe' }; setSessions(prevSessions => [...prevSessions, newSession]); setActiveVibe(newSession); handleCancelCreate(); addToast("Session created successfully!", "success"); } catch (e) { console.error("Error creating session:", e); addToast("Could not create session.", "error"); } }, [newEventCoords, sessionValid, user, selectedSessionType, handleCancelCreate, addToast]);
  
  // --- SESSION HANDLERS ---
  const handleRecenterMap = useCallback(() => mapViewRef.current?.recenter(), []);
  const handleCloseEvent = useCallback(async (sessionId: number) => { try { setSessions(prev => prev.filter(s => s.id !== sessionId)); if (activeVibe?.id === sessionId) { setActiveVibe(null); setIsChatVisible(false); } addToast("Session closed.", "info"); } catch (e) { console.error("Error closing session:", e); addToast("Could not close session.", "error"); } }, [activeVibe, addToast]);
  const handleExtendEvent = useCallback(async (sessionId: number, minutes: number) => { try { setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, duration: s.duration + minutes } : s)); addToast(`Session extended by ${minutes} minutes!`, "success"); } catch (e) { console.error("Error extending session:", e); addToast("Could not extend session.", "error"); } }, [addToast]);
  const handleJoinVibe = useCallback(async (sessionId: number, role: 'seeking' | 'offering' | 'participant' | 'giver' = 'participant') => { try { if (activeVibe) { addToast("You're already in a Vibe.", 'info'); return; } let joinedSession: Session | null = null; setSessions(prev => prev.map(s => { if (s.id === sessionId) { const newParticipants = [...s.participants, user.id]; let newRoles = s.participantRoles; if (role === 'seeking' || role === 'offering' || role === 'giver') { newRoles = { ...s.participantRoles, [user.id]: role }; } joinedSession = { ...s, participants: newParticipants, participantRoles: newRoles }; return joinedSession; } return s; })); if (joinedSession) { setActiveVibe(joinedSession); addToast(`Joined "${joinedSession.title}"!`, "success"); } } catch (e) { console.error("Error joining session:", e); addToast("Could not join session.", "error"); } }, [activeVibe, user.id, addToast]);
  const handleSendMessage = useCallback(async (text: string, isSystemMessage = false) => { try { if (!activeVibe) return; const sender = isSystemMessage ? { username: 'System' } : { username: user.profile.username }; const senderId = isSystemMessage ? 'system' : user.id; const newMessage: SessionMessage = { id: Math.floor(Math.random() * 10000), sender_id: senderId, session_id: activeVibe.id, text, created_at: new Date().toISOString(), sender }; setChatMessages(prev => [...prev, newMessage]); } catch (e) { console.error("Error sending message:", e); } }, [activeVibe, user.id, user.profile.username]);
  
  // --- SESSION EDGE CASES ---
  const handleLeaveVibe = useCallback(async (sessionId: number) => {
    try {
        const leavingSession = sessions.find(s => s.id === sessionId);
        if (!leavingSession) return;

        let newSessions = sessions.map(s => s.id === sessionId ? { ...s, participants: s.participants.filter(pId => pId !== user.id) } : s);
        const updatedSession = newSessions.find(s => s.id === sessionId);

        if (updatedSession && updatedSession.participants.length === 0) {
            // Last participant leaves, close session
            newSessions = newSessions.filter(s => s.id !== sessionId);
            addToast(`"${updatedSession.title}" has been closed.`, 'info');
        } else if (updatedSession && updatedSession.creator_id === user.id) {
            // Creator leaves, transfer ownership
            const newOwner = updatedSession.participants[0];
            const newOwnerProfile = friends.find(f => f.id === newOwner);
            if (newOwner && newOwnerProfile) {
                newSessions = newSessions.map(s => s.id === sessionId ? { ...s, creator_id: newOwner, creator: { username: newOwnerProfile.username } } : s);
                addToast(`You left. ${newOwnerProfile.username} is the new leader.`, 'info');
                createNotification({ type: 'ownership_transfer', session: { id: updatedSession.id, title: updatedSession.title, emoji: updatedSession.emoji } });
            }
        } else {
            addToast(`You left "${leavingSession.title}".`, 'info');
        }

        setSessions(newSessions);
        setActiveVibe(null);
        setIsChatVisible(false);

        if (leavingSession.sessionType === 'cookie' && leavingSession.creator_id !== user.id) {
            setVouchingSession(leavingSession);
        }
    } catch (e) {
        console.error("Error leaving session:", e);
        addToast("Could not leave session.", "error");
    }
  }, [sessions, user.id, friends, addToast, createNotification]);

  // Auto-close expired sessions
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        const closedSessionIds = new Set<number>();
        sessions.forEach(session => {
            if (session.status === 'active') {
                const endTime = new Date(session.event_time).getTime() + session.duration * 60 * 1000;
                if (now > endTime) {
                    closedSessionIds.add(session.id);
                    if (session.participants.includes(user.id)) {
                        addToast(`Session "${session.title}" has ended.`, 'info');
                    }
                }
            }
        });
        if (closedSessionIds.size > 0) {
            setSessions(prev => prev.filter(s => !closedSessionIds.has(s.id)));
            if (activeVibe && closedSessionIds.has(activeVibe.id)) {
                setActiveVibe(null);
                setIsChatVisible(false);
            }
        }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [sessions, activeVibe, user.id, addToast]);

  // --- OWNERSHIP & VOUCH HANDLERS ---
  const handleTransferOwnership = useCallback((sessionId: number, newOwnerId: string, newOwnerUsername: string) => { try { let oldCreatorUsername = ''; const updatedSessions = sessions.map(s => { if (s.id === sessionId) { oldCreatorUsername = s.creator.username; return { ...s, creator_id: newOwnerId, creator: { username: newOwnerUsername } }; } return s; }); setSessions(updatedSessions); if (activeVibe?.id === sessionId) { const updatedActiveVibe = updatedSessions.find(s => s.id === sessionId); if (updatedActiveVibe) setActiveVibe(updatedActiveVibe); } handleSendMessage(`👑 ${oldCreatorUsername} made ${newOwnerUsername} the new leader.`, true); createNotification({ type: 'ownership_transfer', session: { id: sessionId, title: activeVibe?.title || '', emoji: activeVibe?.emoji || '' } }); setConfirmation(null); addToast(`${newOwnerUsername} is now the leader.`, 'success'); } catch (e) { console.error("Error transferring ownership:", e); addToast("Could not transfer ownership.", "error"); } }, [sessions, activeVibe, handleSendMessage, createNotification, addToast]);
  const handleVouch = useCallback((creatorId: string, skill: string, rating: number) => { try { console.log(`Vouching for ${creatorId} in skill ${skill} with rating ${rating}`); const points = 10; setFriends(prev => prev.map(f => f.id === creatorId ? { ...f, cookieScore: f.cookieScore + points } : f)); setVouchingSession(null); addToast("Vouch submitted!", "success"); } catch (e) { console.error("Error vouching:", e); addToast("Could not submit vouch.", "error"); } }, [addToast]);
  
  // --- PROFILE & UI HANDLERS ---
  const handleOpenProfile = useCallback(async (username: string) => { addToast(`Viewing profile for ${username} is not yet implemented.`, 'info'); }, [addToast]);
  const handleViewFriendProfile = useCallback((friend: Friend) => { try { 
// FIX: Removed non-existent 'gender' property from Profile object creation. The 'gender' property does not exist on Friend or Profile types.
const userToView: User = { id: friend.id, email: `${friend.username.toLowerCase()}@campus.dev`, profile: { username: friend.username, bio: `A ${friend.branch} student graduating in ${friend.year}.`, branch: friend.branch, year: friend.year, expertise: [], interests: [], cookieScore: friend.cookieScore, privacy: 'public', skillScores: {}, vouchHistory: [] } }; setViewedUser(userToView); setIsProfileModalOpen(true); } catch (e) { console.error("Error viewing friend profile:", e); } }, []);
  const handleTabClick = useCallback((tab: AppTab) => setActiveTab(tab), []);

  // --- ACTIVE SESSION INDICATOR LOGIC ---
  const otherActiveUserSessions = useMemo(() => sessions.filter(s => s.id !== activeVibe?.id && s.participants.includes(user.id) && s.status === 'active' && (new Date(s.event_time).getTime() + s.duration * 60000) > Date.now()), [sessions, user.id, activeVibe]);
  const allActiveUserSessions = useMemo(() => activeVibe ? [activeVibe, ...otherActiveUserSessions] : otherActiveUserSessions, [activeVibe, otherActiveUserSessions]);
  const handleIndicatorTap = useCallback(() => { if (!activeVibe) return; setActiveTab('Home'); setIsChatVisible(true); setTimeout(() => mapViewRef.current?.flyToSession(activeVibe), 100); }, [activeVibe]);
  const handleRequestLeaveFromIndicator = useCallback(() => { if (!activeVibe) return; setConfirmation({ title: `Leave "${activeVibe.title}"?`, message: 'You will be removed from the session.', onConfirm: () => { handleLeaveVibe(activeVibe.id); setConfirmation(null); } }); }, [activeVibe, handleLeaveVibe]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-green-50 flex flex-col">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {activeTab === 'Home' ? ( <> <HomeHeader /> <FilterChipBar filters={filterChips} activeFilter={activeFilter} onSelectFilter={handleFilterSelect} /> </> ) : ( <PageHeader username={user.profile.username} onLogout={onLogout} /> )}
      
      <main className="flex-grow relative overflow-hidden">
        {error && (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md w-11/12" role="alert">{/* ... */}</div>)}
          <div className={`h-full w-full ${activeTab === 'Home' ? 'block' : 'hidden'}`}><MapView ref={mapViewRef} isVisible={activeTab === 'Home'} isCreateMode={isPlacementMode} userLocation={userLocation} onSetUserLocation={setUserLocation} onMapClick={handleMapPlacement} events={filteredSessions} user={user} activeVibe={activeVibe} onCloseEvent={handleCloseEvent} onExtendEvent={handleExtendEvent} onJoinVibe={handleJoinVibe} onViewChat={() => setIsChatVisible(true)} activeFilter={activeFilter} campusZones={campusZones} friends={friends}/> <div className="fixed bottom-20 right-6 z-[1000] flex flex-col items-center space-y-4"> <MyLocationButton onClick={handleRecenterMap} disabled={!userLocation} /> <CreateSessionMenu isOpen={isCreateMenuOpen} onSelectType={handleSelectSessionType} /> <CreateEventButton onClick={handleCreateButtonClick} isActive={isCreateMenuOpen || isPlacementMode} /> </div> </div>
          <div className={`h-full overflow-y-auto pb-16 ${activeTab === 'Social' ? 'block' : 'hidden'}`}><SocialPage user={user} friends={friends} tags={tags} friendRequests={friendRequests} onSaveTag={handleSaveTag} onDeleteTag={handleDeleteTag} onRemoveFriend={handleRemoveFriend} onSaveFriendTags={handleSaveFriendTags} onSendRequest={handleSendRequest} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onViewFriendProfile={handleViewFriendProfile} setConfirmation={setConfirmation} onOpenCreateTagModal={handleOpenCreateTagModal} onOpenEditTagModal={handleOpenEditTagModal} onOpenAssignTagModal={handleOpenAssignTagModal} /></div>
          <div className={`h-full overflow-y-auto pb-16 ${activeTab === 'Alerts' ? 'block' : 'hidden'}`}><AlertsPage user={user} notifications={notifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onDeleteNotification={handleDeleteNotification} onNotificationAction={handleNotificationAction} /></div>
          <div className={`h-full overflow-y-auto pb-24 ${activeTab === 'Profile' ? 'block' : 'hidden'}`}><ProfilePage user={user} onProfileUpdate={onProfileUpdate} sessions={sessions} /></div>
        
        <CreateEventModal isOpen={isCreateModalOpen} onClose={handleCancelCreate} onSubmit={handleCreateEvent} sessionType={selectedSessionType} tags={tags} friends={friends} user={user} />
        {activeVibe && ( <VibeChatPanel isOpen={isChatVisible} onClose={() => setIsChatVisible(false)} vibe={activeVibe} messages={chatMessages} user={user} onSendMessage={handleSendMessage} onLeaveVibe={handleLeaveVibe} onViewProfile={handleOpenProfile} onTransferOwnership={handleTransferOwnership} setConfirmation={setConfirmation} /> )}
        <ProfileQuickView isOpen={isProfileQuickViewOpen} onClose={() => setIsProfileQuickViewOpen(false)} user={user} onEditProfile={() => { setIsProfileQuickViewOpen(false); setIsSettingsModalOpen(true); }} />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} user={user} onSave={(profile) => { onProfileUpdate(profile); setIsSettingsModalOpen(false); }} />
        {viewedUser && ( <ProfileModal isOpen={isProfileModalOpen} onClose={() => { setViewedUser(null); setIsProfileModalOpen(false); }} userToView={viewedUser} /> )}
        {confirmation && ( <ConfirmationDialog isOpen={true} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation(null)} /> )}
        <CreateTagModal isOpen={isCreateTagModalOpen} onClose={() => setIsCreateTagModalOpen(false)} onSave={handleSaveTag} existingTag={editingTag} />
        {assigningFriend && ( <AssignTagModal isOpen={isAssignTagModalOpen} onClose={() => setIsAssignTagModalOpen(false)} friend={assigningFriend} tags={tags} onSave={handleSaveFriendTags} onCreateTag={handleOpenCreateTagModal} /> )}
        {vouchingSession && ( <VouchModal isOpen={true} onClose={() => setVouchingSession(null)} session={vouchingSession} onVouch={handleVouch} /> )}
        <ActiveSessionsModal isOpen={isAllSessionsModalOpen} onClose={() => setIsAllSessionsModalOpen(false)} sessions={allActiveUserSessions} onSessionSelect={(session) => { setIsAllSessionsModalOpen(false); setActiveTab('Home'); setTimeout(() => mapViewRef.current?.flyToSession(session), 100); }} />
      </main>
      
      {activeVibe && <ActiveSessionIndicator activeSession={activeVibe} otherSessionsCount={otherActiveUserSessions.length} onTap={handleIndicatorTap} onTapPlus={() => setIsAllSessionsModalOpen(true)} onLongPress={handleRequestLeaveFromIndicator} />}

      <BottomNavBar activeTab={activeTab} onTabClick={handleTabClick} />
    </div>
  );
};

export default MainApp;
