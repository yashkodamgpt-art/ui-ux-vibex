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
  } catch (error: any) {
    console.error('Error accepting friend request:', error.message || error);
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
              memberIds: t.member_ids