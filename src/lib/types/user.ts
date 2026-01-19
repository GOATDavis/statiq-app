// Base user type
export type UserType = 'fan' | 'coach' | 'player';

export interface BaseUser {
  id: string;
  email: string;
  username?: string; // Username for public display
  firstName?: string;
  lastName?: string;
  userType: UserType;
  createdAt: string;
}

// Fan Profile
export interface FanProfile extends BaseUser {
  userType: 'fan';
  favoriteTeams: string[]; // Array of team IDs
  adFree: boolean;
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiresAt?: string;
  notificationPreferences?: {
    scores: boolean;
    bigPlays: boolean;
    gameStart: boolean;
  };
}

// Coach Profile
export interface CoachProfile extends BaseUser {
  userType: 'coach';
  teamId: string;
  schoolId: string;
  position: string; // "Head Coach", "DC", "OC", etc.
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionExpiresAt?: string;
}

// Player Profile
export interface PlayerProfile extends BaseUser {
  userType: 'player';
  playerId: string; // Links to Player table
  teamId: string;
  schoolId: string;
  grade: string;
  position: string;
  jerseyNumber: string;
}

// Union type for all user profiles
export type UserProfile = FanProfile | CoachProfile | PlayerProfile;
