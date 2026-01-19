import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { getScores } from '@/src/lib/api';

/**
 * Game Detail Router
 * This file determines which game detail screen to show based on game status
 */
export default function GameDetailRouter() {
  const { id, voteFor } = useLocalSearchParams<{ id: string; voteFor?: 'home' | 'away' }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const determineGameScreen = async () => {
      try {
        // Fetch all games to find the specific one
        const scores = await getScores();
        const allGames = [
          ...scores.live_games,
          ...scores.finished_games,
          ...scores.upcoming_games
        ];
        
        const game = allGames.find(g => g.id === id);
        
        if (!game) {
          setError('Game not found');
          setLoading(false);
          return;
        }

        // Determine game status and redirect to appropriate screen
        const isLive = scores.live_games.some(g => g.id === id);
        const isUpcoming = scores.upcoming_games.some(g => g.id === id);
        
        if (isUpcoming) {
          // Redirect to pregame/upcoming detail screen
          const params = voteFor ? `?voteFor=${voteFor}` : '';
          router.replace(`/(fan)/game/upcoming/${id}${params}`);
        } else if (isLive) {
          // Redirect to live game screen
          router.replace(`/(fan)/game/live/${id}`);
        } else {
          // Finished game - show basic game detail
          // For now, stay on this screen
          // TODO: Create a proper finished game detail screen
          setError('Finished game details coming soon');
          setLoading(false);
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
  }, [id, voteFor]);

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
    backgroundColor: Colors.SHADOW,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.TEXT_SECONDARY,
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
