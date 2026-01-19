import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getScores } from '@/src/lib/api';
import { Colors } from '@/src/constants/design';
import type { LiveGame, FinishedGame, UpcomingGame, Classification } from '@/src/lib/types/game';
import {
  LiveGameCard,
  FinishedGameCard,
  UpcomingGameCard,
  DateHeader,
  DateSection,
} from '@/components/fan/GameCards';

type ViewMode = 'live' | 'weekend' | 'weekday' | 'playoff';

const CLASSIFICATIONS: Classification[] = ['6A', '5A-D1', '5A-D2', '4A-D1', '4A-D2', '3A-D1', '3A-D2', '2A-D1', '2A-D2', '1A-D1'];

export default function CoachScoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [finishedGames, setFinishedGames] = useState<FinishedGame[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<Classification | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      loadGames(false);
    }, [])
  );

  useEffect(() => {
    if (autoRefreshEnabled) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [autoRefreshEnabled]);

  const viewMode = useMemo((): ViewMode => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const month = now.getMonth();

    const isPlayoffSeason = month >= 10 && month <= 11;
    return isPlayoffSeason ? 'playoff' :
           (day === 5 && hour >= 17 && hour <= 23) ? 'live' :
           day === 6 ? 'weekend' : 'weekday';
  }, []);

  const deduplicateGames = <T extends { id: string }>(games: T[]): T[] => {
    const seen = new Set<string>();
    return games.filter(game => {
      if (seen.has(game.id)) return false;
      seen.add(game.id);
      return true;
    });
  };

  const loadGames = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const data = await getScores({
        classification: selectedClassification || undefined,
      });

      setLiveGames(deduplicateGames(data.live_games));
      setFinishedGames(deduplicateGames(data.finished_games));
      setUpcomingGames(deduplicateGames(data.upcoming_games));
      setAutoRefreshEnabled(data.live_games.length > 0);
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Failed to load games');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedClassification]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    if (autoRefreshEnabled) {
      const interval = setInterval(() => loadGames(false), 15000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, loadGames]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames(false);
  };

  const groupGamesByDate = <T extends { kickoff_at?: string; date?: string; started_at?: string }>(games: T[]) => {
    const groups: { date: string; games: T[] }[] = [];
    const groupMap = new Map<string, { sortDate: Date; games: T[] }>();

    games.forEach(game => {
      const dateStr = game.kickoff_at || game.date || game.started_at;
      if (!dateStr) return;

      let date: Date;
      if (game.date && game.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = game.date.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateStr);
      }
      
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).toUpperCase();

      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, { sortDate: date, games: [] });
      }
      groupMap.get(dateKey)!.games.push(game);
    });

    Array.from(groupMap.entries())
      .sort(([, a], [, b]) => a.sortDate.getTime() - b.sortDate.getTime())
      .forEach(([date, { games }]) => {
        groups.push({ date, games });
      });

    return groups;
  };

  const navigateToGame = (gameId: string, status: 'live' | 'finished' | 'upcoming') => {
    router.push(`/(coach-phone)/game/${gameId}?status=${status}`);
  };

  // Filter upcoming games to only future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureUpcomingGames = upcomingGames.filter(game => {
    if (!game.date) return true;
    const [year, month, day] = game.date.split('-').map(Number);
    const gameDate = new Date(year, month - 1, day);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate >= today;
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.SURGE} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.title}>Scores</Text>
          {autoRefreshEnabled && (
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Classification Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScroll}
        >
          <Pressable
            style={[styles.filterChip, !selectedClassification && styles.filterChipActive]}
            onPress={() => setSelectedClassification(null)}
          >
            <Text style={[styles.filterText, !selectedClassification && styles.filterTextActive]}>All</Text>
          </Pressable>
          {CLASSIFICATIONS.map(classification => (
            <Pressable
              key={classification}
              style={[styles.filterChip, selectedClassification === classification && styles.filterChipActive]}
              onPress={() => setSelectedClassification(selectedClassification === classification ? null : classification)}
            >
              <Text style={[styles.filterText, selectedClassification === classification && styles.filterTextActive]}>
                {classification}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color={Colors.BLAZE} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadGames()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Live Games */}
        {liveGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveDotSmall} />
              <Text style={styles.sectionTitle}>Live Games</Text>
            </View>
            {groupGamesByDate(liveGames).map(({ date, games }) => (
              <DateSection key={date}>
                <DateHeader date={date} />
                {games.map((game) => (
                  <LiveGameCard
                    key={game.id}
                    game={game}
                    onPress={() => navigateToGame(game.id, 'live')}
                    isFollowed={false}
                  />
                ))}
              </DateSection>
            ))}
          </View>
        )}

        {/* Upcoming Games */}
        {futureUpcomingGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
            </View>
            {groupGamesByDate(futureUpcomingGames).map(({ date, games }) => (
              <DateSection key={date}>
                <DateHeader date={date} />
                {games.map((game) => (
                  <UpcomingGameCard
                    key={game.id}
                    game={game}
                    onPress={() => navigateToGame(game.id, 'upcoming')}
                    isFollowed={false}
                  />
                ))}
              </DateSection>
            ))}
          </View>
        )}

        {/* Recent Results */}
        {finishedGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Results</Text>
            </View>
            {groupGamesByDate(finishedGames.slice(0, 20)).map(({ date, games }) => (
              <DateSection key={date}>
                <DateHeader date={date} />
                {games.map((game) => (
                  <FinishedGameCard
                    key={game.id}
                    game={game}
                    onPress={() => navigateToGame(game.id, 'finished')}
                    isFollowed={false}
                  />
                ))}
              </DateSection>
            ))}
          </View>
        )}

        {/* Empty State */}
        {liveGames.length === 0 && finishedGames.length === 0 && futureUpcomingGames.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No games scheduled</Text>
            <Text style={styles.emptySubtext}>Check back later for upcoming games</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BASALT,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#999',
    fontFamily: 'NeueHaas-Medium',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 54, 54, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 54, 54, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BLAZE,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.BLAZE,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BLAZE,
    letterSpacing: 0.5,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
  },
  filterChipActive: {
    backgroundColor: Colors.SURGE,
    borderColor: Colors.SURGE,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#999',
  },
  filterTextActive: {
    color: Colors.BASALT,
    fontFamily: 'NeueHaas-Bold',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#3a3a3a',
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.BLAZE,
    textAlign: 'center',
    fontFamily: 'NeueHaas-Medium',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.SURGE,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BASALT,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#666',
    textAlign: 'center',
  },
});
