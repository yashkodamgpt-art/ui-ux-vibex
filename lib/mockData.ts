import type { User, Session, Friend, Tag, FriendRequest, DirectMessage, Conversation, Notification, Vouch } from '../types';

// --- NEW MOCK VOUCH HISTORY ---
export const MOCK_VOUCH_HISTORY: Vouch[] = [
  // Vouches for Python
  { id: 'vouch-1', voucherUsername: 'Alice', skill: 'Python', points: 10, timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'vouch-2', voucherUsername: 'Ethan', skill: 'Python', points: 10, timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'vouch-3', voucherUsername: 'Alice', skill: 'Python', points: 8, timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'vouch-4', voucherUsername: 'George', skill: 'Python', points: 10, timestamp: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'vouch-5', voucherUsername: 'Alice', skill: 'Python', points: 6, timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
  // Vouches for React
  { id: 'vouch-6', voucherUsername: 'Fiona', skill: 'React', points: 10, timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  { id: 'vouch-7', voucherUsername: 'Kevin', skill: 'React', points: 10, timestamp: new Date(Date.now() - 86400000 * 2.5).toISOString() },
  { id: 'vouch-8', voucherUsername: 'Laura', skill: 'React', points: 10, timestamp: new Date(Date.now() - 86400000 * 3.5).toISOString() },
  { id: 'vouch-9', voucherUsername: 'Fiona', skill: 'React', points: 8, timestamp: new Date(Date.now() - 86400000 * 4.5).toISOString() },
  // Vouches for Chess (from interests, but could be an expertise)
  { id: 'vouch-10', voucherUsername: 'Bob', skill: 'Chess', points: 10, timestamp: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: 'vouch-11', voucherUsername: 'Charlie', skill: 'Chess', points: 10, timestamp: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'vouch-12', voucherUsername: 'Bob', skill: 'Chess', points: 8, timestamp: new Date(Date.now() - 86400000 * 8).toISOString() },
  // Vouches for Football
  { id: 'vouch-13', voucherUsername: 'Diana', skill: 'Football', points: 10, timestamp: new Date(Date.now() - 86400000 * 9).toISOString() },
  { id: 'vouch-14', voucherUsername: 'Ian', skill: 'Football', points: 10, timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'vouch-15', voucherUsername: 'Jane', skill: 'Football', points: 10, timestamp: new Date(Date.now() - 86400000 * 11).toISOString() },
];

// Calculate scores from history
const calculateScores = (vouchHistory: Vouch[]) => {
    const skillScores: { [key: string]: number } = {};
    let totalScore = 0;
    
    vouchHistory.forEach(vouch => {
        skillScores[vouch.skill] = (skillScores[vouch.skill] || 0) + vouch.points;
        totalScore += vouch.points;
    });

    return { skillScores, totalScore };
};

const { skillScores, totalScore } = calculateScores(MOCK_VOUCH_HISTORY);


// This is our mock user. We will use this to bypass the login crash.
export const MOCK_USER: User = {
  id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  email: 'testuser@campus.dev',
  profile: {
    username: 'testuser',
    bio: 'Just a test user bio!',
    branch: 'Computer Science',
    year: 2025,
    expertise: ['React', 'Python', 'Chess', 'Graphic Design'],
    interests: ['Football', 'Movies', 'Reading'],
    cookieScore: totalScore,
    privacy: 'public',
    skillScores: skillScores,
    vouchHistory: MOCK_VOUCH_HISTORY.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  },
};

// --- NEW MOCK SESSION HISTORY ---
const generatePastSession = (id: number, daysAgo: number, createdByUser: boolean, joinedByUser: boolean, type: Session['sessionType']): Session => {
  const isCreator = createdByUser && !joinedByUser;
  const creatorId = isCreator ? MOCK_USER.id : `user-${id}`;
  const creatorUsername = isCreator ? MOCK_USER.profile.username : `User${id}`;
  
  let participants = [creatorId, 'friend-1', 'friend-2', 'friend-3', 'friend-4', 'friend-5'].slice(0, Math.floor(Math.random() * 5) + 1);
  if (joinedByUser && !isCreator && !participants.includes(MOCK_USER.id)) {
    participants.push(MOCK_USER.id);
  }

  const titles: { [key in Session['sessionType']]: string[] } = {
    vibe: ["LAN Gaming Night", "Project Brainstorm", "Badminton Match", "Late Night Coffee"],
    seek: ["Calculus Help Needed", "Review my Resume", "Need help with soldering"],
    cookie: ["Intro to Python", "Guitar Lessons", "Public Speaking Practice"],
    borrow: ["Borrow a Graphic Calculator", "Need a Charger", "Anyone have a spare notebook?"],
  };

  const emojis: { [key in Session['sessionType']]: string[] } = {
    vibe: ['🎮', '💡', '🏸', '☕'],
    seek: ['🧮', '📄', '🔧'],
    cookie: ['🐍', '🎸', '🗣️'],
    borrow: ['➗', '🔌', '📓'],
  };
  
  const titleIndex = Math.floor(Math.random() * titles[type].length);

  return {
    id,
    title: titles[type][titleIndex],
    description: `A past session that happened ${daysAgo} days ago.`,
    lat: 23.1925 + (Math.random() - 0.5) * 0.01,
    lng: 72.6844 + (Math.random() - 0.5) * 0.01,
    sessionType: type,
    emoji: emojis[type][titleIndex],
    event_time: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    duration: 30 + Math.floor(Math.random() * 90),
    status: 'closed',
    creator_id: creatorId,
    participants,
    creator: { username: creatorUsername },
    flow: (type === 'cookie' || type === 'vibe') ? 'offering' : 'seeking',
    privacy: 'public',
  };
};

const pastSessions: Session[] = [
  generatePastSession(101, 1, true, false, 'cookie'),
  generatePastSession(102, 2, false, true, 'vibe'),
  generatePastSession(103, 3, false, true, 'seek'),
  generatePastSession(104, 5, true, false, 'vibe'),
  generatePastSession(105, 8, false, true, 'borrow'),
  generatePastSession(106, 10, true, false, 'cookie'),
  generatePastSession(107, 12, false, true, 'vibe'),
  generatePastSession(108, 15, true, false, 'seek'),
  generatePastSession(109, 20, false, true, 'cookie'),
  generatePastSession(110, 25, true, false, 'vibe'),
  generatePastSession(111, 32, false, false, 'vibe'), // Not involved
  generatePastSession(112, 35, true, false, 'borrow'),
  generatePastSession(113, 40, false, true, 'vibe'),
  generatePastSession(114, 45, true, false, 'cookie'),
  generatePastSession(115, 50, false, true, 'seek'),
  generatePastSession(116, 60, false, false, 'cookie'), // Not involved
];


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
    creator_id: MOCK_USER.id,
    participants: [MOCK_USER.id, 'friend-2'],
    creator: { username: MOCK_USER.profile.username },
    privacy: 'public',
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
    creator_id: 'friend-4',
    participants: ['friend-4', 'friend-1'],
    creator: { username: 'Diana' },
    privacy: 'public',
    helpCategory: 'Project',
    participantRoles: { 'friend-4': 'seeking', 'friend-1': 'offering' }
  },
  {
    id: 4,
    title: 'Python Tutoring',
    description: 'Helping with basics of Python for the first-year course.',
    lat: 23.1932,
    lng: 72.6845,
    sessionType: 'cookie',
    emoji: '🍪',
    event_time: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    duration: 45,
    status: 'active',
    creator_id: MOCK_USER.id,
    participants: [MOCK_USER.id],
    creator: { username: MOCK_USER.profile.username },
    privacy: 'public',
    skillTag: 'Python',
    expectedOutcome: 'Understand variables, loops, and basic functions.',
    participantRoles: { [MOCK_USER.id]: 'offering' }
  },
  {
    id: 20,
    title: 'Private Study Group',
    description: 'Working on the CS assignment, only for study group members.',
    lat: 23.1920,
    lng: 72.6830, // Academic Block
    sessionType: 'vibe',
    emoji: '🤫',
    event_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    duration: 120,
    status: 'active',
    creator_id: 'friend-5', // Ethan
    participants: ['friend-5'],
    creator: { username: 'Ethan' },
    privacy: 'private',
    visibleToTags: ['tag-4'],
  },
   // --- NEW: MOCK BORROW SESSIONS ---
  {
    id: 30,
    title: 'T-Square for Workshop',
    description: 'Urgently need a T-Square for the ME workshop, forgot mine at the hostel. Can return it by evening.',
    lat: 23.1921,
    lng: 72.6828,
    sessionType: 'borrow',
    emoji: '📐',
    event_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Created 5 mins ago
    duration: 180,
    status: 'active',
    creator_id: 'friend-2', // Bob
    participants: ['friend-2'],
    creator: { username: 'Bob' },
    returnTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    privacy: 'public',
    urgency: 'High',
    participantRoles: { 'friend-2': 'seeking' }
  },
  {
    id: 31,
    title: 'Need an umbrella',
    description: 'Looks like it might rain, anyone have a spare umbrella I could borrow for a few hours?',
    lat: 23.1905,
    lng: 72.6865, // Hostel area
    sessionType: 'borrow',
    emoji: '☂️',
    event_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Created 15 mins ago
    duration: 120,
    status: 'active',
    creator_id: 'friend-6', // Fiona
    participants: ['friend-6', 'friend-1'], // Alice is the giver
    creator: { username: 'Fiona' },
    returnTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    privacy: 'public',
    urgency: 'Low',
    participantRoles: { 'friend-6': 'seeking', 'friend-1': 'giver' }
  },
  {
    id: 32,
    title: 'Laptop Charger (USB-C)',
    description: 'Left mine at home. Need it for a class in an hour.',
    lat: 23.1928,
    lng: 72.6835, // Near library
    sessionType: 'borrow',
    emoji: '🔌',
    event_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    duration: 90,
    status: 'active',
    creator_id: MOCK_USER.id,
    participants: [MOCK_USER.id],
    creator: { username: MOCK_USER.profile.username },
    returnTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    privacy: 'public',
    urgency: 'Medium',
    participantRoles: { [MOCK_USER.id]: 'seeking' }
  },
  ...pastSessions,
];

