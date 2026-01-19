/**
 * ONE-TIME UTILITY: Clear all stored votes
 * Run this once to reset all votes and see the real voting gate
 * 
 * Usage from project root:
 * node clear-votes.js
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

async function clearAllVotes() {
  try {
    console.log('🧹 Clearing all stored votes...');
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter for vote keys
    const voteKeys = allKeys.filter(key => key.startsWith('vote_'));
    
    if (voteKeys.length === 0) {
      console.log('✅ No votes found to clear');
      return;
    }
    
    // Remove all vote keys
    await AsyncStorage.multiRemove(voteKeys);
    
    console.log(`✅ Cleared ${voteKeys.length} vote(s)`);
    console.log('🎯 You can now experience the real voting flow!');
  } catch (error) {
    console.error('❌ Error clearing votes:', error);
  }
}

clearAllVotes();
