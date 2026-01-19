// Local storage service for managing favorites/following
// This will be used until backend user auth is implemented

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  FOLLOWING_TEAMS: '@statiq:following_teams',
  FOLLOWING_PLAYERS: '@statiq:following_players',
  RECENT_SEARCHES: '@statiq:recent_searches',
  DEV_ROLE: 'statiq_dev_role',
};

// ============================================================================
// FOLLOWING TEAMS
// ============================================================================

/**
 * Get all followed team IDs
 */
export async function getFollowedTeams(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWING_TEAMS);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error getting followed teams:', error);
    return [];
  }
}

/**
 * Check if a team is followed
 */
export async function isTeamFollowed(teamId: string): Promise<boolean> {
  const teams = await getFollowedTeams();
  return teams.includes(teamId);
}

/**
 * Follow a team
 */
export async function followTeam(teamId: string): Promise<void> {
  try {
    const teams = await getFollowedTeams();
    if (!teams.includes(teamId)) {
      teams.push(teamId);
      await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING_TEAMS, JSON.stringify(teams));
    }
  } catch (error) {
    console.error('Error following team:', error);
    throw error;
  }
}

/**
 * Unfollow a team
 */
export async function unfollowTeam(teamId: string): Promise<void> {
  try {
    const teams = await getFollowedTeams();
    const filtered = teams.filter(id => id !== teamId);
    await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING_TEAMS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error unfollowing team:', error);
    throw error;
  }
}

/**
 * Toggle team follow status
 */
export async function toggleTeamFollow(teamId: string): Promise<boolean> {
  const isFollowed = await isTeamFollowed(teamId);
  if (isFollowed) {
    await unfollowTeam(teamId);
    return false;
  } else {
    await followTeam(teamId);
    return true;
  }
}

// ============================================================================
// FOLLOWING PLAYERS
// ============================================================================

/**
 * Get all followed player IDs
 */
export async function getFollowedPlayers(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWING_PLAYERS);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error getting followed players:', error);
    return [];
  }
}

/**
 * Check if a player is followed
 */
export async function isPlayerFollowed(playerId: string): Promise<boolean> {
  const players = await getFollowedPlayers();
  return players.includes(playerId);
}

/**
 * Follow a player
 */
export async function followPlayer(playerId: string): Promise<void> {
  try {
    const players = await getFollowedPlayers();
    if (!players.includes(playerId)) {
      players.push(playerId);
      await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING_PLAYERS, JSON.stringify(players));
    }
  } catch (error) {
    console.error('Error following player:', error);
    throw error;
  }
}

/**
 * Unfollow a player
 */
export async function unfollowPlayer(playerId: string): Promise<void> {
  try {
    const players = await getFollowedPlayers();
    const filtered = players.filter(id => id !== playerId);
    await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING_PLAYERS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error unfollowing player:', error);
    throw error;
  }
}

/**
 * Toggle player follow status
 */
export async function togglePlayerFollow(playerId: string): Promise<boolean> {
  const isFollowed = await isPlayerFollowed(playerId);
  if (isFollowed) {
    await unfollowPlayer(playerId);
    return false;
  } else {
    await followPlayer(playerId);
    return true;
  }
}

// ============================================================================
// RECENT SEARCHES
// ============================================================================

const MAX_RECENT_SEARCHES = 10;

/**
 * Get recent search queries
 */
export async function getRecentSearches(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
}

/**
 * Add a search query to recent searches
 */
export async function addRecentSearch(query: string): Promise<void> {
  try {
    const searches = await getRecentSearches();
    
    // Remove query if it already exists
    const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    
    // Add to beginning
    filtered.unshift(query);
    
    // Keep only the most recent MAX_RECENT_SEARCHES
    const trimmed = filtered.slice(0, MAX_RECENT_SEARCHES);
    
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error adding recent search:', error);
    throw error;
  }
}

/**
 * Clear all recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing recent searches:', error);
    throw error;
  }
}

// ============================================================================
// DEV ROLE (Development Only)
// ============================================================================

export type DevRole = 'coach' | 'fan' | 'player';

/**
 * Get the current dev role
 */
export async function getDevRole(): Promise<DevRole | null> {
  try {
    const role = await AsyncStorage.getItem(STORAGE_KEYS.DEV_ROLE);
    return role as DevRole | null;
  } catch (error) {
    console.error('Error getting dev role:', error);
    return null;
  }
}

/**
 * Set the dev role
 */
export async function setDevRole(role: DevRole): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEV_ROLE, role);
  } catch (error) {
    console.error('Error setting dev role:', error);
    throw error;
  }
}

/**
 * Clear the dev role (return to role selector)
 */
export async function clearDevRole(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DEV_ROLE);
  } catch (error) {
    console.error('Error clearing dev role:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Clear all local storage (use with caution)
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.FOLLOWING_TEAMS,
      STORAGE_KEYS.FOLLOWING_PLAYERS,
      STORAGE_KEYS.RECENT_SEARCHES,
      STORAGE_KEYS.DEV_ROLE,
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}