// --- MOCK FRIENDS LIST ---
export const MOCK_FRIENDS: Friend[] = [
  { id: 'friend-1', username: 'Alice', branch: 'Electrical Eng.', year: 2024, cookieScore: 250, mutualFriends: 5 },
  { id: 'friend-2', username: 'Bob', branch: 'Mechanical Eng.', year: 2025, cookieScore: 180, mutualFriends: 3 },
  { id: 'friend-3', username: 'Charlie', branch: 'Chemical Eng.', year: 2026, cookieScore: 320, mutualFriends: 8 },
  { id: 'friend-4', username: 'Diana', branch: 'Civil Eng.', year: 2024, cookieScore: 95, mutualFriends: 2 },
  { id: 'friend-5', username: 'Ethan', branch: 'Computer Science', year: 2027, cookieScore: 450, mutualFriends: 12 },
  { id: 'friend-6', username: 'Fiona', branch: 'Materials Sci.', year: 2025, cookieScore: 210, mutualFriends: 6 },
  { id: 'friend-7', username: 'George', branch: 'Physics', year: 2026, cookieScore: 150, mutualFriends: 4 },
  { id: 'friend-8', username: 'Hannah', branch: 'Mathematics', year: 2024, cookieScore: 380, mutualFriends: 9 },
  { id: 'friend-9', username: 'Ian', branch: 'Computer Science', year: 2025, cookieScore: 290, mutualFriends: 7 },
  { id: 'friend-10', username: 'Jane', branch: 'Electrical Eng.', year: 2027, cookieScore: 110, mutualFriends: 1 },
  { id: 'friend-11', username: 'Kevin', branch: 'Mechanical Eng.', year: 2026, cookieScore: 50, mutualFriends: 0 },
  { id: 'friend-12', username: 'Laura', branch: 'Chemistry', year: 2025, cookieScore: 410, mutualFriends: 11 },
];

