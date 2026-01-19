import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getScores } from '@/src/lib/api';
import { Colors } from '@/src/constants/design';
import type { LiveGame, FinishedGame, UpcomingGame, Classification } from '@/src/lib/types/game';

const CLASSIFICATIONS: Classification[] = ['6A', '5A-D1', '5A-D2', '4A-D1', '4A-D2', '3A-D1', '3A-D2', '2A-D1', '2A-D2', '1A-D1'];

// iPad-optimized Game Card Component
const IPadGameCard = ({ 
  game, 
  onPress, 
  status,
}: { 
  game: LiveGame | FinishedGame | UpcomingGame; 
  onPress: () => void;
  status: 'live' | 'finished' | 'upcoming';
}) => {
  const isLive = status === 'live';
  const isFinished = status === 'finished';
  const isUpcoming = status === 'upcoming';
  
  // Get scores (only for live/finished)
  const homeScore = 'home_score' in game ? game.home_score : 0;
  const awayScore = 'away_score' in game ? game.away_score : 0;
  
  // Determine winner for finished games
  const homeWon = isFinished && (homeScore > awayScore);
  const awayWon = isFinished && (awayScore > homeScore);
  
  // Format time for upcoming games
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'TBD';
    return timeStr;
  };

  return (
    <Pressable 
      style={styles.gameCard}
      onPress={onPress}
    >
      {/* Teams & Scores */}
      <View style={styles.teamsContainer}>
        {/* Away Team */}
        <View style={styles.teamRow}>
          <View style={[styles.teamColorDot, { backgroundColor: game.away_primary_color || '#666' }]} />
          <Text style={[
            styles.teamName,
            awayWon && styles.teamNameWinner,
            !awayWon && isFinished && styles.teamNameLoser
          ]} numberOfLines={1}>
            {game.away_team_name}
          </Text>
          {(isLive || isFinished) && (
            <Text style={[
              styles.score,
              awayWon && styles.scoreWinner
            ]}>
              {awayScore}
            </Text>
          )}
        </View>
        
        {/* Home Team */}
        <View style={styles.teamRow}>
          <View style={[styles.teamColorDot, { backgroundColor: game.home_primary_color || '#666' }]} />
          <Text style={[
            styles.teamName,
            homeWon && styles.teamNameWinner,
            !homeWon && isFinished && styles.teamNameLoser
          ]} numberOfLines={1}>
            {game.home_team_name}
          </Text>
          {(isLive || isFinished) && (
            <Text style={[
              styles.score,
              homeWon && styles.scoreWinner
            ]}>
              {homeScore}
            </Text>
          )}
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        {isLive && (
          <View style={styles.liveBadgeSmall}>
            <View style={styles.liveDotTiny} />
            <Text style={styles.liveTextSmall}>{(game as LiveGame).quarter || 'LIVE'}</Text>
          </View>
        )}
        {isFinished && (
          <Text style={styles.finalText}>Final</Text>
        )}
        {isUpcoming && (
          <Text style={styles.timeText}>{formatTime((game as UpcomingGame).time)}</Text>
        )}
        
        <Pressable style={styles.statsButton} onPress={onPress}>
          <Text style={styles.statsButtonText}>
            {isUpcoming ? 'Preview' : 'Full Stats'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.BASALT} />
        </Pressable>
      </View>
    </Pressable>
  );
};

