
// lib/supabaseService.ts - FIXED VERSION
import { supabase } from './supabaseClient';
import type {
  Session,
  SessionMessage,
  Friend,
  Tag,
  FriendRequest,
  Notification,
  Profile,
  Conversation,
  DirectMessage,
} from '../types';

// Helper function to handle Supabase responses
// FIX: Changed query parameter type from `Promise` to `PromiseLike` to support Supabase's thenable query builders.
async function handleResponse<T>(query: PromiseLike<{ data: T | null; error: any }>) {
  try {
    const { data, error } = await query;
    if (error) {
      console.error('Supabase API Error:', error.message, error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (e) {
    console.error('An unexpected error occurred:', e);
    return { data: null, error: e };
  }
}

// --- SESSIONS ---

export const fetchActiveSessions = () => {
  return handleResponse<Session[]>(
    supabase
      .from('sessions')
      .select(`
        *,
        creator:profiles!creator_id(username)
      `)
      .eq('status', 'active')
      .order('event_time', { ascending: false })
      .then(({ data, error }) => ({
        data: data ? data.map((s: any) => ({
          ...s,
          sessionType: s.session_type,
          event_time: s.event_time,
          creator_id: s.creator_id,
          visibleToTags: s.visible_to_tags || [],
          participantRoles: s.participant_roles || {},
          helpCategory: s.help_category,
          skillTag: s.skill_tag,
          expectedOutcome: s.expected_outcome,
          returnTime: s.return_time,
          creator: s.creator || { username: 'Unknown' }
        })) : null,
        error
      }))
  );
};

export const createSession = (sessionData: any) => {
  // Map frontend field names to database column names
  const dbData = {
    title: sessionData.title,
    description: sessionData.description || '',
    lat: sessionData.lat,
    lng: sessionData.lng,
    session_type: sessionData.sessionType,
    emoji: sessionData.emoji,
    event_time: sessionData.event_time,
    duration: sessionData.duration,
    status: sessionData.status || 'active',
    creator_id: sessionData.creator_id,
    participants: sessionData.participants || [],
    participant_roles: sessionData.participantRoles || {},
    privacy: sessionData.privacy || 'public',
    visible_to_tags: sessionData.visibleToTags || [],
    help_category: sessionData.helpCategory,
    skill_tag: sessionData.skillTag,
    expected_outcome: sessionData.expectedOutcome,
    return_time: sessionData.returnTime,
    urgency: sessionData.urgency,
    flow: sessionData.flow,
  };

  return handleResponse<Session[]>(
    supabase
      .from('sessions')
      .insert([dbData])
      .select(`
        *,
        creator:profiles!creator_id(username)
      `)
      .then(({ data, error }) => ({
        data: data ? data.map((s: any) => ({
          ...s,
          sessionType: s.session_type,
          event_time: s.event_time,
          creator_id: s.creator_id,
          visibleToTags: s.visible_to_tags || [],
          participantRoles: s.participant_roles || {},
          creator: s.creator || { username: 'Unknown' }
        })) : null,
        error
      }))
  );
};

export const updateSession = (sessionId: number, updates: Partial<any>) => {
  // Map frontend field names to database column names
  const dbUpdates: any = {};
  if (updates.participants) dbUpdates.participants = updates.participants;
  if (updates.participantRoles) dbUpdates.participant_roles = updates.participantRoles;
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.creator_id) dbUpdates.creator_id = updates.creator_id;

  return handleResponse<Session[]>(
    supabase
      .from('sessions')
      .update(dbUpdates)
      .eq('id', sessionId)
      .select(`
        *,
        creator:profiles!creator_id(username)
      `)
  );
};

export const deleteSession = (sessionId: number) => {
  return handleResponse<any>(
    supabase.from('sessions').delete().eq('id', sessionId)
  );
};

export const joinSession = async (
  sessionId: number,
  userId: string,
  role: 'seeking' | 'offering' | 'participant' | 'giver' = 'participant'
) => {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('participants, participant_roles')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return { data: null, error: error || new Error('Session not found') };
    }

    const newParticipants = [...new Set([...(session.participants || []), userId])];
    const newRoles = { ...(session.participant_roles || {}), [userId]: role };

    return updateSession(sessionId, {
      participants: newParticipants,
      participantRoles: newRoles,
    });
  } catch (e) {
    return { data: null, error: e };
  }
};