// --- MOCK TAGS ---
export const MOCK_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Badminton Buddies', color: 'blue', emoji: '🏸', memberIds: ['friend-1', 'friend-4', 'friend-9'] },
  { id: 'tag-2', name: 'Chess Gang', color: 'gray', emoji: '♟️', memberIds: ['friend-2', 'friend-5', 'friend-8'] },
  { id: 'tag-3', name: 'Movie Night', color: 'purple', emoji: '🎬', memberIds: ['friend-3', 'friend-6', 'friend-10', 'friend-12'] },
  { id: 'tag-4', name: 'Study Group', color: 'green', emoji: '📚', memberIds: ['friend-5', 'friend-7', 'friend-9', 'friend-11', MOCK_USER.id] },
];


// --- NEW MOCK USER DATABASE FOR SEARCH ---
const branches = ['Computer Science', 'Electrical Eng.', 'Mechanical Eng.', 'Chemical Eng.', 'Civil Eng.', 'Materials Sci.', 'Physics', 'Mathematics', 'Chemistry'];
const years = [2024, 2025, 2026, 2027, 2028];
const firstNames = ['Alex', 'Ben', 'Chloe', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe'];
const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];

export const MOCK_USERS_DATABASE: Friend[] = Array.from({ length: 55 }, (_, i) => {
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];
    return {
        id: `user-db-${i + 1}`,
        username: `${fname}${lname}${Math.floor(Math.random() * 90) + 10}`,
        branch: branches[i % branches.length],
        year: years[i % years.length],
        cookieScore: Math.floor(Math.random() * 500),
        mutualFriends: Math.floor(Math.random() * 15),
    }
});
// Add some of the existing friends to the database to test the 'Friends' status
MOCK_USERS_DATABASE.splice(5, 0, MOCK_FRIENDS[8]);
MOCK_USERS_DATABASE.splice(15, 0, MOCK_FRIENDS[10]);

