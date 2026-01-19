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
import { isTeamFollowed, toggleTeamFollow } from '@/src/lib/storage';
import { getTeam, getTeamSchedule as apiGetTeamSchedule } from '@/src/lib/api';
import { FinishedGameCard } from '@/components/fan/GameCards';
import { ChatRoom } from '@/components/shared/ChatRoom';
import { getTeamChatRoom, type ChatRoom as ChatRoomType } from '@/src/lib/chat-api';

// Helper function to calculate current win/loss streak
const calculateStreak = (games: any[]) => {
  if (!games || games.length === 0) return '';
  
  const completedGames = games
    .filter(g => g.result)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (completedGames.length === 0) return '';
  
  const latestResult = completedGames[0].result;
  let streakCount = 0;
  
  for (const game of completedGames) {
    if (game.result === latestResult) {
      streakCount++;
    } else {
      break;
    }
  }
  
  return `${latestResult}${streakCount}`;
};

export default function FanTeamProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'scores' | 'stats' | 'standings' | 'chat'>('scores');
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
    checkFollowStatus();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && !chatRoom && !chatLoading) {
      loadChatRoom();
    }
  }, [activeTab]);

  const loadChatRoom = async () => {
    try {
      setChatLoading(true);
      setChatError(null);
      const room = await getTeamChatRoom(Number(id));
      setChatRoom(room);
    } catch (err: any) {
      console.error('Error loading chat room:', err);
      setChatError(err.message || 'Failed to load chat');
    } finally {
      setChatLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const followed = await isTeamFollowed(id as string);
      setIsFollowing(followed);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const newFollowStatus = await toggleTeamFollow(id as string);
      setIsFollowing(newFollowStatus);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      const [team, schedule] = await Promise.all([
        getTeam(id as string),
        apiGetTeamSchedule(id as string),
      ]);
      
      if (!team) {
        console.error('No team data returned from API');
        setTeamData(null);
        return;
      }
      
      const transformedTeam = {
        id: team.id,
        name: team.name,
        mascot: team.mascot || '',
        city: team.city || '',
        state: team.state || 'TX',
        classification: team.classification || '',
        record: `${team.wins || 0}-${team.losses || 0}`,
        wins: team.wins || 0,
        losses: team.losses || 0,
        current_streak: calculateStreak(schedule.games || []),
      };
      
      setTeamData(transformedTeam);
      setScheduleData(schedule);
    } catch (error) {
      console.error('Error loading team:', error);
      setTeamData(null);
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

  // Group games by date
  const groupGamesByDate = (games: any[]) => {
    const groups: { date: string; games: any[] }[] = [];
    const groupMap = new Map<string, { sortDate: Date; games: any[] }>();

    games.forEach(game => {
      const dateStr = game.kickoff_at || game.date || game.started_at;
      if (!dateStr) return;

      const date = new Date(dateStr);
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Compact Header Bar - ESPN Style */}
        <View style={[styles.headerBar, { paddingTop: insets.top }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
          </Pressable>

          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{teamData.name}</Text>
            <Text style={styles.teamMascot}>{teamData.mascot}</Text>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.recordSection}>
            <Text style={styles.recordLabel}>Record</Text>
            <Text style={styles.recordValue}>{teamData.record}</Text>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.streakSection}>
            <Text style={styles.streakLabel}>Streak</Text>
            <Text style={styles.streakValue}>{teamData.current_streak}</Text>
          </View>

          <Pressable style={styles.starButton} onPress={handleToggleFollow}>
            <Ionicons 
              name={isFollowing ? "star" : "star-outline"} 
              size={32} 
              color="#FFFFFF" 
            />
          </Pressable>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable style={styles.tab} onPress={() => setActiveTab('scores')}>
            <Text style={[styles.tabText, activeTab === 'scores' && styles.tabTextActive]}>
              Scores
            </Text>
            {activeTab === 'scores' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable style={styles.tab} onPress={() => setActiveTab('stats')}>
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
              Stats
            </Text>
            {activeTab === 'stats' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable style={styles.tab} onPress={() => setActiveTab('standings')}>
            <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>
              Standings
            </Text>
            {activeTab === 'standings' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable style={styles.tab} onPress={() => setActiveTab('chat')}>
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
              Chat
            </Text>
            {activeTab === 'chat' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'chat' ? (
          // Chat gets full height without ScrollView wrapper
          <View style={{ flex: 1 }}>
            {chatError ? (
              <View style={styles.chatErrorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.BLAZE} />
                <Text style={styles.chatErrorText}>{chatError}</Text>
                <Pressable 
                  style={styles.retryButton} 
                  onPress={loadChatRoom}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : chatRoom ? (
              <ChatRoom 
                roomId={chatRoom.id} 
                roomName={chatRoom.name}
              />
            ) : chatLoading ? (
              <View style={styles.chatLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.SURGE} />
                <Text style={styles.chatLoadingText}>Loading chat...</Text>
              </View>
            ) : null}
          </View>
        ) : (
          // Other tabs use ScrollView
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'scores' && scheduleData && (
            <View style={styles.scoresSection}>
              {(scheduleData.games || []).map((game: any) => {
                // Transform team schedule game to match FinishedGameCard format
                const transformedGame = {
                  id: game.id,
                  home_team_id: game.is_home ? teamData.id : game.opponent_id,
                  away_team_id: game.is_home ? game.opponent_id : teamData.id,
                  home_team_name: game.is_home ? teamData.name : game.opponent_name,
                  away_team_name: game.is_home ? game.opponent_name : teamData.name,
                  home_team_mascot: game.is_home ? teamData.mascot : (game.opponent_mascot || ''),
                  away_team_mascot: game.is_home ? (game.opponent_mascot || '') : teamData.mascot,
                  home_score: game.home_score || 0,
                  away_score: game.away_score || 0,
                  classification: teamData.classification,
                  date: game.date || game.kickoff_at,
                  status: game.result ? 'Final' : 'Scheduled',
                };
                
                return (
                  <FinishedGameCard
                    key={game.id}
                    game={transformedGame}
                    onPress={() => game.result && router.push(`/game/${game.id}`)}
                    isFollowed={false}
                  />
                );
              })}
            </View>
          )}

          {activeTab === 'stats' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Team stats coming soon</Text>
            </View>
          )}

          {activeTab === 'standings' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Standings coming soon</Text>
            </View>
          )}

          </ScrollView>
        )}
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

  // Header Bar - Compact ESPN Style
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6600',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  teamMascot: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  headerDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  recordSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  recordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.CHARCOAL,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
  },
  tabTextActive: {
    color: Colors.TEXT_PRIMARY,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6600',
  },

  // Scores Section
  scoresSection: {
    marginHorizontal: 2,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },

  // Empty State
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },

  // Chat Styles
  chatLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  chatLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  chatErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 16,
  },
  chatErrorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.BASALT,
    fontSize: 16,
    fontWeight: '600',
  },
});
