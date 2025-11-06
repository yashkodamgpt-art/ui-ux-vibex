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
 * Defines the gender filter for Vibe sessions.
 */
export type GenderFilter = 'neutral' | 'same_gender';

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
  genderFilter: GenderFilter; // 'neutral' or 'same_gender' (for 'vibe')
  returnTime?: string; // ISO string (for 'borrow')
  flow: 'seeking' | 'offering'; // (for 'seek' and 'cookie')
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

// We are removing the old 'Note' and 'Topic' types as they are no longer needed.