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
// FIX: Changed the catch variable from `e` to `error` for consistency and to prevent a potential "Cannot find name 'error'" issue if the return statement was incorrect.
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return { data: null, error };
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

const mapConversation = (dbConvo: any): Omit<Conversation, 'messages' | 'unreadCount'> => {
  return {
    id: dbConvo.id,
    participantIds: dbConvo.participant_ids,
  };
};

export const getOrCreateConversation = async (userId1: string, userId2: string): Promise<{ data: Omit<Conversation, 'messages' | 'unreadCount'> | null; error: any }> => {
  const participants = [userId1, userId2].sort();

  // 1. Find existing
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', participants);
  
  if (findError) {
    console.error("Error finding conversation:", findError);
    return { data: null, error: findError };
  }

  // .contains can return multiple, find the exact match
  const exactMatch = existing?.find(c => c.participant_ids.length === 2);
  
  if (exactMatch) {
    return { data: mapConversation(exactMatch), error: null };
  }

  // 2. Create new
  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ participant_ids: participants })
    .select()
    .single();

  if (createError) {
    console.error("Error creating conversation:", createError);
    return { data: null, error: createError };
  }

  return { data: mapConversation(created), error: null };
};


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
              memberIds: t.member_ids || [],
            }))
          : null,
        error,
      }))
  );
};

export const updateTag = (tagId: string, updates: Partial<Omit<Tag, 'id'>>) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.emoji) dbUpdates.emoji = updates.emoji;
  if (updates.memberIds) dbUpdates.member_ids = updates.memberIds;
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


// --- USER PROFILES ---

export const fetchProfilesByIds = (userIds: string[]) => {
    return handleResponse<Friend[]>(
        supabase
            .from('profiles')
            .select('id, username, branch, year, cookie_score')
            .in('id', userIds)
            .then(({data, error}) => ({
                data: data ? data.map((p: any) => ({
                    id: p.id,
                    username: p.username,
                    branch: p.branch,
                    year: p.year,
                    cookieScore: p.cookie_score,
                    mutualFriends: 0 // Mutuals not calculated here
                })) : null,
                error
            }))
    );
};

export const searchUsers = (query: string, currentUserId: string) => {
    return handleResponse<Friend[]>(
        supabase
            .from('profiles')
            .select('id, username, branch, year, cookie_score')
            .ilike('username', `%${query}%`)
            .neq('id', currentUserId)
            .limit(20)
            .then(({data, error}) => ({
                 data: data ? data.map((p: any) => ({
                    id: p.id,
                    username: p.username,
                    branch: p.branch,
                    year: p.year,
                    cookieScore: p.cookie_score,
                    mutualFriends: 0 // Mutuals not calculated here
                })) : null,
                error
            }))
    );
};

export const updateUserProfile = (userId: string, profileData: Profile) => {
    const dbData = {
        bio: profileData.bio,
        branch: profileData.branch,
        year: profileData.year,
        expertise: profileData.expertise,
        interests: profileData.interests,
        privacy: profileData.privacy
    };
    return handleResponse<(Profile & { id: string })[]>(
        supabase
            .from('profiles')
            .update(dbData)
            .eq('id', userId)
            .select()
    );
};


// --- SESSION HISTORY & MESSAGES ---

export const fetchUserSessionHistory = (userId: string) => {
    return handleResponse<Session[]>(
        supabase
            .from('sessions')
            .select('*, creator:profiles!creator_id(username)')
            .or(`creator_id.eq.${userId},participants.cs.{${userId}}`)
            .eq('status', 'closed')
            .order('event_time', { ascending: false })
            .limit(50)
            .then(({ data, error }) => ({
                data: data ? data.map((s: any) => ({
                    ...s,
                    sessionType: s.session_type,
                    event_time: s.event_time,
                    creator_id: s.creator_id,
                    creator: s.creator || { username: 'Unknown' }
                })) : null,
                error
            }))
    );
};


export const fetchSessionMessages = (sessionId: number) => {
  return handleResponse<SessionMessage[]>(
    supabase
      .from('session_messages')
      .select('*, sender:profiles(username)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
  );
};

export const sendSessionMessage = (sessionId: number, senderId: string, text: string) => {
  return handleResponse<any>(
    supabase
      .from('session_messages')
      .insert([{ session_id: sessionId, sender_id: senderId, text }])
  );
};


// --- NOTIFICATIONS ---

export const fetchNotifications = (userId: string) => {
    return handleResponse<Notification[]>(
        supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)
            .then(async ({ data, error }) => {
                if (error || !data) return { data: null, error };
                // This is a complex mapping to enrich notifications with user/session details
                const enrichedData = await Promise.all(data.map(async (n: any) => {
                    let user = null, session = null, tag = null;
                    if (n.actor_id) {
                        const { data: userData } = await supabase.from('profiles').select('id, username').eq('id', n.actor_id).single();
                        user = userData;
                    }
                    if (n.session_id) {
                         const { data: sessionData } = await supabase.from('sessions').select('id, title, emoji').eq('id', n.session_id).single();
                        session = sessionData;
                    }
                    if (n.tag_id) {
                         const { data: tagData } = await supabase.from('tags').select('id, name').eq('id', n.tag_id).single();
                        tag = tagData;
                    }
                    return {
                        id: n.id,
                        type: n.type,
                        user: user ? { id: user.id, username: user.username } : undefined,
                        session: session ? { id: session.id, title: session.title, emoji: session.emoji } : undefined,
                        tag: tag ? { id: tag.id, name: tag.name } : undefined,
                        timestamp: n.created_at,
                        isRead: n.is_read
                    };
                }));
                return { data: enrichedData, error: null };
            })
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
            .eq('recipient_id', userId)
            .eq('is_read', false)
    );
};

export const deleteNotification = (notificationId: string) => {
    return handleResponse<any>(
        supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
    );
};

export const createNotification = (
  notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>,
  recipientId: string
) => {
  const dbData = {
    recipient_id: recipientId,
    type: notificationData.type,
    actor_id: notificationData.user?.id,
    session_id: notificationData.session?.id,
    tag_id: notificationData.tag?.id,
  };
  return handleResponse(supabase.from('notifications').insert(dbData));
};


// --- DIRECT MESSAGES ---
export const fetchConversationsForUser = (userId: string) => {
  return handleResponse<Conversation[]>(
    supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .then(({ data, error }) => ({
          data: data ? data.map((c: any) => ({
              id: c.id,
              participantIds: c.participant_ids,
              messages: [], // Messages fetched separately
              unreadCount: 0 // Unread count calculated client-side for now
          })) : null,
          error
      }))
  );
};

export const fetchMessagesForConversation = (conversationId: string) => {
  return handleResponse<DirectMessage[]>(
    supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })
      .then(({ data, error }) => ({
        data: data
          ? data.map((d: any) => ({
              id: d.id,
              conversation_id: d.conversation_id,
              senderId: d.sender_id, // Map from sender_id
              text: d.text,
              timestamp: d.timestamp,
            }))
          : null,
        error,
      }))
  );
};

export const sendDirectMessage = (conversationId: string, senderId: string, text: string) => {
  return handleResponse<DirectMessage[]>(
    supabase
      .from('direct_messages')
      .insert([{ conversation_id: conversationId, sender_id: senderId, text }])
  );
};