# Debugging Locked Predictions

## Issue: Vote not showing after returning to scores screen

### Debug Steps:

1. **Check Console Logs:**
```
[GameCard {gameId}] Checking vote (trigger: {number})
[GameCard {gameId}] Vote found: {home|away|null}
```

2. **Verify Vote Storage:**
```javascript
// In your dev tools or add to scores.tsx temporarily:
import { getVote } from '@/src/lib/votes';

// Log all votes for visible games:
upcomingGames.forEach(game => {
  getVote(game.id).then(vote => {
    console.log(`Game ${game.id}: vote =`, vote);
  });
});
```

3. **Check AsyncStorage:**
```javascript
// Add to scores.tsx temporarily:
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.getAllKeys().then(keys => {
  const voteKeys = keys.filter(k => k.startsWith('vote_'));
  console.log('Stored votes:', voteKeys);
  
  AsyncStorage.multiGet(voteKeys).then(pairs => {
    pairs.forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  });
});
```

4. **Verify useFocusEffect is Firing:**
```javascript
// In scores.tsx, add log to useFocusEffect:
useFocusEffect(
  useCallback(() => {
    console.log('[Scores] Screen focused, incrementing refreshKey');
    setRefreshKey(prev => {
      console.log('[Scores] refreshKey:', prev, '->', prev + 1);
      return prev + 1;
    });
  }, [])
);
```

5. **Check Navigation:**
```javascript
// In game detail screen, verify vote submission:
const handleVote = async (team: 'home' | 'away') => {
  console.log('[Vote] Starting vote for:', team);
  
  try {
    await storeVote(id as string, team);
    console.log('[Vote] Stored locally');
    
    await submitVote(id as string, deviceId, team);
    console.log('[Vote] Submitted to backend');
    
    setUserVote(team);
    console.log('[Vote] State updated');
  } catch (error) {
    console.error('[Vote] Error:', error);
  }
};
```

## Common Issues:

### Issue: refreshKey not changing
**Symptom:** Console shows same refreshKey value  
**Solution:** Verify useFocusEffect is imported from 'expo-router'
```typescript
import { useRouter, useFocusEffect } from 'expo-router';
```

### Issue: Vote stored but not showing
**Symptom:** AsyncStorage has vote, but UI shows buttons  
**Solution:** Check GameCard's useEffect dependencies
```typescript
React.useEffect(() => {
  getVote(game.id).then(vote => setUserVote(vote));
}, [game.id, refreshTrigger]); // ← Make sure refreshTrigger is here
```

### Issue: Vote showing on one game but not others
**Symptom:** Only some games show prediction bar  
**Solution:** Verify all UpcomingGameCard instances receive refreshTrigger
```tsx
<UpcomingGameCard
  key={game.id}
  game={game}
  refreshTrigger={refreshKey} // ← Must be present
  // ... other props
/>
```

### Issue: Prediction bar showing wrong percentages
**Symptom:** Bar shows 50/50 instead of real data  
**Solution:** Check backend predictions data structure
```typescript
// In GameCards.tsx:
const totalVotes = (game as any).predictions?.total_votes ?? 0;
console.log('Total votes:', totalVotes);
console.log('Home %:', (game as any).predictions?.home_percentage);
console.log('Away %:', (game as any).predictions?.away_percentage);
```

## Manual Testing Script:

```typescript
// Add this to scores.tsx temporarily for testing:
useEffect(() => {
  // Clear all votes (TESTING ONLY)
  const clearAllVotes = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const voteKeys = keys.filter(k => k.startsWith('vote_'));
    await AsyncStorage.multiRemove(voteKeys);
    console.log('[TEST] Cleared all votes');
  };
  
  // Uncomment to clear votes for testing:
  // clearAllVotes();
}, []);
```

## Force Refresh Button (Development):

Add this to scores.tsx header for manual testing:

```tsx
{__DEV__ && (
  <Pressable 
    onPress={() => {
      console.log('[DEV] Force refresh');
      setRefreshKey(prev => prev + 1);
    }}
    style={{ padding: 10 }}
  >
    <Text style={{ color: Colors.SURGE }}>🔄</Text>
  </Pressable>
)}
```

## Expected Console Output (Working):

```
[Scores] Screen focused, incrementing refreshKey
[Scores] refreshKey: 0 -> 1
[GameCard abc123] Checking vote (trigger: 1)
[GameCard abc123] Vote found: home
[GameCard def456] Checking vote (trigger: 1)
[GameCard def456] Vote found: null
```

## If Still Not Working:

1. Restart Metro bundler
2. Clear app data/cache
3. Uninstall and reinstall app
4. Check Expo version compatibility
5. Verify all files saved and bundler reloaded