export const leaveSession = async (sessionId: number, userId: string) => {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('participants, participant_roles')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return { data: null, error: error || new Error('Session not found') };
    }

    const newParticipants = (session.participants || []).filter(
      (pId: string) => pId !== userId
    );
    const newRoles = { ...(session.participant_roles || {}) };
    delete newRoles[userId];

    return updateSession(sessionId, {
      participants: newParticipants,
      participantRoles: newRoles,
    });
  } catch (e) {
    return { data: null, error: e };
  }
};

// --- VOUCHING ---
export const createVouch = (voucherId: string, receiverId: string, sessionId: number, skill: string, points: number) => {
  const vouchData = {
    voucher_id: voucherId,
    receiver_id: receiverId,
    session_id: sessionId,
    skill,
    points,
  };
  return handleResponse<any>(
    supabase.from('vouches').insert([vouchData])
  );
};


// --- FRIENDS & SOCIAL ---

export const fetchFriends = async (userId: string) => {
  try {
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    if (friendshipsError) throw friendshipsError;
    if (!friendships || friendships.length === 0) {
      return { data: [], error: null };
    }

    const friendIds = friendships.map((f: any) => f.friend_id);

    const { data: friends, error: friendsError } = await supabase
      .from('profiles')
      .select('id, username, branch, year, cookie_score')
      .in('id', friendIds);

    if (friendsError) throw friendsError;

    const friendsWithMutuals: Friend[] = friends
      ? friends.map((p: any) => ({
          id: p.id,
          username: p.username,
          branch: p.branch,
          year: p.year,
          cookieScore: p.cookie_score,
          mutualFriends: 0,
        }))
      : [];

    return { data: friendsWithMutuals, error: null };
  } catch (error: any) {
    console.error('Error in fetchFriends:', error);
    return { data: null, error };
  }
};

export const fetchFriendRequests = (userId: string) => {
  return handleResponse<FriendRequest[]>(
    supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .then(({ data, error }) => ({
        data: data
          ? data.map((d: any) => ({
              id: d.id,
              fromUserId: d.from_user_id,
              toUserId: d.to_user_id,
            }))
          : null,
        error,
      }))
  );
};

export const sendFriendRequest = (fromUserId: string, toUserId: string) => {
  return handleResponse<any[]>(
    supabase
      .from('friend_requests')
      .insert([{ from_user_id: fromUserId, to_user_id: toUserId }])
      .select('id, from_user_id, to_user_id')
  );
};

export const acceptFriendRequest = async (
  requestId: string,
  fromUserId: string,
  toUserId: string
) => {
  try {
    const { error: error1 } = await supabase.from('friendships').insert([
      { user_id: fromUserId, friend_id: toUserId },
      { user_id: toUserId, friend_id: fromUserId },
    ]);
    if (error1) throw error1;

    const { error: error2 } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);
    if (error2) throw error2;

    return { data: true, error: null };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { data: null, error };
  }
};

export const rejectFriendRequest = (requestId: string) => {
  return handleResponse<any>(
    supabase.from('friend_requests').delete().eq('id', requestId)
  );
};

export const removeFriend = async (userId: string, friendId: string) => {
  try {
    const { error: error1 } = await supabase
      .from('friendships')
      .delete()
      .match({ user_id: userId, friend_id: friendId });
    if (error1) throw error1;

    const { error: error2 } = await supabase
      .from('friendships')
      .delete()
      .match({ user_id: friendId, friend_id: userId });
    if (error2) throw error2;

    return { data: true, error: null };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { data: null, error };
  }
};

// --- TAGS ---

