import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { getScores } from '@/src/lib/api';

/**
 * Game Detail Router for Coach Phone
 * Determines which game detail screen to show based on game status
 */
export default function GameDetailRouter() {
  const { id, status } = useLocalSearchParams<{ id: string; status?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[GameRouter] ============ MOUNTED ============');
  console.log('[GameRouter] id:', id, 'status:', status);

  useEffect(() => {
    console.log('[GameRouter] useEffect triggered, id:', id, 'status:', status);
    
    const determineGameScreen = async () => {
      try {
        // If status was passed via query param, use it directly
        if (status === 'upcoming') {
          console.log('[GameRouter] Routing to UPCOMING screen');
          router.replace(`/(coach-phone)/game/upcoming/${id}`);
          return;
        }
        if (status === 'live') {
          console.log('[GameRouter] Routing to LIVE screen');
          router.replace(`/(coach-phone)/game/live/${id}`);
          return;
        }
        if (status === 'finished') {
          console.log('[GameRouter] Routing to FINISHED screen');
          router.replace(`/(coach-phone)/game/finished/${id}`);
          return;
        }

        console.log('[GameRouter] No status param, fetching scores to determine...');
        
        // Otherwise, fetch all games to find the specific one
        const scores = await getScores();
        const allGames = [
          ...scores.live_games,
          ...scores.finished_games,
          ...scores.upcoming_games
        ];
        
        console.log('[GameRouter] Total games found:', allGames.length);
        
        const game = allGames.find(g => g.id === id);
        
        if (!game) {
          console.log('[GameRouter] Game not found for id:', id);
          setError('Game not found');
          setLoading(false);
          return;
        }

        console.log('[GameRouter] Found game:', game.home_team_name, 'vs', game.away_team_name);

        // Determine game status and redirect to appropriate screen
        const isLive = scores.live_games.some(g => g.id === id);
        const isUpcoming = scores.upcoming_games.some(g => g.id === id);
        const isFinished = scores.finished_games.some(g => g.id === id);
        
        console.log('[GameRouter] isLive:', isLive, 'isUpcoming:', isUpcoming, 'isFinished:', isFinished);
        
        if (isUpcoming) {
          console.log('[GameRouter] Detected UPCOMING, navigating...');
          router.replace(`/(coach-phone)/game/upcoming/${id}`);
        } else if (isLive) {
          console.log('[GameRouter] Detected LIVE, navigating...');
          router.replace(`/(coach-phone)/game/live/${id}`);
        } else {
          console.log('[GameRouter] Detected FINISHED, navigating...');
          router.replace(`/(coach-phone)/game/finished/${id}`);
        }
      } catch (err) {
        console.error('[GameRouter] Error:', err);
        setError('Failed to load game');
        setLoading(false);
      }
    };

    if (id) {
      determineGameScreen();
    }
  }, [id, status]);

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BASALT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.BLAZE,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
