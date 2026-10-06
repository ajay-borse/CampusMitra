/**
 * CampusMitra Data Store
 * Authentic student profiles, interests, campus trending topics, and mock chats.
 */

export const INITIAL_USER = {
  id: 'current-user',
  name: 'Ajay',
  course: 'MCA (Computer Applications)',
  university: 'MIT World Peace University',
  year: '2nd Year',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Building full-stack MERN apps, tech enthusiast, loves weekend hackathons and badminton 🏸. Looking for study buddies & coding collaborators!',
  collegeEmail: 'borseajy@mitwpu.edu.in',
  isVerified: true,
  completionPercent: 88,
  selectedInterests: ['💻 Coding', '🎵 Music', '🎮 Gaming', '🚀 Entrepreneurship', '☕ Coffee', '🏏 Sports'],
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  ],
  stats: {
    connections: 12,
    matches: 7,
    chatUnread: 3,
  },
};

export const ALL_INTERESTS = [
  { id: 'coding', label: '💻 Coding', category: 'Tech' },
  { id: 'music', label: '🎵 Music', category: 'Creative' },
  { id: 'gaming', label: '🎮 Gaming', category: 'Entertainment' },
  { id: 'cricket', label: '🏏 Sports', category: 'Fitness' },
  { id: 'startup', label: '🚀 Entrepreneurship', category: 'Career' },
  { id: 'study', label: '📚 Study', category: 'Academic' },
  { id: 'movies', label: '🎬 Movies', category: 'Entertainment' },
  { id: 'photo', label: '📷 Photography', category: 'Creative' },
  { id: 'fitness', label: '🏋️ Fitness', category: 'Fitness' },
  { id: 'coffee', label: '☕ Coffee', category: 'Lifestyle' },
  { id: 'food', label: '🍕 Food', category: 'Lifestyle' },
  { id: 'travel', label: '✈️ Travel', category: 'Lifestyle' },
  { id: 'art', label: '🎨 Art', category: 'Creative' },
  { id: 'debate', label: '🎤 Public Speaking', category: 'Academic' },
];

export const DISCOVER_PROFILES = [
  {
    id: 'p1',
    name: 'Priya Verma',
    age: 21,
    program: 'B.Tech Computer Science',
    year: '3rd Year',
    university: 'MIT-WPU Pune',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    ],
    bio: 'React & UI designer ✨ Coffee snob & indie playlist curator. Looking for someone to team up for the Smart India Hackathon!',
    compatibility: 94,
    sharedInterests: ['💻 Coding', '🎵 Music', '☕ Coffee', '🚀 Entrepreneurship'],
    sharedGoals: '🤝 Project Collaborators & Friends',
    distance: 'On Campus (Building 4)',
    isOnline: true,
  },
  {
    id: 'p2',
    name: 'Rahul Sharma',
    age: 22,
    program: 'MCA Cloud Computing',
    year: '2nd Year',
    university: 'MIT-WPU Pune',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    ],
    bio: 'DevOps geek, Docker & AWS explorer 🚀 Weekend cricket matches, always down for a chai break near the fountain.',
    compatibility: 88,
    sharedInterests: ['💻 Coding', '🏏 Sports', '☕ Coffee'],
    sharedGoals: '📚 Study Buddies & Tech Talks',
    distance: 'Library 2nd Floor',
    isOnline: true,
  },
  {
    id: 'p3',
    name: 'Sneha Kulkarni',
    age: 20,
    program: 'B.Des User Experience',
    year: '2nd Year',
    university: 'MIT-WPU Pune',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    ],
    bio: 'Figma enthusiast, anime binge-watcher 🎨 Making apps look and feel magical. Let’s build something cool together!',
    compatibility: 82,
    sharedInterests: ['🎨 Art', '🎮 Gaming', '🎵 Music'],
    sharedGoals: '✨ Creative Connections',
    distance: 'Design Studio 3',
    isOnline: false,
  },
  {
    id: 'p4',
    name: 'Aman Joshi',
    age: 22,
    program: 'MBA Tech Management',
    year: '1st Year',
    university: 'MIT-WPU Pune',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    ],
    bio: 'Startup pitch decks, product strategy, and late-night FIFA sessions 🎮. Hit me up if you have an MVP idea!',
    compatibility: 78,
    sharedInterests: ['🚀 Entrepreneurship', '🎮 Gaming', '🍕 Food'],
    sharedGoals: '🚀 Co-Founders & Networking',
    distance: 'Incubation Center',
    isOnline: true,
  },
];

