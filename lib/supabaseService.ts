// lib/supabaseService.ts
import { supabase } from './supabaseClient';
import type {
  Session,
  SessionMessage,
  Friend,
  Tag,
  FriendRequest,
  Notification,
  Vouch,
  Profile,
  User,
  Conversation,
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// A helper function to handle Supabase responses
// FIX: Changed 'Promise' to 'PromiseLike' to correctly handle Supabase's thenable query builders, which are not full Promises.
async function handleResponse<T>(query: PromiseLike<{ data: T | null; error: any }>) {
  try {
    const { data, error } = await query;
    if (error) {
      console.error('Supabase API Error:', error.message);
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
      .select('*, creator:profiles!creator_id(username)')
      .eq('status', 'active')
      .order('event_time', { ascending: false })
  );
};

export const createSession = (sessionData: Omit<Session, 'id' | 'creator'>) => {
  return handleResponse<Session[]>(
    supabase.from('sessions').insert([sessionData]).select()
  );
};

export const updateSession = (sessionId: number, updates: Partial<Session>) => {
  return handleResponse<Session[]>(
    supabase.from('sessions').update(updates).eq('id', sessionId).select()
  );
};

export const deleteSession = (sessionId: number) => {
  return handleResponse<any>(
    supabase.from('sessions').delete().eq('id', sessionId)
  );
};

export const joinSession = async (sessionId: number, userId: string, role: 'seeking' | 'offering' | 'participant' | 'giver' = 'participant') => {
    // This should ideally be a transaction or an RPC call in a real app to prevent race conditions.
    const { data: session, error } = await handleResponse<Session>(
        supabase.from('sessions').select('participants, participantRoles').eq('id', sessionId).single()
    );

    if (error || !session) return { data: null, error: error || new Error("Session not found") };

    const newParticipants = [...new Set([...(session.participants || []), userId])];
    const newRoles = { ...(session.participantRoles || {}), [userId]: role };

    return updateSession(sessionId, { participants: newParticipants, participantRoles: newRoles });
};

export const leaveSession = async (sessionId: number, userId: string) => {
    // This should also be an RPC call for atomicity.
    const { data: session, error } = await handleResponse<Session>(
        supabase.from('sessions').select('participants, participantRoles').eq('id', sessionId).single()
    );

    if (error || !session) return { data: null, error: error || new Error("Session not found") };
    
    const newParticipants = (session.participants || []).filter(pId => pId !== userId);
    const newRoles = { ...(session.participantRoles || {}) };
    delete newRoles[userId];

    return updateSession(sessionId, { participants: newParticipants, participantRoles: newRoles });
};


// --- FRIENDS & SOCIAL ---

export const fetchFriends = async (userId: string) => {
  // Two-step fetch because the FK relationship is not defined in Supabase schema for direct join
  try {
    // Step 1: Get friend IDs from the friendships table
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    if (friendshipsError) {
      throw friendshipsError;
    }

    if (!friendships || friendships.length === 0) {
      return { data: [], error: null };
    }

    const friendIds = friendships.map(f => f.friend_id);

    // Step 2: Get profiles of those friends
    const { data: friends, error: friendsError } = await supabase
      .from('profiles')
      .select('id, username, branch, year, cookieScore')
      .in('id', friendIds);
    
    if (friendsError) {
      throw friendsError;
    }
    
    // The Friend type expects `mutualFriends`. This is hard to calculate here.
    const friendsWithMutuals: Friend[] = friends 
      ? friends.map(p => ({
          ...p,
          mutualFriends: 0, // Cannot calculate this easily. Setting to 0.
        })) 
      : [];
      
    return { data: friendsWithMutuals, error: null };
  } catch (error) {
    const supabaseError = error as { message: string };
    console.error('Supabase API Error in fetchFriends:', supabaseError.message);
    return { data: null, error: supabaseError };
  }
};


export const fetchFriendRequests = (userId: string) => {
  return handleResponse<FriendRequest[]>(
    supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .then(({ data, error }) => ({
        data: data ? data.map((d: any) => ({
          id: d.id,
          fromUserId: d.from_user_id,
          toUserId: d.to_user_id
        })) as FriendRequest[] : null,
        error
      }))
  );
};

export const sendFriendRequest = (fromUserId: string, toUserId: string) => {
  return handleResponse<FriendRequest[]>(
    supabase.from('friend_requests').insert([{ from_user_id: fromUserId, to_user_id: toUserId }]).select('id, from_user_id, to_user_id')
  );
};

export const acceptFriendRequest = async (requestId: string, fromUserId: string, toUserId: string) => {
  // This should be a transaction in a real application.
  try {
    // Add friendships both ways
    const { error: error1 } = await supabase.from('friendships').insert([
        { user_id: fromUserId, friend_id: toUserId },
        { user_id: toUserId, friend_id: fromUserId }
    ]);
    if (error1) throw error1;

    // Delete the request
    const { error: error2 } = await rejectFriendRequest(requestId);
    if (error2) throw error2;

    return { data: true, error: null };
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return { data: null, error };
  }
};

export const rejectFriendRequest = (requestId: string) => {
  return handleResponse<any>(
    supabase.from('friend_requests').delete().eq('id', requestId)
  );
};

export const removeFriend = async (userId: string, friendId: string) => {
  // This should be a transaction.
  try {
      const { error: error1 } = await supabase.from('friendships').delete().match({ user_id: userId, friend_id: friendId });
      if (error1) throw error1;
      
      const { error: error2 } = await supabase.from('friendships').delete().match({ user_id: friendId, friend_id: userId });
      if (error2) throw error2;
      
      return { data: true, error: null };
  } catch (error) {
      console.error("Error removing friend:", error);
      return { data: null, error };
  }
};

// --- TAGS ---

export const fetchTags = (userId: string) => {
  return handleResponse<Tag[]>(
    supabase.from('tags').select('*').eq('creator_id', userId)
  );
};

export const createTag = (tagData: Omit<Tag, 'id' | 'memberIds'>, userId: string) => {
  const dataToInsert = { ...tagData, creator_id: userId, memberIds: [] };
  return handleResponse<Tag[]>(
    supabase.from('tags').insert([dataToInsert]).select()
  );
};

export const updateTag = (tagId: string, updates: Partial<Tag>) => {
  return handleResponse<Tag[]>(
    supabase.from('tags').update(updates).eq('id', tagId).select()
  );
};

export const deleteTag = (tagId: string) => {
  return handleResponse<any>(
    supabase.from('tags').delete().eq('id', tagId)
  );
};

// --- MESSAGES ---

export const fetchSessionMessages = (sessionId: number) => {
  return handleResponse<SessionMessage[]>(
    supabase
      .from('session_messages')
      .select('*, sender:profiles!sender_id(username)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
  );
};

export const sendSessionMessage = (sessionId: number, userId: string, text: string) => {
  const message = { session_id: sessionId, sender_id: userId, text };
  return handleResponse<SessionMessage[]>(
    supabase.from('session_messages').insert([message])
  );
};

// --- DIRECT MESSAGES & CONVERSATIONS ---
export const fetchConversationsForUser = (userId: string) => {
    return handleResponse<Conversation[]>(
        supabase.from('conversations').select('*').contains('participant_ids', [userId])
    );
};
export const fetchMessagesForConversation = (conversationId: string) => {
    return handleResponse<any[]>(
        supabase.from('direct_messages').select('*').eq('conversation_id', conversationId).order('timestamp')
    );
};
export const sendDirectMessage = (conversationId: string, senderId: string, text: string) => {
    return handleResponse<any>(
        supabase.from('direct_messages').insert([{ conversation_id: conversationId, sender_id: senderId, text }])
    );
};

// --- NOTIFICATIONS ---

export const fetchNotifications = (userId: string) => {
    return handleResponse<any[]>( // Changed to any[] to handle raw DB response
        supabase
            .from('notifications')
            .select('*, actor:profiles!actor_id(id, username), session:sessions(id, title, emoji), tag:tags(id, name)')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
    );
};


export const markNotificationAsRead = (notificationId: string) => {
    return handleResponse<any>(
        supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
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

export const createNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>, recipientId: string) => {
    // Map the rich object to a DB-insertable payload
    const payload = {
        type: notificationData.type,
        recipient_id: recipientId,
        actor_id: notificationData.user?.id,
        session_id: notificationData.session?.id,
        tag_id: notificationData.tag?.id
    };
    return handleResponse<any[]>(
        supabase.from('notifications').insert([payload])
    );
};


// --- VOUCHES ---

export const createVouch = (vouchData: Omit<Vouch, 'id'>) => {
    // A database trigger should handle updating the user's cookie score
    // after a new vouch is inserted.
    return handleResponse<Vouch[]>(
        supabase.from('vouches').insert([vouchData])
    );
};

// --- PROFILES ---
export const updateUserProfile = (userId: string, profileData: Partial<Profile>) => {
    return handleResponse<Profile[]>(
        supabase.from('profiles').update(profileData).eq('id', userId).select()
    );
};

// NEW: Search for users
export const searchUsers = (query: string, currentUserId: string) => {
  return handleResponse<Friend[]>(
    supabase
      .from('profiles')
      .select('id, username, branch, year, cookieScore')
      .neq('id', currentUserId)
      .ilike('username', `%${query}%`)
      .limit(20)
      .then(({ data, error }) => ({
        // Map to Friend type, mutualFriends will be 0 as it's hard to calculate
        data: data ? data.map(p => ({ ...p, mutualFriends: 0 })) : null,
        error
      }))
  );
};

// NEW: Fetch user session history
export const fetchUserSessionHistory = (userId: string) => {
  return handleResponse<Session[]>(
    supabase
      .from('sessions')
      .select('*, creator:profiles!creator_id(username)')
      .eq('status', 'closed')
      .or(`creator_id.eq.${userId},participants.cs.{${userId}}`) // cs = contains
      .order('event_time', { ascending: false })
  );
};

// NEW: Fetch profiles by an array of IDs
export const fetchProfilesByIds = (userIds: string[]) => {
    if (userIds.length === 0) return Promise.resolve({ data: [], error: null });
    return handleResponse<Friend[]>(
        supabase
            .from('profiles')
            .select('id, username, branch, year, cookieScore')
            .in('id', userIds)
            .then(({ data, error }) => ({
                data: data ? data.map(p => ({ ...p, mutualFriends: 0 })) : null,
                error
            }))
    );
};