// --- NEW MOCK FRIEND REQUESTS ---
export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  // Incoming requests for MOCK_USER
  { fromUserId: 'user-db-3', toUserId: MOCK_USER.id },
  { fromUserId: 'user-db-10', toUserId: MOCK_USER.id },
  { fromUserId: 'user-db-22', toUserId: MOCK_USER.id },
  
  // Outgoing requests from MOCK_USER
  { fromUserId: MOCK_USER.id, toUserId: 'user-db-5' },
  { fromUserId: MOCK_USER.id, toUserId: 'user-db-18' },
];

// --- NEW MOCK DIRECT MESSAGES & CONVERSATIONS ---
const now = Date.now();
const minutes = (m: number) => m * 60 * 1000;
const hours = (h: number) => h * 60 * 60 * 1000;

export const MOCK_DIRECT_MESSAGES: { [key: string]: DirectMessage[] } = {
    'conv-1': [
        { id: 'dm-1-1', senderId: 'friend-1', text: "Hey! Are you free to work on the project tomorrow?", timestamp: new Date(now - hours(2)).toISOString() },
        { id: 'dm-1-2', senderId: MOCK_USER.id, text: "Yeah, I should be. What time works for you?", timestamp: new Date(now - hours(1.9)).toISOString() },
        { id: 'dm-1-3', senderId: 'friend-1', text: "How about around 2 PM at the library?", timestamp: new Date(now - minutes(5)).toISOString() },
    ],
    'conv-2': [
        { id: 'dm-2-1', senderId: 'friend-5', text: "Great game today! We should play again sometime.", timestamp: new Date(now - hours(23)).toISOString() },
    ],
    'conv-3': [
        { id: 'dm-3-1', senderId: 'friend-8', text: "Did you finish the math assignment?", timestamp: new Date(now - hours(5)).toISOString() },
        { id: 'dm-3-2', senderId: 'friend-8', text: "I'm stuck on the last question.", timestamp: new Date(now - hours(4.5)).toISOString() },
        { id: 'dm-3-3', senderId: MOCK_USER.id, text: "Almost, that last one is tricky. Let's look at it together.", timestamp: new Date(now - hours(4)).toISOString() },
        { id: 'dm-3-4', senderId: 'friend-8', text: "Sounds good, thanks!", timestamp: new Date(now - hours(3.9)).toISOString() },
    ],
    'conv-4': [
         { id: 'dm-4-1', senderId: 'friend-3', text: "Movie night this Friday?", timestamp: new Date(now - minutes(30)).toISOString() },
         { id: 'dm-4-2', senderId: MOCK_USER.id, text: "Definitely! What are we watching?", timestamp: new Date(now - minutes(28)).toISOString() },
         { id: 'dm-4-3', senderId: 'friend-3', text: "Thinking about the new sci-fi flick that just came out. Heard it's amazing.", timestamp: new Date(now - minutes(25)).toISOString() },
    ]
};