export default function CoachScoresScreen() {
  const router = useRouter();
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
      const dateStr = (game as any).kickoff_at || (game as any).date || (game as any).started_at;
      if (!dateStr) return;

      let date: Date;
      if ((game as any).date && (game as any).date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = (game as any).date.split('-').map(Number);
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
    router.push(`/(coach)/game/${gameId}?status=${status}`);
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

  // Render games in 2-column grid
  const renderGamesGrid = (games: (LiveGame | FinishedGame | UpcomingGame)[], status: 'live' | 'finished' | 'upcoming') => {
    const rows = [];
    for (let i = 0; i < games.length; i += 2) {
      const hasSecondCard = !!games[i + 1];
      const rowKey = `${status}-${games[i].id}-row`;
      rows.push(
        <View key={rowKey} style={styles.gameRow}>
          <View style={styles.cardWrapper}>
            <IPadGameCard 
              game={games[i]} 
              onPress={() => navigateToGame(games[i].id, status)}
              status={status}
            />
          </View>
          <View style={styles.cardWrapper}>
            {hasSecondCard ? (
              <IPadGameCard 
                game={games[i + 1]} 
                onPress={() => navigateToGame(games[i + 1].id, status)}
                status={status}
              />
            ) : null}
          </View>
        </View>
      );
    }
    return rows;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.SURGE} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scores</Text>
          <View style={styles.headerRight}>
            {autoRefreshEnabled && (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveText}>LIVE UPDATES</Text>
              </View>
            )}
            <Pressable 
              style={styles.bracketButton}
              onPress={() => router.push('/(coach)/playoff-bracket')}
            >
              <Ionicons name="trophy-outline" size={18} color={Colors.BASALT} />
              <Text style={styles.bracketButtonText}>Playoff Bracket</Text>
            </Pressable>
          </View>
        </View>

        {/* Classification Filters */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[styles.filterChip, !selectedClassification && styles.filterChipActive]}
              onPress={() => setSelectedClassification(null)}
            >
              <Text style={[styles.filterText, !selectedClassification && styles.filterTextActive]}>All Classes</Text>
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
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={40} color={Colors.BLAZE} />
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
              <Text style={styles.gameCount}>{liveGames.length} game{liveGames.length !== 1 ? 's' : ''}</Text>
            </View>
            {groupGamesByDate(liveGames).map(({ date, games }) => (
              <View key={`live-${date}`}>
                <Text style={styles.dateHeader}>{date}</Text>
                {renderGamesGrid(games, 'live')}
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Games */}
        {futureUpcomingGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={22} color={Colors.SURGE} />
              <Text style={styles.sectionTitle}>Upcoming Games</Text>
              <Text style={styles.gameCount}>{futureUpcomingGames.length} game{futureUpcomingGames.length !== 1 ? 's' : ''}</Text>
            </View>
            {groupGamesByDate(futureUpcomingGames).map(({ date, games }) => (
              <View key={`upcoming-${date}`}>
                <Text style={styles.dateHeader}>{date}</Text>
                {renderGamesGrid(games, 'upcoming')}
              </View>
            ))}
          </View>
        )}

        {/* Recent Results */}
        {finishedGames.length > 0 && (
          <View style={styles.section}>
            {groupGamesByDate(finishedGames.slice(0, 30)).map(({ date, games }) => (
              <View key={`finished-${date}`}>
                <Text style={styles.dateHeader}>{date}</Text>
                {renderGamesGrid(games, 'finished')}
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {liveGames.length === 0 && finishedGames.length === 0 && futureUpcomingGames.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={80} color="#666" />
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
    backgroundColor: '#323232',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#999',
    fontFamily: 'NeueHaas-Medium',
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bracketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  bracketButtonText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BASALT,
  },
  title: {
    fontSize: 42,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 54, 54, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 54, 54, 0.3)',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.BLAZE,
  },
  liveDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.BLAZE,
  },
  liveText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BLAZE,
    letterSpacing: 0.5,
  },
  filterWrapper: {
    marginBottom: 24,
  },
  filterContainer: {
    paddingHorizontal: 32,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#3a3a3a',
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  filterChipActive: {
    backgroundColor: Colors.SURGE,
    borderColor: Colors.SURGE,
  },
  filterText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#999',
  },
  filterTextActive: {
    color: Colors.BASALT,
    fontFamily: 'NeueHaas-Bold',
  },
  errorContainer: {
    marginHorizontal: 32,
    marginBottom: 24,
    padding: 32,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: Colors.BLAZE,
    textAlign: 'center',
    fontFamily: 'NeueHaas-Medium',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.SURGE,
    borderRadius: 24,
  },
  retryText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BASALT,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    flex: 1,
  },
  gameCount: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
  },
  dateHeader: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#aaa',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  gameRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  gameCard: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamsContainer: {
    flex: 1,
    gap: 12,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamName: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
    flex: 1,
  },
  teamNameWinner: {
    fontFamily: 'NeueHaas-Bold',
  },
  teamNameLoser: {
    color: '#888',
  },
  score: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    minWidth: 40,
    textAlign: 'right',
  },
  scoreWinner: {
    color: Colors.SURGE,
  },
  statusContainer: {
    alignItems: 'flex-start',
    gap: 12,
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#555',
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 54, 54, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDotTiny: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BLAZE,
  },
  liveTextSmall: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BLAZE,
  },
  finalText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statsButtonText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BASALT,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 26,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Medium',
    color: '#666',
    textAlign: 'center',
  },
});