export const fetchTags = (userId: string) => {
  return handleResponse<Tag[]>(
    supabase
      .from('tags')
      .select('*')
      .eq('creator_id', userId)
      .then(({ data, error }) => ({
        data: data
          ? data.map((t: any) => ({
              id: t.id,
              name: t.name,
              color: t.color,
              emoji: t.emoji,
              memberIds: t.member_ids || [],
            }))
          : null,
        error,
      }))
  );
};

export const createTag = (tagData: Omit<Tag, 'id' | 'memberIds'>, userId: string) => {
  const dataToInsert = {
    name: tagData.name,
    color: tagData.color,
    emoji: tagData.emoji,
    creator_id: userId,
    member_ids: [],
  };
  return handleResponse<Tag[]>(
    supabase
      .from('tags')
      .insert([dataToInsert])
      .select()
      .then(({ data, error }) => ({
        data: data
          ? data.map((t: any) => ({
              id: t.id,
              name: t.name,
              color: t.color,
              emoji: t.emoji,
              memberIds: t.member_ids || [],
            }))
          : null,
        error,
      }))
  );
};

export const updateTag = (tagId: string, updates: any) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.emoji) dbUpdates.emoji = updates.emoji;
  if (updates.memberIds !== undefined) dbUpdates.member_ids = updates.memberIds;

  return handleResponse<Tag[]>(
    supabase
      .from('tags')
      .update(dbUpdates)
      .eq('id', tagId)
      .select()
      .then(({ data, error }) => ({
        data: data
          ? data.map((t: any) => ({
              id: t.id,
              name: t.name,
              color: t.color,
              emoji: t.emoji,
              memberIds: t.member_ids || [],
            }))
          : null,
        error,
      }))
  );
};

export const deleteTag = (tagId: string) => {
  return handleResponse<any>(supabase.from('tags').delete().eq('id', tagId));
};

// --- PROFILES ---

export const updateUserProfile = (userId: string, profileData: Partial<any>) => {
  const dbData: any = {};
  if (profileData.username) dbData.username = profileData.username;
  if (profileData.bio !== undefined) dbData.bio = profileData.bio;
  if (profileData.branch) dbData.branch = profileData.branch;
  if (profileData.year) dbData.year = profileData.year;
  if (profileData.expertise) dbData.expertise = profileData.expertise;
  if (profileData.interests) dbData.interests = profileData.interests;
  if (profileData.privacy) dbData.privacy = profileData.privacy;

  return handleResponse<Profile[]>(
    supabase
      .from('profiles')
      .update(dbData)
      .eq('id', userId)
      .select()
      .then(({ data, error }) => ({
        data: data
          ? data.map((p: any) => ({
              username: p.username,
              bio: p.bio || '',
              branch: p.branch,
              year: p.year,
              expertise: p.expertise || [],
              interests: p.interests || [],
              cookieScore: p.cookie_score,
              privacy: p.privacy,
              skillScores: {}, // These are calculated client-side for now
              vouchHistory: [], // These are calculated client-side for now
            }))
          : null,
        error,
      }))
  );
};

// --- SEARCH ---

export const searchUsers = (query: string, currentUserId: string) => {
  return handleResponse<Friend[]>(
    supabase
      .from('profiles')
      .select('id, username, branch, year, cookie_score')
      .neq('id', currentUserId)
      .ilike('username', `%${query}%`)
      .limit(20)
      .then(({ data, error }) => ({
        data: data
          ? data.map((p: any) => ({
              id: p.id,
              username: p.username,
              branch: p.branch,
              year: p.year,
              cookieScore: p.cookie_score,
              mutualFriends: 0, // Not calculated
            }))
          : null,
        error,
      }))
  );
};

export const fetchProfilesByIds = (userIds: string[]) => {
  if (userIds.length === 0) return Promise.resolve({ data: [], error: null });
  return handleResponse<Friend[]>(
    supabase
      .from('profiles')
      .select('id, username, branch, year, cookie_score')
      .in('id', userIds)
      .then(({ data, error }) => ({
        data: data
          ? data.map((p: any) => ({
              id: p.id,
              username: p.username,
              branch: p.branch,
              year: p.year,
              cookieScore: p.cookie_score,
              mutualFriends: 0,
            }))
          : null,
        error,
      }))
  );
};

