import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/design';
import { FootballIcon } from '@/components/icons/FootballIcon';

// Mock API calls - replace with real API
const getTeamProfile = async (teamId: string) => {
  return {
    id: teamId,
    name: 'Highland Park',
    mascot: 'Scots',
    city: 'Dallas',
    state: 'TX',
    classification: '5A-D1',
    record: '10-1',
    wins: 10,
    losses: 1,
    district_record: '0-0',
    points_for: 0,
    points_against: 0,
    current_streak: 'W11',
    logo_url: null,
  };
};

const getTeamSchedule = async (teamId: string) => {
  return [
    {
      id: '1',
      week: 1,
      date: '2024-10-24',
      opponent_name: 'Centennial',
      is_home: true,
      result: null,
      score: null,
    },
    {
      id: '2',
      week: 2,
      date: '2025-08-29',
      opponent_name: 'Rockwall-Heath',
      is_home: true,
      result: 'L',
      score: '49-52',
    },
    {
      id: '3',
      week: 3,
      date: '2025-09-01',
      opponent_name: 'Cleburne',
      is_home: false,
      result: 'W',
      score: null,
    },
  ];
};

export default function TeamProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'schedule' | 'roster' | 'stats'>('schedule');
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);

  useEffect(() => {
    loadTeamData();
  }, [id]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [team, schedule] = await Promise.all([
        getTeamProfile(id as string),
        getTeamSchedule(id as string),
      ]);
      setTeamData(team);
      setScheduleData(schedule);
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !teamData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
        </View>
      </>
    );
  }

  // Calculate PPG and PA/G
  const totalGames = teamData.wins + teamData.losses;
  const ppg = totalGames > 0 ? (teamData.points_for / totalGames).toFixed(1) : '0.0';
  const papg = totalGames > 0 ? (teamData.points_against / totalGames).toFixed(1) : '0.0';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Back & Star */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={32} color={Colors.TEXT_PRIMARY} />
            </Pressable>
            <Pressable style={styles.starButton}>
              <Ionicons name="star-outline" size={28} color={Colors.TEXT_PRIMARY} />
            </Pressable>
          </View>

          {/* Team Hero Section */}
          <View style={styles.heroSection}>
            {/* Team Logo */}
            <View style={styles.logoCircle}>
              <FootballIcon size={64} color={Colors.SURGE} />
            </View>

            {/* Team Name & Mascot */}
            <Text style={styles.teamName}>{teamData.name}</Text>
            <Text style={styles.teamMascot}>{teamData.mascot}</Text>
            <Text style={styles.teamLocation}>
              {teamData.city}, {teamData.state}
            </Text>

            {/* Record & Classification Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.recordBadge}>
                <Text style={styles.badgeText}>{teamData.record}</Text>
              </View>
              <View style={styles.classificationBadge}>
                <Text style={styles.badgeText}>{teamData.classification}</Text>
              </View>
            </View>
          </View>

          {/* Stats Row - ESPN Style */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{ppg}</Text>
              <Text style={styles.statLabel}>PPG</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{papg}</Text>
              <Text style={styles.statLabel}>PA/G</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.streakValue]}>
                {teamData.current_streak}
              </Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{teamData.district_record}</Text>
              <Text style={styles.statLabel}>DISTRICT</Text>
            </View>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <Pressable style={styles.tab} onPress={() => setActiveTab('schedule')}>
              <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
                Schedule
              </Text>
              {activeTab === 'schedule' && <View style={styles.tabUnderline} />}
            </Pressable>

            <Pressable style={styles.tab} onPress={() => setActiveTab('roster')}>
              <Text style={[styles.tabText, activeTab === 'roster' && styles.tabTextActive]}>
                Roster
              </Text>
              {activeTab === 'roster' && <View style={styles.tabUnderline} />}
            </Pressable>

            <Pressable style={styles.tab} onPress={() => setActiveTab('stats')}>
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
                Stats
              </Text>
              {activeTab === 'stats' && <View style={styles.tabUnderline} />}
            </Pressable>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'schedule' && (
              <View style={styles.scheduleContainer}>
                {scheduleData?.map((game: any) => (
                  <Pressable
                    key={game.id}
                    style={styles.gameCard}
                    onPress={() => game.result && router.push(`/game/${game.id}`)}
                  >
                    <View style={styles.gameHeader}>
                      <Text style={styles.weekText}>WEEK {game.week}</Text>
                      <Text style={styles.gameDateText}>{game.date}</Text>
                    </View>

                    <View style={styles.gameBody}>
                      <Text style={styles.opponentText}>
                        {game.is_home ? 'vs' : '@'} {game.opponent_name}
                      </Text>
                      {game.result && (
                        <View
                          style={[
                            styles.resultBadge,
                            game.result === 'W' ? styles.winBadge : styles.lossBadge,
                          ]}
                        >
                          <Text style={styles.resultText}>{game.result}</Text>
                        </View>
                      )}
                    </View>

                    {game.score && <Text style={styles.scoreText}>{game.score}</Text>}
                  </Pressable>
                ))}
              </View>
            )}

            {activeTab === 'roster' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Roster coming soon</Text>
              </View>
            )}

            {activeTab === 'stats' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Stats coming soon</Text>
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
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 3,
    borderColor: Colors.SURGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  teamName: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
    textAlign: 'center',
  },
  teamMascot: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 4,
    textAlign: 'center',
  },
  teamLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recordBadge: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  classificationBadge: {
    backgroundColor: Colors.CHARCOAL,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },

  // Stats Row - ESPN Style
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    marginBottom: 24,
    backgroundColor: Colors.CHARCOAL,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  streakValue: {
    color: Colors.SURGE,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.GRAPHITE,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 40,
    backgroundColor: Colors.SHADOW,
  },
  tab: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
  },
  tabTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.SURGE,
    borderRadius: 2,
  },

  // Tab Content
  tabContent: {
    paddingTop: 20,
  },

  // Schedule
  scheduleContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gameCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.SURGE,
    letterSpacing: 0.5,
  },
  gameDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },
  gameBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opponentText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  resultBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winBadge: {
    backgroundColor: Colors.SURGE,
  },
  lossBadge: {
    backgroundColor: Colors.BLAZE,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.BASALT,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },
});
