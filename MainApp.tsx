
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
import CreateSessionMenu from './components/sessions/CreateSessionMenu';
import FilterChipBar, { type CampusZoneName, type FilterChip } from './components/filters/FilterChipBar';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import CreateTagModal from './components/social/CreateTagModal';
import AssignTagModal from './components/social/AssignTagModal';
import VouchModal from './components/sessions/VouchModal';
import ActiveSessionIndicator from './components/sessions/ActiveSessionIndicator';
import ActiveSessionsModal from './components/sessions/ActiveSessionsModal';
import ToastContainer, { type Toast } from './components/common/ToastContainer';
import * as supabaseService from './lib/supabaseService';
import * as subscriptions from './lib/subscriptions';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeVibe, setActiveVibe] = useState<Session | null>(null);
  
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventCoords, setNewEventCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [activeFilter, setActiveFilter] = useState<CampusZoneName>('All');
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
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
  const messageSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [vouchingSession, setVouchingSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadSessions = async () => {
        setSessionsLoading(true);
        const { data, error } = await supabaseService.fetchActiveSessions();
        if (error) {
            addToast('Could not load active sessions.', 'error');
            setError('Could not load active sessions.');
        } else {
            setSessions(data || []);
        }
        setSessionsLoading(false);
    };
    loadSessions();
  }, [addToast]);
  
  useEffect(() => {
    const loadSocialData = async () => {
        const [friendsRes, tagsRes, requestsRes] = await Promise.all([
            supabaseService.fetchFriends(user.id),
            supabaseService.fetchTags(user.id),
            supabaseService.fetchFriendRequests(user.id)
        ]);

        if (friendsRes.error) addToast('Could not load friends.', 'error');
        else setFriends(friendsRes.data || []);

        if (tagsRes.error) addToast('Could not load tags.', 'error');
        else setTags(tagsRes.data || []);
        
        if (requestsRes.error) addToast('Could not load friend requests.', 'error');
        else setFriendRequests(requestsRes.data || []);
    };
    loadSocialData();
  }, [user.id, addToast]);

  useEffect(() => {
      const loadNotifications = async () => {
          const { data, error } = await supabaseService.fetchNotifications(user.id);
          if (error) {
              addToast('Could not load notifications.', 'error');
          } else {
              setNotifications(data || []);
          }
      };
      loadNotifications();
      
      const channel = subscriptions.subscribeToNotifications(user.id, (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
          addToast('You have a new notification!', 'info');
      });

      return () => {
          channel.unsubscribe();
      };
  }, [user.id, addToast]);
  
  // --- SESSION MESSAGES: FETCH & SUBSCRIBE ---
  useEffect(() => {
    const setupMessages = async () => {
        if (activeVibe) {
            // Fetch initial messages
            const { data, error } = await supabaseService.fetchSessionMessages(activeVibe.id);
            if (error) {
                addToast('Could not load chat messages.', 'error');
                setChatMessages([]);
            } else {
                setChatMessages(data || []);
            }

            // Unsubscribe from previous channel if it exists
            if (messageSubscriptionRef.current) {
                messageSubscriptionRef.current.unsubscribe();
            }

            // Subscribe to new messages
            const channel = subscriptions.subscribeToSessionMessages(activeVibe.id, (payload) => {
                const newMessage = payload.new as SessionMessage;
                setChatMessages(prev => {
                    // Prevent duplicates if a message with the same ID already exists
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            });
            messageSubscriptionRef.current = channel;

        } else {
            // Clean up when no vibe is active
            setChatMessages([]);
            if (messageSubscriptionRef.current) {
                messageSubscriptionRef.current.unsubscribe();
                messageSubscriptionRef.current = null;
            }
        }
    };

    setupMessages();

    // Cleanup on component unmount
    return () => {
        if (messageSubscriptionRef.current) {
            messageSubscriptionRef.current.unsubscribe();
        }
    };
  }, [activeVibe, addToast]);


  // --- NOTIFICATION HANDLERS ---
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    await supabaseService.markNotificationAsRead(notificationId);
  }, []);
  const handleMarkAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await supabaseService.markAllNotificationsAsRead(user.id);
  }, [user.id]);
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    await supabaseService.deleteNotification(notificationId);
  }, []);
  const createNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>, recipientId: string) => {
      await supabaseService.createNotification(notificationData, recipientId);
  }, []);
  
  // --- SOCIAL HANDLERS (with try-catch) ---
  const handleSocialActions = useMemo(() => ({
    handleSendRequest: async (toUserId: string) => {
      const { data, error } = await supabaseService.sendFriendRequest(user.id, toUserId);
      if (error || !data) {
        addToast("Could not send request.", "error");
      } else {
        const newRequest: FriendRequest = { id: data[0].id, fromUserId: user.id, toUserId };
        setFriendRequests(prev => [...prev, newRequest]);
        addToast('Friend request sent!', 'success');
      }
    },
    handleAcceptRequest: async (fromUserId: string) => {
      const request = friendRequests.find(req => req.fromUserId === fromUserId && req.toUserId === user.id);
      if (!request) {
        addToast('Friend request not found.', 'error');
        return;
      }
      const { error } = await supabaseService.acceptFriendRequest(request.id, fromUserId, user.id);
      if (error) {
        addToast("Could not accept request.", "error");
      } else {
        addToast(`Friend request accepted!`, 'success');
        // Refetch friends and requests for consistency
        const [friendsRes, requestsRes] = await Promise.all([
            supabaseService.fetchFriends(user.id),
            supabaseService.fetchFriendRequests(user.id)
        ]);
        if (friendsRes.data) setFriends(friendsRes.data);
        if (requestsRes.data) setFriendRequests(requestsRes.data);
      }
    },
    handleRejectRequest: async (fromUserId: string) => {
      const request = friendRequests.find(req => req.fromUserId === fromUserId && req.toUserId === user.id);
      if (!request) {
        addToast('Friend request not found.', 'error');
        return;
      }
      const { error } = await supabaseService.rejectFriendRequest(request.id);
      if (error) {
        addToast("Could not reject request.", "error");
      } else {
        setFriendRequests(prev => prev.filter(req => req.id !== request.id));
        addToast('Friend request rejected.', 'info');
      }
    },
  }), [user.id, addToast, friendRequests]);
  const { handleSendRequest, handleAcceptRequest, handleRejectRequest } = handleSocialActions;

  const handleNotificationAction = useCallback((notification: Notification, action: 'accept' | 'reject' | 'view') => { try { console.log(`Action '${action}' on notification:`, notification); if (notification.type === 'friend_request_received' && notification.user) { if (action === 'accept') { handleAcceptRequest(notification.user.id); } else if (action === 'reject') { handleRejectRequest(notification.user.id); } handleDeleteNotification(notification.id); } else if (action === 'view' && notification.session) { addToast(`Navigating to "${notification.session.title}"...`, 'info'); setActiveTab('Home'); setTimeout(() => { const sessionToFly = sessions.find(s => s.id === notification.session?.id); if (sessionToFly) mapViewRef.current?.flyToSession(sessionToFly); }, 100); handleMarkAsRead(notification.id); } } catch (e) { console.error("Error handling notification action:", e); } }, [handleAcceptRequest, handleRejectRequest, handleDeleteNotification, addToast, sessions, handleMarkAsRead]);
  const handleOpenCreateTagModal = useCallback(() => { setEditingTag(null); setIsCreateTagModalOpen(true); }, []);
  const handleOpenEditTagModal = useCallback((tag: Tag) => { setEditingTag(tag); setIsCreateTagModalOpen(true); }, []);
  const handleSaveTag = useCallback(async (tagData: Omit<Tag, 'id' | 'memberIds'>) => {
    if (editingTag) {
        const { data, error } = await supabaseService.updateTag(editingTag.id, tagData);
        if (error || !data) { addToast("Could not update tag.", "error"); } 
        else { setTags(prev => prev.map(t => t.id === editingTag.id ? data[0] : t)); addToast("Tag updated!", "success"); }
    } else {
        const { data, error } = await supabaseService.createTag(tagData, user.id);
        if (error || !data) { addToast("Could not create tag.", "error"); } 
        else { setTags(prev => [...prev, data[0]]); addToast("Tag created!", "success"); }
    }
    setIsCreateTagModalOpen(false);
    setEditingTag(null);
  }, [editingTag, addToast, user.id]);
  const handleDeleteTag = useCallback((tagId: string) => { setConfirmation({ title: "Delete Tag?", message: "Are you sure? This action cannot be undone.", onConfirm: async () => { const { error } = await supabaseService.deleteTag(tagId); if (error) { addToast("Could not delete tag.", "error"); } else { setTags(prevTags => prevTags.filter(t => t.id !== tagId)); addToast("Tag deleted.", "success"); } setConfirmation(null); } }); }, [addToast]);
  const handleOpenAssignTagModal = useCallback((friend: Friend) => { setAssigningFriend(friend); setIsAssignTagModalOpen(true); }, []);
  const handleSaveFriendTags = useCallback(async (friendId: string, selectedTagIds: string[]) => {
    const originalTags = tags.map(t => ({...t})); // Deep copy for revert
    const updatedTags = tags.map(tag => {
        const hasFriend = tag.memberIds.includes(friendId);
        const shouldHaveFriend = selectedTagIds.includes(tag.id);
        if (hasFriend && !shouldHaveFriend) return { ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) };
        if (!hasFriend && shouldHaveFriend) return { ...tag, memberIds: [...tag.memberIds, friendId] };
        return tag;
    });
    setTags(updatedTags); // Optimistic update
    setIsAssignTagModalOpen(false); 
    setAssigningFriend(null);

    try {
        const updatePromises = updatedTags
            .filter((tag, i) => JSON.stringify(tag.memberIds) !== JSON.stringify(originalTags[i].memberIds))
            .map(tag => supabaseService.updateTag(tag.id, { memberIds: tag.memberIds }));
        
        await Promise.all(updatePromises);
        addToast("Tags updated for friend.", "success");
    } catch (e) {
        console.error("Error saving friend tags:", e);
        addToast("Could not update tags.", "error");
        setTags(originalTags); // Revert on error
    }
  }, [addToast, tags]);
  const handleRemoveFriend = useCallback((friendId: string) => {
    const friendToRemove = friends.find(f => f.id === friendId);
    if (!friendToRemove) return;
    setConfirmation({
        title: `Remove ${friendToRemove.username}?`,
        message: `This will remove them from all your tags.`,
        onConfirm: async () => {
            const { error } = await supabaseService.removeFriend(user.id, friendId);
            if (error) {
                addToast("Could not remove friend.", "error");
            } else {
                setFriends(prev => prev.filter(f => f.id !== friendId));
                setTags(prev => prev.map(tag => ({ ...tag, memberIds: tag.memberIds.filter(id => id !== friendId) })));
                addToast(`${friendToRemove.username} removed.`, "success");
            }
            setConfirmation(null);
        }
    });
  }, [friends, addToast, user.id]);
  
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
  const handleCreateEvent = useCallback(async (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants'>) => {
    try {
        if (!newEventCoords || !sessionValid || !selectedSessionType) return;
        const newSessionData = {
            ...eventData,
            lat: newEventCoords.lat,
            lng: newEventCoords.lng,
            creator_id: user.id,
            participants: [user.id],
            sessionType: selectedSessionType,
        };

        const { data, error } = await supabaseService.createSession(newSessionData as any);

        if (error || !data || data.length === 0) {
            throw error || new Error('Session creation returned no data.');
        }

        const createdSession: Session = {
            ...data[0],
            creator: { username: user.profile.username }
        };

        setSessions(prevSessions => [createdSession, ...prevSessions]);
        setActiveVibe(createdSession);
        handleCancelCreate();
        addToast("Session created successfully!", "success");
    } catch (e) {
        console.error("Error creating session:", e);
        addToast("Could not create session.", "error");
    }
  }, [newEventCoords, sessionValid, user, selectedSessionType, handleCancelCreate, addToast]);
  
  // --- SESSION HANDLERS ---
  const onViewChat = useCallback(() => setIsChatVisible(true), []);
  const handleRecenterMap = useCallback(() => mapViewRef.current?.recenter(), []);
  const handleCloseEvent = useCallback(async (sessionId: number) => {
    try {
        const { error } = await supabaseService.deleteSession(sessionId);
        if (error) throw error;
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeVibe?.id === sessionId) {
            setActiveVibe(null);
            setIsChatVisible(false);
        }
        addToast("Session closed.", "info");
    } catch (e) {
        console.error("Error closing session:", e);
        addToast("Could not close session.", "error");
    }
  }, [activeVibe, addToast]);
  const handleExtendEvent = useCallback(async (sessionId: number, minutes: number) => {
    try {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        const newDuration = session.duration + minutes;
        const { error } = await supabaseService.updateSession(sessionId, { duration: newDuration });
        if (error) throw error;
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, duration: newDuration } : s));
        addToast(`Session extended by ${minutes} minutes!`, "success");
    } catch (e) {
        console.error("Error extending session:", e);
        addToast("Could not extend session.", "error");
    }
  }, [addToast, sessions]);
  const handleJoinVibe = useCallback(async (sessionId: number, role: 'seeking' | 'offering' | 'participant' | 'giver' = 'participant') => {
    try {
        if (activeVibe) {
            addToast("You're already in a Vibe.", 'info');
            return;
        }
        const { data, error } = await supabaseService.joinSession(sessionId, user.id, role);
        if (error || !data || data.length === 0) {
            throw error || new Error('Join session returned no data.');
        }
        const updatedSessionData = data[0];
        const originalSession = sessions.find(s => s.id === sessionId);
        const joinedSession: Session = { ...originalSession, ...updatedSessionData } as Session;
        setSessions(prev => prev.map(s => (s.id === sessionId ? joinedSession : s)));
        setActiveVibe(joinedSession);
        addToast(`Joined "${joinedSession.title}"!`, "success");
    } catch (e) {
        console.error("Error joining session:", e);
        addToast("Could not join session.", "error");
    }
  }, [activeVibe, user.id, addToast, sessions]);
  
  const handleSendMessage = useCallback(async (text: string, isSystemMessage = false) => {
    if (!activeVibe) return;

    if (isSystemMessage) {
        // System messages are local-only and not persisted
        const newMessage: SessionMessage = {
            id: Math.random(), // Temporary ID
            sender_id: 'system',
            session_id: activeVibe.id,
            text,
            created_at: new Date().toISOString(),
            sender: { username: 'System' }
        };
        setChatMessages(prev => [...prev, newMessage]);
        return;
    }

    // For user messages, send to backend and let the subscription handle the update.
    const { error } = await supabaseService.sendSessionMessage(activeVibe.id, user.id, text);
    
    if (error) {
        addToast('Message could not be sent.', 'error');
    }
  }, [activeVibe, user.id, addToast]);
  
  // --- SESSION EDGE CASES ---
  const handleLeaveVibe = useCallback(async (sessionId: number) => {
    try {
        const leavingSession = sessions.find(s => s.id === sessionId);
        if (!leavingSession) return;

        const isCreatorLeaving = leavingSession.creator_id === user.id;
        const remainingParticipants = leavingSession.participants.filter(pId => pId !== user.id);
        
        if (remainingParticipants.length === 0) {
            const { error } = await supabaseService.deleteSession(sessionId);
            if (error) throw error;
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            addToast(`"${leavingSession.title}" has been closed.`, 'info');
        } else if (isCreatorLeaving) {
            const newOwnerId = remainingParticipants[0];
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('username').eq('id', newOwnerId).single();
            if (profileError || !profileData) throw profileError || new Error("Could not find new owner's profile.");
            const newOwnerUsername = profileData.username;

            const { error } = await supabaseService.updateSession(sessionId, { creator_id: newOwnerId, participants: remainingParticipants });
            if (error) throw error;

            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, creator_id: newOwnerId, creator: { username: newOwnerUsername }, participants: remainingParticipants } : s));
            addToast(`You left. ${newOwnerUsername} is the new leader.`, 'info');
        } else {
            const { error } = await supabaseService.leaveSession(sessionId, user.id);
            if (error) throw error;
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, participants: remainingParticipants } : s));
            addToast(`You left "${leavingSession.title}".`, 'info');
        }

        setActiveVibe(null);
        setIsChatVisible(false);

        if (leavingSession.sessionType === 'cookie' && leavingSession.creator_id !== user.id) {
            setVouchingSession(leavingSession);
        }
    } catch (e) {
        console.error("Error leaving session:", e);
        addToast("Could not leave session.", "error");
    }
  }, [sessions, user.id, addToast]);

  // Auto-close expired sessions
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        const sessionsToClose: Session[] = [];
        sessions.forEach(session => {
            if (session.status === 'active') {
                const endTime = new Date(session.event_time).getTime() + session.duration * 60 * 1000;
                if (now > endTime) {
                    sessionsToClose.push(session);
                }
            }
        });
        if (sessionsToClose.length > 0) {
            sessionsToClose.forEach(session => {
                supabaseService.updateSession(session.id, { status: 'closed' });
                if (session.participants.includes(user.id)) {
                    addToast(`Session "${session.title}" has ended.`, 'info');
                }
            });
            const closedSessionIds = new Set(sessionsToClose.map(s => s.id));
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
  const handleTransferOwnership = useCallback(async (sessionId: number, newOwnerId: string, newOwnerUsername: string) => {
    try {
        const { error } = await supabaseService.updateSession(sessionId, { creator_id: newOwnerId });
        if (error) throw error;
        let oldCreatorUsername = '';
        const updatedSessions = sessions.map(s => {
            if (s.id === sessionId) {
                oldCreatorUsername = s.creator.username;
                return { ...s, creator_id: newOwnerId, creator: { username: newOwnerUsername } };
            }
            return s;
        });
        setSessions(updatedSessions);
        if (activeVibe?.id === sessionId) {
            const updatedActiveVibe = updatedSessions.find(s => s.id === sessionId);
            if (updatedActiveVibe) setActiveVibe(updatedActiveVibe);
        }
        handleSendMessage(`👑 ${oldCreatorUsername} made ${newOwnerUsername} the new leader.`, true);
        createNotification({ type: 'ownership_transfer', session: { id: sessionId, title: activeVibe?.title || '', emoji: activeVibe?.emoji || '' }, user: { id: user.id, username: user.profile.username } }, newOwnerId);
        setConfirmation(null);
        addToast(`${newOwnerUsername} is now the leader.`, 'success');
    } catch (e) {
        console.error("Error transferring ownership:", e);
        addToast("Could not transfer ownership.", "error");
    }
  }, [sessions, activeVibe, handleSendMessage, createNotification, addToast, user]);
  const handleVouch = useCallback((creatorId: string, skill: string, rating: number) => { try { console.log(`Vouching for ${creatorId} in skill ${skill} with rating ${rating}`); const points = 10; setFriends(prev => prev.map(f => f.id === creatorId ? { ...f, cookieScore: f.cookieScore + points } : f)); setVouchingSession(null); addToast("Vouch submitted!", "success"); } catch (e) { console.error("Error vouching:", e); addToast("Could not submit vouch.", "error"); } }, [addToast]);
  
  // --- PROFILE & UI HANDLERS ---
  const handleOpenProfile = useCallback(async (username: string) => { addToast(`Viewing profile for ${username} is not yet implemented.`, 'info'); }, [addToast]);
  const handleViewFriendProfile = useCallback((friend: Friend) => { try { 
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
          <div className={`h-full w-full ${activeTab === 'Home' ? 'block' : 'hidden'}`}><MapView ref={mapViewRef} isVisible={activeTab === 'Home'} isCreateMode={isPlacementMode} userLocation={userLocation} onSetUserLocation={setUserLocation} onMapClick={handleMapPlacement} events={filteredSessions} user={user} activeVibe={activeVibe} onCloseEvent={handleCloseEvent} onExtendEvent={handleExtendEvent} onJoinVibe={handleJoinVibe} onViewChat={onViewChat} activeFilter={activeFilter} campusZones={campusZones} friends={friends}/> <div className="fixed bottom-20 right-6 z-[1000] flex flex-col items-center space-y-4"> <MyLocationButton onClick={handleRecenterMap} disabled={!userLocation} /> <CreateSessionMenu isOpen={isCreateMenuOpen} onSelectType={handleSelectSessionType} /> <CreateEventButton onClick={handleCreateButtonClick} isActive={isCreateMenuOpen || isPlacementMode} /> </div> </div>
          <div className={`h-full overflow-y-auto pb-16 ${activeTab === 'Social' ? 'block' : 'hidden'}`}><SocialPage user={user} friends={friends} tags={tags} friendRequests={friendRequests} onSaveTag={handleSaveTag} onDeleteTag={handleDeleteTag} onRemoveFriend={handleRemoveFriend} onSaveFriendTags={handleSaveFriendTags} onSendRequest={handleSendRequest} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onViewFriendProfile={handleViewFriendProfile} setConfirmation={setConfirmation} onOpenCreateTagModal={handleOpenCreateTagModal} onOpenEditTagModal={handleOpenEditTagModal} onOpenAssignTagModal={handleOpenAssignTagModal} /></div>
          <div className={`h-full overflow-y-auto pb-16 ${activeTab === 'Alerts' ? 'block' : 'hidden'}`}><AlertsPage user={user} friends={friends} notifications={notifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onDeleteNotification={handleDeleteNotification} onNotificationAction={handleNotificationAction} /></div>
          <div className={`h-full overflow-y-auto pb-24 ${activeTab === 'Profile' ? 'block' : 'hidden'}`}><ProfilePage user={user} onProfileUpdate={onProfileUpdate} /></div>
        
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