// --- SESSION HISTORY ---

export const fetchUserSessionHistory = (userId: string) => {
  return handleResponse<Session[]>(
    supabase
      .from('sessions')
      .select(`
        *,
        creator:profiles!creator_id(username)
      `)
      .eq('status', 'closed')
      .or(`creator_id.eq.${userId},participants.cs.{${userId}}`)
      .order('event_time', { ascending: false })
      .then(({ data, error }) => ({
        data: data
          ? data.map((s: any) => ({
              ...s,
              sessionType: s.session_type,
              event_time: s.event_time,
              creator_id: s.creator_id,
              creator: s.creator || { username: 'Unknown' },
            }))
          : null,
        error,
      }))
  );
};

// --- NOTIFICATIONS ---

export const fetchNotifications = (userId: string) => {
  return handleResponse<Notification[]>(
    supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(id, username),
        session:sessions(id, title, emoji),
        tag:tags(id, name)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => ({
        data: data
          ? data.map((n: any) => ({
              id: n.id,
              type: n.type,
              user: n.actor ? { id: n.actor.id, username: n.actor.username } : undefined,
              session: n.session
                ? { id: n.session.id, title: n.session.title, emoji: n.session.emoji }
                : undefined,
              tag: n.tag ? { id: n.tag.id, name: n.tag.name } : undefined,
              timestamp: n.created_at,
              isRead: n.is_read,
            }))
          : null,
        error,
      }))
  );
};

export const markNotificationAsRead = (notificationId: string) => {
  return handleResponse<any>(
    supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  );
};

export const markAllNotificationsAsRead = (userId: string) => {
  return handleResponse<any>(
    supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ recipient_id: userId, is_read: false })
  );
};

export const deleteNotification = (notificationId: string) => {
  return handleResponse<any>(
    supabase.from('notifications').delete().eq('id', notificationId)
  );
};

export const createNotification = (
  notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>,
  recipientId: string
) => {
  const payload = {
    type: notificationData.type,
    recipient_id: recipientId,
    actor_id: notificationData.user?.id,
    session_id: notificationData.session?.id,
    tag_id: notificationData.tag?.id,
  };
  return handleResponse<any[]>(supabase.from('notifications').insert([payload]));
};

// --- CONVERSATIONS & DIRECT MESSAGES ---

export const fetchConversationsForUser = (userId: string) => {
  return handleResponse<Conversation[]>(
    supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .then(({ data, error }) => ({
        data: data
          ? data.map((c: any) => ({
              id: c.id,
              participantIds: c.participant_ids,
              messages: [], // Messages fetched separately
              unreadCount: 0, // Unread count logic to be implemented
            }))
          : null,
        error,
      }))
  );
};

export const fetchMessagesForConversation = (conversationId: string) => {
  return handleResponse<DirectMessage[]>(
    supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp')
      .then(({ data, error }) => ({
        data: data
          ? data.map((m: any) => ({
              id: m.id,
              conversation_id: m.conversation_id,
              senderId: m.sender_id,
              text: m.text,
              timestamp: m.timestamp,
            }))
          : null,
        error,
      }))
  );
};

export const sendDirectMessage = (
  conversationId: string,
  senderId: string,
  text: string
) => {
  return handleResponse<any>(
    supabase
      .from('direct_messages')
      .insert([{ conversation_id: conversationId, sender_id: senderId, text }])
  );
};

// --- SESSION MESSAGES ---

export const fetchSessionMessages = (sessionId: number) => {
  return handleResponse<SessionMessage[]>(
    supabase
      .from('session_messages')
      .select(`
        *,
        sender:profiles!sender_id(username)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
  );
};

export const sendSessionMessage = (sessionId: number, userId: string, text: string) => {
  const message = { session_id: sessionId, sender_id: userId, text };
  return handleResponse<SessionMessage[]>(supabase.from('session_messages').insert([message]));
};