export const MOCK_CONVERSATIONS: Conversation[] = [
    { id: 'conv-1', participantIds: [MOCK_USER.id, 'friend-1'], messages: MOCK_DIRECT_MESSAGES['conv-1'], unreadCount: 1 },
    { id: 'conv-2', participantIds: [MOCK_USER.id, 'friend-5'], messages: MOCK_DIRECT_MESSAGES['conv-2'], unreadCount: 0 },
    { id: 'conv-3', participantIds: [MOCK_USER.id, 'friend-8'], messages: MOCK_DIRECT_MESSAGES['conv-3'], unreadCount: 2 },
    { id: 'conv-4', participantIds: [MOCK_USER.id, 'friend-3'], messages: MOCK_DIRECT_MESSAGES['conv-4'], unreadCount: 0 },
];

// --- NEW MOCK NOTIFICATIONS ---
export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        type: 'friend_request_received',
        user: { id: 'user-db-3', username: MOCK_USERS_DATABASE.find(u => u.id === 'user-db-3')?.username || 'User' },
        timestamp: new Date(now - minutes(2)).toISOString(),
        isRead: false,
    },
    {
        id: 'notif-2',
        type: 'session_join',
        user: { id: 'friend-2', username: 'Bob' },
        session: { id: 1, title: 'Casual Chess Games', emoji: '♟️' },
        timestamp: new Date(now - minutes(15)).toISOString(),
        isRead: false,
    },
    {
        id: 'notif-3',
        type: 'friend_request_accepted',
        user: { id: 'friend-11', username: 'Kevin' },
        timestamp: new Date(now - hours(1)).toISOString(),
        isRead: false,
    },
    {
        id: 'notif-4',
        type: 'tag_add',
        user: { id: 'friend-5', username: 'Ethan' },
        tag: { id: 'tag-4', name: 'Study Group' },
        timestamp: new Date(now - hours(3)).toISOString(),
        isRead: true,
    },
    {
        id: 'notif-5',
        type: 'session_ending_soon',
        session: { id: 1, title: 'Casual Chess Games', emoji: '♟️' },
        timestamp: new Date(now - hours(4)).toISOString(),
        isRead: true,
    },
    {
        id: 'notif-6',
        type: 'friend_request_received',
        user: { id: 'user-db-10', username: MOCK_USERS_DATABASE.find(u => u.id === 'user-db-10')?.username || 'User' },
        timestamp: new Date(now - hours(8)).toISOString(),
        isRead: false,
    },
    {
        id: 'notif-7',
        type: 'session_invite',
        user: { id: 'friend-4', username: 'Diana' },
        session: { id: 2, title: 'Need help with CAD', emoji: '🙋' },
        timestamp: new Date(now - hours(22)).toISOString(),
        isRead: true,
    },
];