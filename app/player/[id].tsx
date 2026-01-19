import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';

// Mock API calls - replace with real API
const getPlayerProfile = async (playerId: string) => {
  // TODO: Replace with actual API call
  return {
    id: playerId,
    number: '7',
    name: 'John Smith',
    position: 'QB',
    team_id: '81',
    team_name: 'Smithson Valley',
    team_mascot: 'Rangers',
    grade: '12',
    height: '6\'2"',
    weight: '195 lbs',
    hometown: 'Spring Branch, TX',
    photo_url: null,
    bio: 'Senior quarterback leading the Rangers to a 9-1 record.',
  };
};

const getPlayerStats = async (playerId: string) => {
  // TODO: Replace with actual API call
  return {
    player_id: playerId,
    player_name: 'John Smith',
    season: '2025',
    games_played: 10,
    games_started: 10,
    // Passing
    passing_completions: 180,
    passing_attempts: 265,
    passing_yards: 2145,
    passing_tds: 14,
    passing_ints: 5,
    passing_completion_pct: 67.9,
    // Rushing
    rushing_attempts: 45,
    rushing_yards: 234,
    rushing_tds: 3,
    rushing_avg: 5.2,
  };
};

export default function PlayerProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'stats' | 'game-log'>('stats');
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    loadPlayerData();
  }, [id]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      const [player, stats] = await Promise.all([
        getPlayerProfile(id as string),
        getPlayerStats(id as string),
      ]);
      setPlayerData(player);
      setStatsData(stats);
    } catch (error) {
      console.error('Error loading player:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading player...</Text>
        </View>
      </>
    );
  }

  if (!playerData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>Player not found</Text>
        </View>
      </>
    );
  }

  const hasPassing = statsData?.passing_yards && statsData.passing_yards > 0;
  const hasRushing = statsData?.rushing_yards && statsData.rushing_yards > 0;
  const hasReceiving = statsData?.receiving_yards && statsData.receiving_yards > 0;
  const hasDefense = statsData?.tackles && statsData.tackles > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
            </Pressable>

            {/* Player Photo & Info */}
            <View style={styles.playerHeader}>
              {playerData.photo_url ? (
                <Image source={{ uri: playerData.photo_url }} style={styles.playerPhoto} />
              ) : (
                <View style={styles.playerPhotoFallback}>
                  <Ionicons name="person" size={64} color={Colors.TEXT_TERTIARY} />
                </View>
              )}

              <View style={styles.playerInfo}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>#{playerData.number}</Text>
                </View>
                <Text style={styles.playerName}>{playerData.name}</Text>
                <Text style={styles.playerPosition}>{playerData.position}</Text>
                <Pressable
                  style={styles.teamLink}
                  onPress={() => router.push(`/team/${playerData.team_id}`)}
                >
                  <Text style={styles.teamName}>
                    {playerData.team_name} {playerData.team_mascot}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.SURGE} />
                </Pressable>
              </View>
            </View>

            {/* Player Details */}
            <View style={styles.detailsRow}>
              {playerData.grade && (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Grade</Text>
                  <Text style={styles.detailValue}>{playerData.grade}</Text>
                </View>
              )}
              {playerData.height && (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Height</Text>
                  <Text style={styles.detailValue}>{playerData.height}</Text>
                </View>
              )}
              {playerData.weight && (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{playerData.weight}</Text>
                </View>
              )}
              {playerData.hometown && (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Hometown</Text>
                  <Text style={styles.detailValue}>{playerData.hometown}</Text>
                </View>
              )}
            </View>

            {playerData.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioText}>{playerData.bio}</Text>
              </View>
            )}
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
              onPress={() => setActiveTab('stats')}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
                Season Stats
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'game-log' && styles.tabActive]}
              onPress={() => setActiveTab('game-log')}
            >
              <Text style={[styles.tabText, activeTab === 'game-log' && styles.tabTextActive]}>
                Game Log
              </Text>
            </Pressable>
          </View>

          {/* Content based on active tab */}
          <View style={styles.content}>
            {activeTab === 'stats' && statsData && (
              <View style={styles.statsSection}>
                {/* Games Played */}
                <View style={styles.statCard}>
                  <Text style={styles.statCardTitle}>Games</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Played</Text>
                    <Text style={styles.statValue}>{statsData.games_played}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Started</Text>
                    <Text style={styles.statValue}>{statsData.games_started}</Text>
                  </View>
                </View>

                {/* Passing Stats */}
                {hasPassing && (
                  <View style={styles.statCard}>
                    <Text style={styles.statCardTitle}>Passing</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Yards</Text>
                      <Text style={styles.statValue}>{statsData.passing_yards}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Touchdowns</Text>
                      <Text style={styles.statValue}>{statsData.passing_tds}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Interceptions</Text>
                      <Text style={styles.statValue}>{statsData.passing_ints}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Completion %</Text>
                      <Text style={styles.statValue}>{statsData.passing_completion_pct}%</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Completions/Attempts</Text>
                      <Text style={styles.statValue}>
                        {statsData.passing_completions}/{statsData.passing_attempts}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Rushing Stats */}
                {hasRushing && (
                  <View style={styles.statCard}>
                    <Text style={styles.statCardTitle}>Rushing</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Yards</Text>
                      <Text style={styles.statValue}>{statsData.rushing_yards}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Touchdowns</Text>
                      <Text style={styles.statValue}>{statsData.rushing_tds}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Attempts</Text>
                      <Text style={styles.statValue}>{statsData.rushing_attempts}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Avg Per Carry</Text>
                      <Text style={styles.statValue}>{statsData.rushing_avg}</Text>
                    </View>
                  </View>
                )}

                {/* Receiving Stats */}
                {hasReceiving && (
                  <View style={styles.statCard}>
                    <Text style={styles.statCardTitle}>Receiving</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Yards</Text>
                      <Text style={styles.statValue}>{statsData.receiving_yards}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Touchdowns</Text>
                      <Text style={styles.statValue}>{statsData.receiving_tds}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Receptions</Text>
                      <Text style={styles.statValue}>{statsData.receptions}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Avg Per Catch</Text>
                      <Text style={styles.statValue}>{statsData.receiving_avg}</Text>
                    </View>
                  </View>
                )}

                {/* Defensive Stats */}
                {hasDefense && (
                  <View style={styles.statCard}>
                    <Text style={styles.statCardTitle}>Defense</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Tackles</Text>
                      <Text style={styles.statValue}>{statsData.tackles}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Sacks</Text>
                      <Text style={styles.statValue}>{statsData.sacks || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Interceptions</Text>
                      <Text style={styles.statValue}>{statsData.interceptions || 0}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'game-log' && (
              <View style={styles.comingSoon}>
                <Ionicons name="calendar-outline" size={64} color={Colors.TEXT_TERTIARY} />
                <Text style={styles.comingSoonText}>Game log coming soon</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.ERROR,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: Colors.CHARCOAL,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playerHeader: {
    alignItems: 'center',
    gap: 16,
  },
  playerPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.SURGE,
  },
  playerPhotoFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.GRAPHITE,
    backgroundColor: Colors.VOID,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    alignItems: 'center',
    gap: 6,
  },
  numberBadge: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.BASALT,
  },
  playerName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  playerPosition: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },
  teamLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.SURGE,
  },

  // Details Row
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  detailBox: {
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },

  // Bio Section
  bioSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.VOID,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  bioText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.CHARCOAL,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.SURGE,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: Colors.TEXT_PRIMARY,
    fontWeight: '700',
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Stats Section
  statsSection: {
    gap: 16,
  },
  statCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.GRAPHITE,
    gap: 12,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.SURGE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },

  // Coming Soon
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
  },
});