export const CAMPUS_TRENDS = [
  { id: 't1', icon: '🚀', tag: '#Hackathon2026', title: 'MIT-WPU Innovation Fest', participants: '340 students joining' },
  { id: 't2', icon: '🏏', tag: '#InterCampusCricket', title: 'Inter-College Tournament', participants: '18 teams registered' },
  { id: 't3', icon: '🎮', tag: '#ValorantLAN', title: 'Campus Esports Night', participants: '64 players competing' },
  { id: 't4', icon: '🎵', tag: '#CampusAcoustic', title: 'Open Mic Night @ Amphitheater', participants: 'Friday 6:00 PM' },
  { id: 't5', icon: '💻', tag: '#FullStackMERN', title: 'React 19 & Express Workshop', participants: '120 RSVPs' },
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'c1',
    user: {
      name: 'Priya Verma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      status: 'online',
      program: 'B.Tech CSE',
    },
    lastMessage: 'Hey Ajay! Are you working on the MERN backend today?',
    time: '2m ago',
    unreadCount: 2,
    messages: [
      { id: 'm1', sender: 'them', text: 'Hey Ajay! Saw your profile on CampusMitra ✨', time: '10:14 AM' },
      { id: 'm2', sender: 'you', text: 'Hey Priya! Nice to connect! How is the hackathon prep going?', time: '10:16 AM' },
      { id: 'm3', sender: 'them', text: 'Going great! Are you working on the MERN backend today?', time: '10:18 AM' },
    ],
  },
  {
    id: 'c2',
    user: {
      name: 'Rahul Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      status: 'online',
      program: 'MCA Cloud',
    },
    lastMessage: 'Chai break near the main canteen at 4:30? ☕',
    time: '1h ago',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'them', text: 'Bro did you check the Docker cluster configuration?', time: '9:00 AM' },
      { id: 'm2', sender: 'you', text: 'Yes, running smoothly on port 5000 with CORS configured!', time: '9:05 AM' },
      { id: 'm3', sender: 'them', text: 'Chai break near the main canteen at 4:30? ☕', time: '9:12 AM' },
    ],
  },
  {
    id: 'c3',
    user: {
      name: 'Sneha Kulkarni',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      status: 'offline',
      program: 'B.Des UX',
    },
    lastMessage: 'Shared the Figma design system link with you 🎨',
    time: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm1', sender: 'them', text: 'Shared the Figma design system link with you 🎨', time: 'Yesterday' },
    ],
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'match',
    icon: '💜',
    title: 'New Mutual Match!',
    description: 'You and Priya Verma matched over Coding & Indie Music.',
    time: '5m ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'connection',
    icon: '🤝',
    title: 'New Connection Request',
    description: 'Rahul Sharma wants to connect as a Study Buddy.',
    time: '45m ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'trending',
    icon: '🔥',
    title: 'Trending on Campus',
    description: 'MIT-WPU Hackathon 2026 registration is live now.',
    time: '2h ago',
    read: false,
  },
  {
    id: 'n4',
    type: 'achievement',
    icon: '🎉',
    title: 'Profile Highlighted',
    description: 'Your MCA profile is in the top 10% active profiles on campus!',
    time: '1d ago',
    read: true,
  },
];
