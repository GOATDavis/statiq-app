import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/design';
import { isTeamFollowed, toggleTeamFollow } from '@/src/lib/storage';
import { 
  getTeam, 
  getTeamSchedule as apiGetTeamSchedule,
  getTeamSeasonLeaders,
  getTeamRecentGames,
  TeamSeasonLeadersResponse,
  TeamRecentGamesResponse,
} from '@/src/lib/api';
import { FinishedGameCard, UpcomingGameCard } from '@/components/fan/GameCards';
import { FollowingIcon } from '@/components/icons/FollowingIcon';
import { ChatRoom } from '../../../components/shared/ChatRoom';
import { getTeamChatRoom, type ChatRoom as ChatRoomType } from '../../../src/lib/chat-api';

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
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'scores' | 'stats' | 'standings' | 'chat'>('scores');
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Chat state
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Stats state
  const [seasonLeaders, setSeasonLeaders] = useState<TeamSeasonLeadersResponse | null>(null);
  const [recentGames, setRecentGames] = useState<TeamRecentGamesResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    setActiveTab('scores'); // Reset to scores tab when team changes
    loadTeamData();
    checkFollowStatus();
  }, [id]);

  // Load chat room when Chat tab is selected
  useEffect(() => {
    if (activeTab === 'chat' && id && !chatRoom && !chatError) {
      loadChatRoom();
    }
  }, [activeTab, id]);

  // Load stats when Stats tab is selected
  useEffect(() => {
    if (activeTab === 'stats' && id && !seasonLeaders && !recentGames) {
      loadStats();
    }
  }, [activeTab, id]);

  const loadStats = async () => {
    if (!id) return;
    
    setIsLoadingStats(true);
    try {
      const [leaders, games] = await Promise.all([
        getTeamSeasonLeaders(id as string).catch(err => {
          console.warn('[Stats] Season leaders not available:', err.message);
          return null;
        }),
        getTeamRecentGames(id as string, 6).catch(err => {
          console.warn('[Stats] Recent games not available:', err.message);
          return null;
        }),
      ]);
      
      setSeasonLeaders(leaders);
      setRecentGames(games);
    } catch (err: any) {
      console.error('[Stats] Error loading stats:', err.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadChatRoom = async () => {
    if (!id) return;
    
    setIsLoadingChat(true);
    try {
      const room = await getTeamChatRoom(parseInt(id as string));
      setChatRoom(room);
      setChatError(null);
    } catch (err: any) {
      console.warn('[Chat] Chat not available for this team:', err.message);
      setChatError('Chat coming soon for this team');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleBack = () => {
    if (from === 'browse') {
      router.push('/(fan)/browse');
    } else if (from === 'following') {
      router.push('/(fan)/following');
    } else if (from === 'scores') {
      router.push('/(fan)/scores');
    } else {
      router.back();
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
      console.log('[Team Profile] Toggle follow clicked, current state:', isFollowing);
      const newFollowStatus = await toggleTeamFollow(id as string);
      console.log('[Team Profile] New follow status:', newFollowStatus);
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
      
      // Fetch all opponent teams data in parallel
      const opponentIds = [...new Set(schedule.games.map((g: any) => g.opponent_id).filter(Boolean))];
      const opponentTeamsData = await Promise.all(
        opponentIds.map((opponentId: string) => 
          getTeam(opponentId).catch(err => {
            console.warn(`Failed to fetch opponent ${opponentId}:`, err);
            return null;
          })
        )
      );
      
      // Create a map of opponent data
      const opponentMap = new Map();
      opponentTeamsData.forEach((opponentTeam, index) => {
        if (opponentTeam) {
          opponentMap.set(opponentIds[index], {
            record: `${opponentTeam.wins || 0}-${opponentTeam.losses || 0}`,
            primary_color: opponentTeam.primary_color || '#FF6600',
          });
        }
      });
      
      // Attach opponent data to each game
      const gamesWithOpponentData = schedule.games.map((game: any) => {
        const opponentData = opponentMap.get(game.opponent_id);
        return {
          ...game,
          opponent_record: opponentData?.record || '0-0',
          opponent_primary_color: opponentData?.primary_color || '#FF6600',
        };
      });
      
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
        primary_color: team.primary_color || '#FF6600',
      };
      
      setTeamData(transformedTeam);
      setScheduleData({ ...schedule, games: gamesWithOpponentData });
    } catch (error) {
      console.error('Error loading team:', error);
      setTeamData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !teamData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Compact Header Bar - ESPN Style */}
      <View style={[styles.headerBar, { paddingTop: insets.top, backgroundColor: teamData.primary_color }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </Pressable>

        <View style={styles.teamInfo}>
          <Text style={styles.teamName} numberOfLines={1}>{teamData.name}</Text>
          <Text style={styles.teamMascot} numberOfLines={1}>{teamData.mascot}</Text>
        </View>

        <View style={styles.recordSection}>
          <Text style={styles.recordLabel}>Record</Text>
          <Text style={styles.recordValue}>{teamData.record}</Text>
        </View>

        <View style={styles.streakSection}>
          <Text style={styles.streakLabel}>Streak</Text>
          <Text style={styles.streakValue}>{teamData.current_streak}</Text>
        </View>

        <Pressable style={styles.starButton} onPress={handleToggleFollow}>
          <FollowingIcon 
            size={28} 
            color="#FFFFFF" 
            filled={isFollowing}
          />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable style={styles.tab} onPress={() => setActiveTab('scores')}>
          <Text style={[styles.tabText, activeTab === 'scores' && styles.tabTextActive]}>
            Scores
          </Text>
          {activeTab === 'scores' && <View style={[styles.tabIndicator, { backgroundColor: teamData.primary_color }]} />}
        </Pressable>

        <Pressable style={styles.tab} onPress={() => setActiveTab('stats')}>
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
          {activeTab === 'stats' && <View style={[styles.tabIndicator, { backgroundColor: teamData.primary_color }]} />}
        </Pressable>

        <Pressable style={styles.tab} onPress={() => setActiveTab('standings')}>
          <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>
            Standings
          </Text>
          {activeTab === 'standings' && <View style={[styles.tabIndicator, { backgroundColor: teamData.primary_color }]} />}
        </Pressable>

        <Pressable style={styles.tab} onPress={() => setActiveTab('chat')}>
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
            Chat
          </Text>
          {activeTab === 'chat' && <View style={[styles.tabIndicator, { backgroundColor: teamData.primary_color }]} />}
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'chat' ? (
        // Chat tab: Full screen, no ScrollView wrapper
        <View style={{ flex: 1 }}>
          {chatError ? (
            <View style={styles.chatErrorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#666" />
              <Text style={styles.chatErrorText}>{chatError}</Text>
            </View>
          ) : chatRoom ? (
            <ChatRoom
              roomId={chatRoom.id}
              roomName={chatRoom.room_name}
            />
          ) : isLoadingChat ? (
            <View style={styles.chatLoadingContainer}>
              <ActivityIndicator size="large" color={Colors.SURGE} />
              <Text style={styles.chatLoadingText}>Loading chat...</Text>
            </View>
          ) : null}
        </View>
      ) : (
        // Other tabs: Use ScrollView
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
        {activeTab === 'scores' && scheduleData && (
          <View style={styles.scoresSection}>
            {(() => {
              // Deduplicate and filter games
              const seen = new Set<string>();
              const uniqueGames = (scheduleData.games || [])
                .filter((game: any) => {
                  // Filter 1: Remove games with score "0-0" string
                  if (game.score === '0-0') return false;
                  
                  // Filter 2: Remove upcoming games that are in the PAST (bad data)
                  if (!game.result && game.date) {
                    const gameDate = new Date(game.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (gameDate < today) return false; // Past "upcoming" games are bad data
                  }
                  
                  // Filter 3: Deduplicate by opponent name + date
                  const key = `${game.opponent_name}-${game.date}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  
                  return true;
                })
                // Sort games: Upcoming playoff first, then ALL games chronologically (oldest to newest)
                .sort((a: any, b: any) => {
                  // Step 1: Upcoming playoff games at the very top
                  // Treat game as playoff if: is_playoff is true OR it's upcoming and after Nov 15
                  const isPlayoffGame = (game: any) => {
                    if (game.is_playoff === true) return true;
                    // If game is upcoming (no result) and date is after Nov 15, treat as playoff
                    if (!game.result && game.date) {
                      const gameDate = new Date(game.date);
                      const playoffStartDate = new Date('2025-11-15');
                      return gameDate >= playoffStartDate;
                    }
                    return false;
                  };
                  
                  const aIsUpcomingPlayoff = !a.result && isPlayoffGame(a);
                  const bIsUpcomingPlayoff = !b.result && isPlayoffGame(b);
                  if (aIsUpcomingPlayoff && !bIsUpcomingPlayoff) return -1;
                  if (!aIsUpcomingPlayoff && bIsUpcomingPlayoff) return 1;
                  
                  // Step 2: All other games (finished and upcoming regular) in chronological order
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  return dateA - dateB; // Oldest first (Week 1, Week 2, ... Week 11, upcoming regular)
                });
              
              return uniqueGames.map((game: any) => {
              // Parse the score string (e.g., "35-28") if it exists
              let homeScore = 0;
              let awayScore = 0;
              if (game.score) {
                const scores = game.score.split('-');
                if (scores.length === 2) {
                  const score1 = parseInt(scores[0], 10);
                  const score2 = parseInt(scores[1], 10);
                  if (game.is_home) {
                    homeScore = score1;
                    awayScore = score2;
                  } else {
                    homeScore = score2;
                    awayScore = score1;
                  }
                }
              }
              
              // Skip ALL games where both scores are 0 (duplicates/bad data)
              // For upcoming games, they shouldn't have a score field at all
              if (homeScore === 0 && awayScore === 0 && game.score) {
                return null;
              }
              
              // Format date for display (convert "2024-08-29" to "Fri, 8/29")
              let formattedDate = game.date;
              if (game.date && game.result) {
                try {
                  const dateObj = new Date(game.date + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const month = dateObj.getMonth() + 1;
                  const day = dateObj.getDate();
                  formattedDate = `${dayName}, ${month}/${day}`;
                } catch (e) {
                  formattedDate = game.date;
                }
              }
              
              const transformedGame = {
                id: game.id,
                home_team_id: game.is_home ? teamData.id : game.opponent_id,
                away_team_id: game.is_home ? game.opponent_id : teamData.id,
                home_team_name: game.is_home ? teamData.name : game.opponent_name,
                away_team_name: game.is_home ? game.opponent_name : teamData.name,
                home_team_mascot: game.is_home ? teamData.mascot : (game.opponent_mascot || ''),
                away_team_mascot: game.is_home ? (game.opponent_mascot || '') : teamData.mascot,
                home_score: homeScore,
                away_score: awayScore,
                home_record: game.is_home ? teamData.record : (game.opponent_record || '0-0'),
                away_record: game.is_home ? (game.opponent_record || '0-0') : teamData.record,
                home_primary_color: game.is_home ? teamData.primary_color : (game.opponent_primary_color || '#FF6600'),
                away_primary_color: game.is_home ? (game.opponent_primary_color || '#FF6600') : teamData.primary_color,
                classification: game.classification || teamData.classification,
                date: formattedDate,
                final_status: 'Final',
                location: game.location || '',
                time: game.time || '',
                week: game.week,
                is_playoff: game.is_playoff || false,
                status: game.result ? 'Final' : 'Scheduled',
              };
              
              // Use UpcomingGameCard for scheduled games, FinishedGameCard for finished games
              if (!game.result) {
                return (
                  <UpcomingGameCard
                    key={game.id}
                    game={transformedGame}
                    onPress={() => router.push(`/game/${game.id}`)}
                    isFollowed={false}
                  />
                );
              }
              
              return (
                <FinishedGameCard
                  key={game.id}
                  game={transformedGame}
                  onPress={() => game.result && router.push(`/game/${game.id}`)}
                  isFollowed={false}
                />
              );
              });
            })()}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsContainer}>
            {isLoadingStats ? (
              <View style={styles.statsLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.SURGE} />
                <Text style={styles.statsLoadingText}>Loading stats...</Text>
              </View>
            ) : (
              <>
                {/* Season Leaders Section */}
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Season Leaders</Text>
                  
                  {seasonLeaders ? (
                    <View style={styles.leadersContainer}>
                      {/* Passing Leader */}
                      {seasonLeaders.passing_leader && (
                        <View style={styles.leaderCard}>
                          <View style={styles.leaderHeader}>
                            <Text style={styles.leaderCategory}>PASSING</Text>
                          </View>
                          <View style={styles.leaderContent}>
                            <View style={styles.leaderInfo}>
                              <Text style={styles.leaderName}>{seasonLeaders.passing_leader.name}</Text>
                              <Text style={styles.leaderPosition}>
                                {seasonLeaders.passing_leader.position}
                                {seasonLeaders.passing_leader.jersey && ` #${seasonLeaders.passing_leader.jersey}`}
                              </Text>
                            </View>
                            <View style={styles.leaderStats}>
                              <Text style={styles.leaderStatPrimary}>{seasonLeaders.passing_leader.yards} YDS</Text>
                              <Text style={styles.leaderStatSecondary}>
                                {seasonLeaders.passing_leader.tds} TD | {seasonLeaders.passing_leader.completions}/{seasonLeaders.passing_leader.attempts}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Rushing Leader */}
                      {seasonLeaders.rushing_leader && (
                        <View style={styles.leaderCard}>
                          <View style={styles.leaderHeader}>
                            <Text style={styles.leaderCategory}>RUSHING</Text>
                          </View>
                          <View style={styles.leaderContent}>
                            <View style={styles.leaderInfo}>
                              <Text style={styles.leaderName}>{seasonLeaders.rushing_leader.name}</Text>
                              <Text style={styles.leaderPosition}>
                                {seasonLeaders.rushing_leader.position}
                                {seasonLeaders.rushing_leader.jersey && ` #${seasonLeaders.rushing_leader.jersey}`}
                              </Text>
                            </View>
                            <View style={styles.leaderStats}>
                              <Text style={styles.leaderStatPrimary}>{seasonLeaders.rushing_leader.yards} YDS</Text>
                              <Text style={styles.leaderStatSecondary}>
                                {seasonLeaders.rushing_leader.tds} TD | {seasonLeaders.rushing_leader.attempts} CAR
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Receiving Leader */}
                      {seasonLeaders.receiving_leader && (
                        <View style={styles.leaderCard}>
                          <View style={styles.leaderHeader}>
                            <Text style={styles.leaderCategory}>RECEIVING</Text>
                          </View>
                          <View style={styles.leaderContent}>
                            <View style={styles.leaderInfo}>
                              <Text style={styles.leaderName}>{seasonLeaders.receiving_leader.name}</Text>
                              <Text style={styles.leaderPosition}>
                                {seasonLeaders.receiving_leader.position}
                                {seasonLeaders.receiving_leader.jersey && ` #${seasonLeaders.receiving_leader.jersey}`}
                              </Text>
                            </View>
                            <View style={styles.leaderStats}>
                              <Text style={styles.leaderStatPrimary}>{seasonLeaders.receiving_leader.yards} YDS</Text>
                              <Text style={styles.leaderStatSecondary}>
                                {seasonLeaders.receiving_leader.tds} TD | {seasonLeaders.receiving_leader.receptions} REC
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* No leaders available */}
                      {!seasonLeaders.passing_leader && !seasonLeaders.rushing_leader && !seasonLeaders.receiving_leader && (
                        <Text style={styles.noDataText}>No season stats available yet</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>Season leaders not available</Text>
                  )}
                </View>

                {/* Last 6 Games Section */}
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Last 6 Games</Text>
                  
                  {recentGames && recentGames.games.length > 0 ? (
                    <View style={styles.recentGamesContainer}>
                      {recentGames.games.map((game) => (
                        <Pressable
                          key={game.game_id}
                          style={styles.recentGameCard}
                          onPress={() => router.push(`/game/${game.game_id}`)}
                        >
                          <View style={styles.recentGameResult}>
                            <View style={[
                              styles.resultBadge,
                              { backgroundColor: game.result === 'W' ? '#22C55E' : game.result === 'L' ? '#EF4444' : '#6B7280' }
                            ]}>
                              <Text style={styles.resultText}>{game.result}</Text>
                            </View>
                          </View>
                          <View style={styles.recentGameInfo}>
                            <Text style={styles.recentGameOpponent}>
                              {game.location} {game.opponent_name}
                            </Text>
                            <Text style={styles.recentGameDate}>{game.date}</Text>
                          </View>
                          <View style={styles.recentGameScore}>
                            <Text style={styles.recentGameScoreText}>
                              {game.team_score}-{game.opponent_score}
                            </Text>
                          </View>
                          <View style={[
                            styles.opponentColorBar,
                            { backgroundColor: game.opponent_color }
                          ]} />
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>No recent games available</Text>
                  )}
                </View>
              </>
            )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6600',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  teamInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  teamMascot: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.75,
    lineHeight: 17,
  },
  headerDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  recordSection: {
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.65,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  recordValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakSection: {
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.65,
    marginBottom: 2,
    textTransform: 'uppercase',
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
  scoresSection: {
    backgroundColor: '#2A2A2A',
    marginBottom: 8,
    borderRadius: 10,
    marginHorizontal: 0,
    overflow: 'hidden',
    marginTop: 16,
  },
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
  chatContainer: {
    flex: 1,
    minHeight: 500,
    paddingBottom: 120,
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

  // Stats Styles
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  statsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  statsLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 12,
  },
  leadersContainer: {
    gap: 12,
  },
  leaderCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderHeader: {
    backgroundColor: Colors.GRAPHITE,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  leaderCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.SURGE,
    letterSpacing: 1,
  },
  leaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  leaderPosition: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  leaderStats: {
    alignItems: 'flex-end',
  },
  leaderStatPrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  leaderStatSecondary: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    marginTop: 2,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
    paddingVertical: 24,
  },
  recentGamesContainer: {
    gap: 8,
  },
  recentGameCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 0,
    overflow: 'hidden',
  },
  recentGameResult: {
    marginRight: 12,
  },
  resultBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentGameInfo: {
    flex: 1,
  },
  recentGameOpponent: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  recentGameDate: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    marginTop: 2,
  },
  recentGameScore: {
    paddingHorizontal: 12,
  },
  recentGameScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  opponentColorBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
});
