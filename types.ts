// This is the new, complete types file for our app.

/**
 * Represents the user's public-facing profile.
 * This will be an extension of the data in the Supabase 'profiles' table.
 */
export interface Profile {
  username: string;
  bio: string;
  // New fields from our plan:
  branch: string;
  year: number;
  expertise: string[]; // e.g., ["Python", "CAD"]
  interests: string[]; // e.g., ["Chess", "Football"]
  cookieScore: number; // Our new "Cookie Score"
  privacy: 'public' | 'friends' | 'private';
  // NEW: Fields for Cookie Score dashboard
  skillScores: { [key: string]: number };
  vouchHistory: Vouch[];
}

/**
 * This is our app's main user object, combining Supabase auth
 * and our public profile.
 */
export interface User {
  id: string; // from supabase.auth.user
  email?: string; // from supabase.auth.user
  profile: Profile;
}

/**
 * Defines the "Big 4" session types.
 * Vibe: Social gathering
 * Seek: Asking for help
 * Cookie: Offering a skill
 * Borrow: Item exchange
 */
export type SessionType = 'vibe' | 'seek' | 'cookie' | 'borrow';

/**
 * This is the new core data structure, replacing the old 'Event'.
 * It represents any of our "Big 4" sessions.
 */
export interface Session {
  id: number;
  title: string;
  description: string;
  lat: number;
  lng: number;
  sessionType: SessionType;
  emoji: string; // The emoji used as the map marker
  
  // Time & Status
  event_time: string; // ISO String for the event start time
  duration: number; // Duration in minutes
  status: 'active' | 'closed';
  
  // User & Social
  creator_id: string;
  participants: string[]; // Array of user UUIDs
  creator: { username: string }; // Joined from profiles table
  
  // Conditional Fields
  returnTime?: string; // ISO string (for 'borrow')
  flow?: 'seeking' | 'offering'; // (for 'seek' and 'cookie')

  // Privacy fields for private vibes
  privacy: 'public' | 'private';
  visibleToTags?: string[]; // Array of tag IDs
  
  // NEW: Fields for Seek & Cookie flows
  helpCategory?: 'Academic' | 'Project' | 'Tech' | 'General';
  skillTag?: string; // e.g., "Python"
  expectedOutcome?: string;
  // UPDATED: 'giver' role added for Borrow system
  participantRoles?: { [userId: string]: 'seeking' | 'offering' | 'giver' };
  
  // NEW: Field for Borrow system
  urgency?: 'Low' | 'Medium' | 'High';
}

/**
 * Represents a chat message within a Session.
 * This replaces the old 'VibeMessage'.
 */
export interface SessionMessage {
  id: number;
  sender_id: string;
  session_id: number; // Renamed from event_id
  text: string;
  created_at: string;
  sender: { username: string }; // Joined from profiles table
}

/**
 * NEW: Represents a user in the friends list.
 */
export interface Friend {
  id: string;
  username: string;
  branch: string;
  year: number;
  cookieScore: number;
  mutualFriends: number;
}

/**
 * NEW: Represents a custom tag for organizing friends.
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
  emoji: string;
  memberIds: string[];
  creator_id: string;
}

/**
 * NEW: Represents a friend request between two users.
 */
export interface FriendRequest {
  id: string; // The request's UUID from Supabase
  fromUserId: string;
  toUserId: string;
}

/**
 * NEW: Represents a single direct message between users.
 */
export interface DirectMessage {
  id: string;
  conversation_id: string; // Foreign key to the conversation
  senderId: string;
  text: string;
  timestamp: string; // ISO String
}

/**
 * NEW: Represents a conversation thread between two users.
 */
export interface Conversation {
  id: string;
  participantIds: string[];
  messages: DirectMessage[];
  unreadCount: number;
}

/**
 * NEW: Defines the types of notifications in the app.
 */
export type NotificationType =
  | 'session_invite'
  | 'friend_request_received'
  | 'friend_request_accepted'
  | 'session_join'
  | 'session_ending_soon'
  | 'tag_add'
  | 'ownership_transfer'; // NEW

/**
 * NEW: Represents a single notification item.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  user?: { id: string; username: string }; // User who triggered the notification (actor)
  session?: { id: number; title: string; emoji: string }; // Related session
  tag?: { id: string; name: string }; // Related tag
  timestamp: string; // ISO String
  isRead: boolean;
}

/**
 * NEW: Represents a vouch given from one user to another for a skill.
 */
export interface Vouch {
  id: string;
  voucherUsername: string;
  skill: string;
  points: number;
  timestamp: string; // ISO String
}


// We are removing the old 'Note' and 'Topic' types as they are no longer needed.