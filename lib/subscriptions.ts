// lib/subscriptions.ts
import { supabase } from './supabaseClient';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Session, SessionMessage, Notification, DirectMessage } from '../types';

/**
 * A helper to enrich a notification payload with related data like usernames.
 */
const enrichNotification = async (notifPayload: any): Promise<Notification> => {
    let user = null;
    let session = null;
    let tag = null;

    if (notifPayload.actor_id) {
        const { data } = await supabase.from('profiles').select('id, username').eq('id', notifPayload.actor_id).single();
        user = data;
    }
    if (notifPayload.session_id) {
        const { data } = await supabase.from('sessions').select('id, title, emoji').eq('id', notifPayload.session_id).single();
        session = data;
    }
    if (notifPayload.tag_id) {
        const { data } = await supabase.from('tags').select('id, name').eq('id', notifPayload.tag_id).single();
        tag = data;
    }
    
    return {
        id: notifPayload.id,
        type: notifPayload.type,
        user: user ? { id: user.id, username: user.username } : undefined,
        session: session ? { id: session.id, title: session.title, emoji: session.emoji } : undefined,
        tag: tag ? { id: tag.id, name: tag.name } : undefined,
        timestamp: notifPayload.created_at,
        isRead: notifPayload.is_read,
    };
};


/**
 * Subscribes to changes in the sessions table.
 * @param callback - Function to run when a change occurs.
 * @returns The Supabase channel for unsubscribing.
 */
export const subscribeToSessions = (callback: (payload: RealtimePostgresChangesPayload<Session>) => void): RealtimeChannel => {
  const channel = supabase
    .channel('sessions')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'sessions' },
      callback
    )
    .subscribe();
  
  return channel;
};

/**
 * Subscribes to new messages in a specific session.
 * @param sessionId - The ID of the session to listen to.
 * @param callback - Function to run when a new message arrives.
 * @returns The Supabase channel for unsubscribing.
 */
export const subscribeToSessionMessages = (sessionId: number, callback: (payload: RealtimePostgresChangesPayload<SessionMessage>) => void): RealtimeChannel => {
  const channel = supabase
    .channel(`session_messages_${sessionId}`)
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'session_messages', filter: `session_id=eq.${sessionId}` },
      async (payload) => {
          // Fetch the sender's profile for the new message
          const { data, error } = await supabase.from('profiles').select('username').eq('id', payload.new.sender_id).single();
          if (!error && data) {
              (payload.new as SessionMessage).sender = data;
          }
          callback(payload as RealtimePostgresChangesPayload<SessionMessage>);
      })
    .subscribe();
  
  return channel;
};

/**
 * Subscribes to new notifications for a specific user.
 * @param userId - The ID of the user.
 * @param callback - Function to run when a new notification arrives.
 * @returns The Supabase channel for unsubscribing.
 */
export const subscribeToNotifications = (userId: string, callback: (notification: Notification) => void): RealtimeChannel => {
    const channel = supabase
        .channel(`notifications_${userId}`)
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
            async (payload) => {
                const enriched = await enrichNotification(payload.new);
                callback(enriched);
            }
        )
        .subscribe();
    return channel;
};

/**
 * Subscribes to new direct messages in a specific conversation.
 * @param conversationId - The ID of the conversation.
 * @param callback - Function to run when a new message arrives.
 * @returns The Supabase channel for unsubscribing.
 */
export const subscribeToDirectMessages = (conversationId: string, callback: (message: DirectMessage) => void): RealtimeChannel => {
    const channel = supabase
        .channel(`direct_messages_${conversationId}`)
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
            (payload) => {
                const rawMessage = payload.new as any;
                const mappedMessage: DirectMessage = {
                    id: rawMessage.id,
                    conversation_id: rawMessage.conversation_id,
                    senderId: rawMessage.sender_id,
                    text: rawMessage.text,
                    timestamp: rawMessage.timestamp,
                };
                callback(mappedMessage);
            }
        )
        .subscribe();
    return channel;
};