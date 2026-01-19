/**
 * VOTE DEBUG TOOL
 * Use this in the app to clear votes for testing
 * 
 * Import and call from any screen:
 * import { clearAllVotesDebug, listAllVotesDebug } from '@/src/lib/votes-debug';
 * 
 * // To list all votes
 * listAllVotesDebug();
 * 
 * // To clear all votes
 * clearAllVotesDebug();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const VOTE_PREFIX = 'vote_';

export async function clearAllVotesDebug() {
  try {
    console.log('[DEBUG] Clearing ALL votes...');
    const keys = await AsyncStorage.getAllKeys();
    const voteKeys = keys.filter(key => key.startsWith(VOTE_PREFIX));
    await AsyncStorage.multiRemove(voteKeys);
    console.log(`[DEBUG] Cleared ${voteKeys.length} votes`);
    alert(`Cleared ${voteKeys.length} votes`);
  } catch (error) {
    console.error('[DEBUG] Error clearing votes:', error);
    alert('Error clearing votes');
  }
}

export async function listAllVotesDebug() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const voteKeys = keys.filter(key => key.startsWith(VOTE_PREFIX));
    console.log(`[DEBUG] Found ${voteKeys.length} stored votes:`);
    
    const votes = await AsyncStorage.multiGet(voteKeys);
    votes.forEach(([key, value]) => {
      const gameId = key.replace(VOTE_PREFIX, '');
      console.log(`[DEBUG]   Game ${gameId}: ${value}`);
    });
    
    alert(`Found ${voteKeys.length} stored votes - check console for details`);
  } catch (error) {
    console.error('[DEBUG] Error listing votes:', error);
    alert('Error listing votes');
  }
}

export async function clearVoteForGame(gameId: string) {
  try {
    console.log(`[DEBUG] Clearing vote for game ${gameId}`);
    await AsyncStorage.removeItem(`${VOTE_PREFIX}${gameId}`);
    console.log(`[DEBUG] Cleared vote for game ${gameId}`);
    alert(`Cleared vote for game ${gameId}`);
  } catch (error) {
    console.error('[DEBUG] Error clearing vote:', error);
    alert('Error clearing vote');
  }
}
