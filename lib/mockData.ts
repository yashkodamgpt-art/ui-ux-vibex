import type { User, Session } from '../types';

// This is our mock user. We will use this to bypass the login crash.
export const MOCK_USER: User = {
  id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  email: 'testuser@campus.dev',
  profile: {
    username: 'testuser',
    bio: 'Just a test user bio!',
    branch: 'Computer Science',
    year: 2025,
    expertise: ['React', 'Python'],
    interests: ['Chess', 'Football'],
    cookieScore: 120,
    privacy: 'public',
  },
};

// This is our mock list of sessions for the map.
export const MOCK_SESSIONS: Session[] = [
  {
    id: 1,
    title: 'Casual Chess Games',
    description: 'Looking for a few chess games at the library.',
    lat: 23.193,
    lng: 72.684,
    sessionType: 'vibe',
    emoji: '♟️',
    event_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Started 10 mins ago
    duration: 60,
    status: 'active',
    creator_id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    participants: ['1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'],
    creator: { username: 'testuser' },
    genderFilter: 'neutral',
    flow: 'offering',
  },
  {
    id: 2,
    title: 'Need help with CAD',
    description: 'Stuck on a 3D model, need a second pair of eyes.',
    lat: 23.191,
    lng: 72.685,
    sessionType: 'seek',
    emoji: '🙋',
    event_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Starts in 15 mins
    duration: 30,
    status: 'active',
    creator_id: 'user-2',
    participants: ['user-2'],
    creator: { username: 'otheruser' },
    genderFilter: 'neutral',
    flow: 'seeking',
  },
  {
    id: 3,
    title: 'Borrow a T-Square',
    description: 'Forgot mine for the workshop!',
    lat: 23.19,
    lng: 72.682,
    sessionType: 'borrow',
    emoji: '🤝',
    event_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Started 5 mins ago
    duration: 120,
    status: 'active',
    creator_id: 'user-3',
    participants: ['user-3'],
    creator: { username: 'student123' },
    genderFilter: 'neutral',
    flow: 'seeking',
    returnTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
];
