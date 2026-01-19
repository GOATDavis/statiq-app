/**
 * Vote Management System
 * Handles storing and retrieving user votes for games
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'device_id';
const VOTE_PREFIX = 'vote_';

/**
 * Get or create a unique device ID for vote tracking
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error managing device ID:', error);
    return Crypto.randomUUID();
  }
}

/**
 * Store a user's vote for a game
 */
export async function storeVote(gameId: string, team: 'home' | 'away'): Promise<void> {
  try {
    console.log(`[Vote Storage] Storing vote for game ${gameId}: ${team}`);
    await AsyncStorage.setItem(`${VOTE_PREFIX}${gameId}`, team);
    console.log(`[Vote Storage] Successfully stored vote`);
  } catch (error) {
    console.error('Error storing vote:', error);
    throw error;
  }
}

/**
 * Get the user's vote for a game
 * Returns null if no vote exists
 */
export async function getVote(gameId: string): Promise<'home' | 'away' | null> {
  try {
    const vote = await AsyncStorage.getItem(`${VOTE_PREFIX}${gameId}`);
    console.log(`[Vote Storage] Retrieved vote for game ${gameId}: ${vote}`);
    return vote as 'home' | 'away' | null;
  } catch (error) {
    console.error('Error getting vote:', error);
    return null;
  }
}

/**
 * Check if user has voted on a game
 */
export async function hasVoted(gameId: string): Promise<boolean> {
  const vote = await getVote(gameId);
  return vote !== null;
}

/**
 * Get all votes for multiple games at once
 * Returns a Map of gameId -> vote
 */
export async function getVotesForGames(gameIds: string[]): Promise<Map<string, 'home' | 'away'>> {
  const votes = new Map<string, 'home' | 'away'>();
  
  try {
    const keys = gameIds.map(id => `${VOTE_PREFIX}${id}`);
    const values = await AsyncStorage.multiGet(keys);
    
    values.forEach(([key, value]) => {
      if (value) {
        const gameId = key.replace(VOTE_PREFIX, '');
        votes.set(gameId, value as 'home' | 'away');
      }
    });
  } catch (error) {
    console.error('Error getting votes for games:', error);
  }
  
  return votes;
}

/**
 * Clear a vote (for testing purposes - generally votes should be locked)
 */
export async function clearVote(gameId: string): Promise<void> {
  try {
    console.log(`[Vote Storage] Clearing vote for game ${gameId}`);
    await AsyncStorage.removeItem(`${VOTE_PREFIX}${gameId}`);
  } catch (error) {
    console.error('Error clearing vote:', error);
  }
}

/**
 * Clear ALL votes (for testing/debugging only)
 */
export async function clearAllVotes(): Promise<void> {
  try {
    console.log('[Vote Storage] Clearing ALL votes');
    const keys = await AsyncStorage.getAllKeys();
    const voteKeys = keys.filter(key => key.startsWith(VOTE_PREFIX));
    await AsyncStorage.multiRemove(voteKeys);
    console.log(`[Vote Storage] Cleared ${voteKeys.length} votes`);
  } catch (error) {
    console.error('Error clearing all votes:', error);
  }
}

/**
 * Debug: List all stored votes
 */
export async function listAllVotes(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const voteKeys = keys.filter(key => key.startsWith(VOTE_PREFIX));
    console.log(`[Vote Storage] Found ${voteKeys.length} stored votes:`);
    
    for (const key of voteKeys) {
      const value = await AsyncStorage.getItem(key);
      const gameId = key.replace(VOTE_PREFIX, '');
      console.log(`  - Game ${gameId}: ${value}`);
    }
  } catch (error) {
    console.error('Error listing votes:', error);
  }
}
