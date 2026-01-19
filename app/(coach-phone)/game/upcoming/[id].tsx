import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Colors } from '@/src/constants/design';
import { getScores, API_BASE, getGameLeaders, getTeamSchedule, getTeam, getVotes } from '@/src/lib/api';
import { getDisplayColor } from '@/src/lib/utils/colors';
import { storeVote, getVote as getStoredVote } from '@/src/lib/votes';
import { PredictionCircle } from '@/components/PredictionCircle';

// Helper function to lighten a color by mixing with white
function lightenColor(hex: string, amount: number = 0.85): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? Colors.BASALT : '#fff';
}

function getTextColorWithTeamPreference(bgColor: string, teamColor: string): string {
  const bgHex = bgColor.replace('#', '');
  const teamHex = teamColor.replace('#', '');
  const bgR = parseInt(bgHex.substr(0, 2), 16);
  const bgG = parseInt(bgHex.substr(2, 2), 16);
  const bgB = parseInt(bgHex.substr(4, 2), 16);
  const teamR = parseInt(teamHex.substr(0, 2), 16);
  const teamG = parseInt(teamHex.substr(2, 2), 16);
  const teamB = parseInt(teamHex.substr(4, 2), 16);
  const bgLuminance = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;
  const teamLuminance = (0.299 * teamR + 0.587 * teamG + 0.114 * teamB) / 255;
  const lighter = Math.max(bgLuminance, teamLuminance);
  const darker = Math.min(bgLuminance, teamLuminance);
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);
  if (contrastRatio > 3.0) {
    return teamColor;
  }
  return Colors.BASALT;
}

// Device ID management
const DEVICE_ID_KEY = 'device_id';

async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error managing device ID:', error);
    return Crypto.randomUUID();
  }
}

// Vote API functions
async function submitVote(gameId: string, deviceId: string, predictedWinner: 'home' | 'away') {
  try {
    const resp = await fetch(`${API_BASE}/games/${gameId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ device_id: deviceId, predicted_winner: predictedWinner }),
    });
    if (!resp.ok) throw new Error(`Failed to submit vote: ${resp.status}`);
    return resp.json();
  } catch (error) {
    console.log('[Vote] Backend unavailable, storing locally');
    return null;
  }
}

export default function CoachPregameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<any>(null);
  const [homeTeamData, setHomeTeamData] = useState<any>(null);
  const [awayTeamData, setAwayTeamData] = useState<any>(null);
  const [leaders, setLeaders] = useState<any>(null);
  const [homeSchedule, setHomeSchedule] = useState<any>(null);
  const [awaySchedule, setAwaySchedule] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [fanVotes, setFanVotes] = useState<any>(null);
  const [userVote, setUserVote] = useState<'home' | 'away' | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [showVoteFooter, setShowVoteFooter] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [activeTab, setActiveTab] = useState<'pregameiq' | 'stats'>('pregameiq');
  
  // Collapsible sections
  const [seasonLeadersExpanded, setSeasonLeadersExpanded] = useState(true);
  const [lastFiveExpanded, setLastFiveExpanded] = useState(true);
  
  // Team toggle for Last 5 Games
  const [lastFiveTeam, setLastFiveTeam] = useState<'home' | 'away'>('home');

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    setUserVote(null);
    setPredictions(null);
    setFanVotes(null);
    loadGameData();
  }, [id]);

  useEffect(() => {
    if (deviceId && id && gameData) {
      checkExistingVote();
    }
  }, [deviceId, id, gameData]);

  const checkExistingVote = async () => {
    if (!id || !deviceId) return;
    
    try {
      const storedVote = await getStoredVote(id as string);
      if (storedVote) {
        setUserVote(storedVote);
        await loadPredictions();
      }
    } catch (error) {
      console.error('[Vote Check] Error:', error);
    }
  };

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      const scores = await getScores();
      const game = [...scores.upcoming_games, ...scores.finished_games].find(g => g.id === id);

      if (!game) {
        console.error('Game not found:', id);
        setIsLoading(false);
        return;
      }

      setGameData(game);
      
      if (game.home_team_id && game.away_team_id) {
        try {
          const [homeTeam, awayTeam] = await Promise.all([
            getTeam(game.home_team_id),
            getTeam(game.away_team_id)
          ]);
          setHomeTeamData(homeTeam);
          setAwayTeamData(awayTeam);
        } catch (err) {
          console.error('[Teams] Error fetching team data:', err);
        }
      }
      
      try {
        const [leadersData, homeScheduleData, awayScheduleData] = await Promise.all([
          getGameLeaders(id as string).catch(() => null),
          game.home_team_id ? getTeamSchedule(game.home_team_id).catch(() => null) : null,
          game.away_team_id ? getTeamSchedule(game.away_team_id).catch(() => null) : null,
        ]);
        
        setLeaders(leadersData);
        setHomeSchedule(homeScheduleData);
        setAwaySchedule(awayScheduleData);
      } catch (err) {
        console.log('[Additional Data] Error loading:', err);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game data:', error);
      setIsLoading(false);
    }
  };

  const handleVote = async (team: 'home' | 'away') => {
    if (!deviceId || !id || isSubmitting || userVote) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVote(id as string, deviceId, team);
      await storeVote(id as string, team);
      setUserVote(team);
      
      setShowVoteConfirmation(true);
      
      setTimeout(() => {
        setShowVoteConfirmation(false);
        setShowVoteFooter(true);
      }, 3000);
      
      await loadPredictions();
    } catch (error) {
      console.error('[Vote] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPredictions = async () => {
    if (!id) return;
    
    try {
      const votes = await getVotes(id as string);
      setFanVotes(votes);
      
      try {
        const baseUrl = API_BASE.replace('/api/v1', '');
        const predictionUrl = `${baseUrl}/games/${id}/analytics`;
        
        const predictionResp = await fetch(predictionUrl, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (predictionResp.ok) {
          const predictionData = await predictionResp.json();
          setPredictions(predictionData);
        }
      } catch (err) {
        console.error('[Predictions] ML predictions error:', err);
      }
    } catch (err) {
      console.error('[Predictions] Error loading predictions:', err);
    }
  };

  const getTeamRecord = (teamData: any, fallbackRecord?: string) => {
    if (!teamData) return fallbackRecord || '0-0';
    if (teamData.record) return teamData.record;
    if (teamData.wins !== undefined && teamData.losses !== undefined) {
      return `${teamData.wins}-${teamData.losses}`;
    }
    if (teamData.overall_record) return teamData.overall_record;
    return fallbackRecord || '0-0';
  };

  if (isLoading || !gameData) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
      </View>
    );
  }

  const gameDate = (() => {
    if (gameData.date && gameData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = gameData.date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(gameData.date);
  })();
  
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const awayColorOriginal = gameData.away_primary_color || '#FF6B35';
  const homeColor = gameData.home_primary_color || '#DC143C';
  const awayColor = lightenColor(awayColorOriginal, 0.85);
  const awayColorCircle = lightenColor(awayColorOriginal, 0.95);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.navigate('/(coach-phone)/scores')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Game Details</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Hero Gradient Header */}
      <LinearGradient
        colors={[homeColor, Colors.BASALT, Colors.BASALT, awayColorCircle]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.05, 0.95, 1]}
        style={styles.heroGradient}
      >
        {/* Home Team - LEFT SIDE */}
        <View style={styles.heroTeam}>
          <Text style={styles.heroTeamName}>{gameData.home_team_name.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{getTeamRecord(homeTeamData, gameData.home_record)}</Text>
        </View>

        {/* Center Info */}
        <View style={styles.heroCenter}>
          <Text style={styles.heroDate}>{formattedDate}</Text>
          <Text style={styles.heroTime}>{gameData.time}</Text>
          <Text style={styles.heroNetwork}>NFHS Network</Text>
        </View>

        {/* Away Team - RIGHT SIDE */}
        <View style={styles.heroTeam}>
          <Text style={styles.heroTeamName}>{gameData.away_team_name.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{getTeamRecord(awayTeamData, gameData.away_record)}</Text>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('pregameiq')}
        >
          <Text style={[styles.tabText, activeTab === 'pregameiq' && styles.tabTextActive]}>
            PregameIQ
          </Text>
          {activeTab === 'pregameiq' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
          {activeTab === 'stats' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PregameIQ Tab */}
        {activeTab === 'pregameiq' && (
          <View style={styles.content}>
            {/* Vote Section - Only show if user hasn't voted */}
            {!userVote && (
              <View style={styles.voteContainer}>
                <View style={styles.voteHeader}>
                  {showVoteFooter ? (
                    <Text style={styles.voteHeaderSubtitle}>
                      According to StatIQ Fans ({(() => {
                        const voteCount = Math.max(1, (fanVotes?.home || 0) + (fanVotes?.away || 0));
                        return `${voteCount.toLocaleString()} ${voteCount === 1 ? 'vote' : 'votes'}`;
                      })()})
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.voteHeaderTitle}>WHO WILL WIN?</Text>
                      <Text style={styles.voteHeaderSubtitle}>
                        Make your prediction to unlock PregameIQ analytics
                      </Text>
                    </>
                  )}
                </View>
                
                <View style={styles.voteCards}>
                  {/* Home Team */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.voteCard,
                      { backgroundColor: homeColor, borderColor: homeColor },
                      pressed && styles.voteCardPressed,
                    ]}
                    onPress={() => handleVote('home')}
                    disabled={isSubmitting}
                  >
                    <View style={styles.voteCardNameContainer}>
                      <Text style={[styles.voteCardTeamName, { color: getContrastColor(homeColor) }]} numberOfLines={2}>{gameData.home_team_name}</Text>
                    </View>
                    <View style={styles.recordContainer}>
                      <Text style={[styles.voteCardRecord, { color: getContrastColor(homeColor), opacity: 0.9 }]}>{getTeamRecord(homeTeamData, gameData.home_record)}</Text>
                    </View>
                    
                    <View style={styles.lastFiveSection}>
                      <Text style={[styles.lastFiveTitle, { color: getContrastColor(homeColor), opacity: 0.7 }]}>Last 5 games:</Text>
                      {(() => {
                        const games = homeSchedule?.games
                          ?.filter((g: any) => g.result !== null)
                          ?.slice(-5)
                          ?.reverse() || [];
                        if (games.length === 0) {
                          return <Text style={[styles.lastFiveGame, { color: getContrastColor(homeColor), opacity: 0.6 }]}>No recent games</Text>;
                        }
                        return games.map((game: any, idx: number) => {
                          const won = game.result === 'W';
                          const opponent = game.opponent_name || 'TBD';
                          const vsAt = game.is_home ? 'vs.' : '@';
                          return (
                            <Text key={idx} style={[styles.lastFiveGame, { color: getContrastColor(homeColor), opacity: 0.85 }]}>
                              {won ? 'W' : 'L'} {vsAt} {opponent}
                            </Text>
                          );
                        });
                      })()}
                    </View>
                    
                    {isSubmitting && (
                      <View style={styles.votingIndicator}>
                        <ActivityIndicator size="small" color={getContrastColor(homeColor)} />
                      </View>
                    )}
                  </Pressable>
                  
                  {/* Away Team */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.voteCard,
                      { backgroundColor: awayColor, borderColor: awayColor },
                      pressed && styles.voteCardPressed,
                    ]}
                    onPress={() => handleVote('away')}
                    disabled={isSubmitting}
                  >
                    <View style={styles.voteCardNameContainer}>
                      <Text style={[styles.voteCardTeamName, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal) }]} numberOfLines={2}>{gameData.away_team_name}</Text>
                    </View>
                    <View style={styles.recordContainer}>
                      <Text style={[styles.voteCardRecord, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.9 }]}>{getTeamRecord(awayTeamData, gameData.away_record)}</Text>
                    </View>
                    
                    <View style={styles.lastFiveSection}>
                      <Text style={[styles.lastFiveTitle, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.7 }]}>Last 5 games:</Text>
                      {(() => {
                        const games = awaySchedule?.games
                          ?.filter((g: any) => g.result !== null)
                          ?.slice(-5)
                          ?.reverse() || [];
                        if (games.length === 0) {
                          return <Text style={[styles.lastFiveGame, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.6 }]}>No recent games</Text>;
                        }
                        return games.map((game: any, idx: number) => {
                          const won = game.result === 'W';
                          const opponent = game.opponent_name || 'TBD';
                          const vsAt = game.is_home ? 'vs.' : '@';
                          return (
                            <Text key={idx} style={[styles.lastFiveGame, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.85 }]}>
                              {won ? 'W' : 'L'} {vsAt} {opponent}
                            </Text>
                          );
                        });
                      })()}
                    </View>
                    
                    {isSubmitting && (
                      <View style={styles.votingIndicator}>
                        <ActivityIndicator size="small" color={getTextColorWithTeamPreference(awayColor, awayColorOriginal)} />
                      </View>
                    )}
                  </Pressable>
                </View>

                {showVoteConfirmation ? (
                  <View style={styles.voteConfirmationFooter}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.SURGE} />
                    <Text style={styles.voteConfirmationFooterText}>
                      Your prediction is locked in
                    </Text>
                  </View>
                ) : (
                  <View style={styles.voteFooter}>
                    <Ionicons name="lock-closed" size={14} color="#666" />
                    <Text style={styles.voteFooterText}>Your prediction will be locked after voting</Text>
                  </View>
                )}
              </View>
            )}

            {/* All content below - Show only after voting */}
            {userVote && (
              <View style={styles.predictionsSection}>
                {showVoteConfirmation && (
                  <Animated.View style={[styles.voteConfirmationBox, { opacity: fadeAnim }]}>
                    <Ionicons name="checkmark-circle" size={28} color={Colors.SURGE} />
                    <Text style={styles.voteConfirmationBoxText}>
                      Your prediction is locked in
                    </Text>
                  </Animated.View>
                )}

                {/* StatIQ Analytics Engine */}
                <View style={styles.predictionCardDark}>
                  <View style={styles.predictionHeaderSection}>
                    <Text style={styles.gamePredictionTitle}>Game Prediction</Text>
                    <Text style={styles.poweredBy}>Powered by StatIQ Analytics Engine</Text>
                  </View>
                  
                  <View style={styles.circleAndPercentages}>
                    <View style={styles.circleContainer}>
                      <PredictionCircle
                        homePercentage={predictions?.home_win_probability || 20}
                        awayPercentage={predictions?.away_win_probability || 80}
                        homeColor={homeColor || '#F75E01'}
                        awayColor={awayColorCircle || '#FF6B9D'}
                        size={160}
                      />
                    </View>

                    <View style={styles.percentageColumn}>
                      {(() => {
                        const homeProb = predictions?.home_win_probability || 20;
                        const awayProb = predictions?.away_win_probability || 80;
                        const homeName = gameData.home_team_name;
                        const awayName = gameData.away_team_name;
                        
                        const teams = [
                          { prob: homeProb, name: homeName, color: homeColor, isHome: true },
                          { prob: awayProb, name: awayName, color: awayColorCircle, isHome: false },
                        ].sort((a, b) => b.prob - a.prob);
                        
                        return teams.map((team, idx) => (
                          <View key={idx} style={styles.percentageGroup}>
                            <Text style={[styles.largePercentage, { color: getDisplayColor(team.color) }]}>
                              {team.prob.toFixed(0)}%
                            </Text>
                            <Text style={styles.teamNameWhite}>{team.name}</Text>
                          </View>
                        ));
                      })()}
                    </View>
                  </View>
                </View>

                {/* Fan Predictions */}
                <View style={styles.predictionCardDark}>
                  <Text style={styles.fanPredictionTitle}>Fan Prediction</Text>
                  
                  <View style={styles.fanPredictionLabels}>
                    <View style={styles.fanLabelSection}>
                      <Text style={styles.fanLabelTeam}>{gameData.home_team_name}</Text>
                      {((fanVotes?.home_percentage || 0) > 0) && (
                        <Text style={[styles.fanLabelPercentage, { color: getDisplayColor(homeColor) }]}>
                          {fanVotes?.home_percentage?.toFixed(0)}%
                        </Text>
                      )}
                    </View>
                    <View style={[styles.fanLabelSection, { alignItems: 'flex-end' }]}>
                      <Text style={styles.fanLabelTeam}>{gameData.away_team_name}</Text>
                      {((fanVotes?.away_percentage || 0) > 0) && (
                        <Text style={[styles.fanLabelPercentage, { color: getDisplayColor(awayColorCircle) }]}>
                          {fanVotes?.away_percentage?.toFixed(0)}%
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.fanPredictionBar}>
                    {((fanVotes?.home_percentage || 0) > 0) && (
                      <View style={[styles.fanBarFill, { 
                        flex: fanVotes?.home_percentage,
                        backgroundColor: getDisplayColor(homeColor),
                        position: 'relative',
                      }]}>
                        {userVote === 'home' && (
                          <View style={styles.voteCheckmarkContainer}>
                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                          </View>
                        )}
                      </View>
                    )}
                    {((fanVotes?.away_percentage || 0) > 0) && (
                      <View style={[styles.fanBarFill, { 
                        flex: fanVotes?.away_percentage,
                        backgroundColor: getDisplayColor(awayColorCircle),
                        position: 'relative',
                      }]}>
                        {userVote === 'away' && (
                          <View style={styles.voteCheckmarkContainer}>
                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.fanPredictionSubtitle}>
                    According to StatIQ Fans ({(() => {
                      const voteCount = Math.max(1, (fanVotes?.home || 0) + (fanVotes?.away || 0));
                      return `${voteCount.toLocaleString()} ${voteCount === 1 ? 'vote' : 'votes'}`;
                    })()})
                  </Text>
                </View>
              </View>
            )}

            {/* Season Leaders */}
            {userVote && (
              <View style={styles.section}>
                <Pressable 
                  style={styles.sectionHeader}
                  onPress={() => setSeasonLeadersExpanded(!seasonLeadersExpanded)}
                >
                  <Text style={styles.sectionTitle}>SEASON LEADERS</Text>
                  <Ionicons 
                    name={seasonLeadersExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#999" 
                  />
                </Pressable>
                
                {seasonLeadersExpanded && leaders && (
                  <View style={styles.sectionContent}>
                    {leaders.home_team?.passing && leaders.away_team?.passing && (
                      <View style={styles.statCategory}>
                        <Text style={styles.statCategoryTitle}>Passing Yards</Text>
                        <View style={styles.statComparison}>
                          <View style={styles.playerCard}>
                            <View style={styles.playerAvatar} />
                            <Text style={styles.statValue}>{leaders.home_team.passing.yards?.toLocaleString() || '0'}</Text>
                            <Text style={styles.playerName}>{leaders.home_team.passing.player_name || 'N/A'}</Text>
                            <Text style={styles.playerPosition}>QB</Text>
                            <Text style={styles.playerStats}>
                              {leaders.home_team.passing.completions}/{leaders.home_team.passing.attempts}, {leaders.home_team.passing.touchdowns} TD
                            </Text>
                          </View>
                          <View style={styles.playerCard}>
                            <View style={styles.playerAvatar} />
                            <Text style={styles.statValue}>{leaders.away_team.passing.yards?.toLocaleString() || '0'}</Text>
                            <Text style={styles.playerName}>{leaders.away_team.passing.player_name || 'N/A'}</Text>
                            <Text style={styles.playerPosition}>QB</Text>
                            <Text style={styles.playerStats}>
                              {leaders.away_team.passing.completions}/{leaders.away_team.passing.attempts}, {leaders.away_team.passing.touchdowns} TD
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {leaders.home_team?.rushing && leaders.away_team?.rushing && (
                      <View style={styles.statCategory}>
                        <Text style={styles.statCategoryTitle}>Rushing Yards</Text>
                        <View style={styles.statComparison}>
                          <View style={styles.playerCard}>
                            <View style={styles.playerAvatar} />
                            <Text style={styles.statValue}>{leaders.home_team.rushing.yards?.toLocaleString() || '0'}</Text>
                            <Text style={styles.playerName}>{leaders.home_team.rushing.player_name || 'N/A'}</Text>
                            <Text style={styles.playerPosition}>RB</Text>
                            <Text style={styles.playerStats}>
                              {leaders.home_team.rushing.attempts} ATT, {leaders.home_team.rushing.touchdowns} TD
                            </Text>
                          </View>
                          <View style={styles.playerCard}>
                            <View style={styles.playerAvatar} />
                            <Text style={styles.statValue}>{leaders.away_team.rushing.yards?.toLocaleString() || '0'}</Text>
                            <Text style={styles.playerName}>{leaders.away_team.rushing.player_name || 'N/A'}</Text>
                            <Text style={styles.playerPosition}>RB</Text>
                            <Text style={styles.playerStats}>
                              {leaders.away_team.rushing.attempts} ATT, {leaders.away_team.rushing.touchdowns} TD
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {leaders.home_team?.receiving && leaders.away_team?.receiving && (
                      <View style={styles.statCategory}>
                        <Text style={styles.statCategoryTitle}>Receiving Yards</Text>
                        <View style={styles.statComparison}>
                          <View style={styles.playerCard}>
                            <View style={styles.playerAvatar} />
                            <Text style={styles.statValue}>{leaders.home_team.receiving.yards?.toLocaleString() || '0'}</Text>
                            <Text style={styles.playerName}>{leaders.home_team.receiving.player_name || 'N/A'}</Text>
                            <Text style={styles.playerPosition}>WR</Text>
                            <Text style={styles.playerStats}>
                              {leaders.home_team.receiving.receptions} REC, {leaders.home_team.receiving.touchdowns} TD
                            </Text>
                          </View>
                          <View style={styles.playerCard}>
                            <View style={styles.playerAvatar} />
                            <Text style={styles.statValue}>{leaders.away_team.receiving.yards?.toLocaleString() || '0'}</Text>
                            <Text style={styles.playerName}>{leaders.away_team.receiving.player_name || 'N/A'}</Text>
                            <Text style={styles.playerPosition}>WR</Text>
                            <Text style={styles.playerStats}>
                              {leaders.away_team.receiving.receptions} REC, {leaders.away_team.receiving.touchdowns} TD
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
                
                {seasonLeadersExpanded && !leaders && (
                  <View style={styles.sectionContent}>
                    <Text style={styles.comingSoon}>Season leaders coming soon</Text>
                  </View>
                )}
              </View>
            )}

            {/* Last Five Games */}
            {userVote && (
              <View style={styles.section}>
                <Pressable 
                  style={styles.sectionHeader}
                  onPress={() => setLastFiveExpanded(!lastFiveExpanded)}
                >
                  <Text style={styles.sectionTitle}>LAST FIVE GAMES</Text>
                  <Ionicons 
                    name={lastFiveExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#999" 
                  />
                </Pressable>
                
                {lastFiveExpanded && (
                  <View style={styles.sectionContent}>
                    <View style={styles.teamToggle}>
                      <Pressable 
                        style={[styles.toggleButton, lastFiveTeam === 'home' && styles.toggleButtonActive]}
                        onPress={() => setLastFiveTeam('home')}
                      >
                        <Text style={[
                          styles.toggleButtonText,
                          lastFiveTeam === 'home' && styles.toggleButtonTextActive
                        ]}>
                          {gameData.home_team_name}
                        </Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.toggleButton, lastFiveTeam === 'away' && styles.toggleButtonActive]}
                        onPress={() => setLastFiveTeam('away')}
                      >
                        <Text style={[
                          styles.toggleButtonText,
                          lastFiveTeam === 'away' && styles.toggleButtonTextActive
                        ]}>
                          {gameData.away_team_name}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.gamesTable}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>DATE</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>OPP</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>RESULT</Text>
                      </View>
                      
                      {(() => {
                        const schedule = lastFiveTeam === 'home' ? homeSchedule : awaySchedule;
                        const games = schedule?.completed_games?.slice(0, 5) || [];
                        
                        if (games.length === 0) {
                          return (
                            <Text style={styles.comingSoon}>No recent games</Text>
                          );
                        }
                        
                        return games.map((game: any, idx: number) => {
                          const gameDate = new Date(game.date);
                          const formattedGameDate = `${gameDate.getMonth() + 1}/${gameDate.getDate()}`;
                          const isHomeGame = lastFiveTeam === 'home' ? true : game.is_home;
                          const opponent = game.opponent_name || 'TBD';
                          const score = `${game.team_score}-${game.opponent_score}`;
                          const won = game.team_score > game.opponent_score;
                          
                          return (
                            <View key={idx} style={styles.tableRow}>
                              <Text style={[styles.tableCell, { flex: 1 }]}>{formattedGameDate}</Text>
                              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                                {isHomeGame ? 'vs' : '@'} {opponent}
                              </Text>
                              <View style={[styles.resultBadge, { 
                                backgroundColor: won ? '#00C853' : '#FF1744',
                                flex: 1,
                                alignItems: 'flex-end'
                              }]}>
                                <Text style={styles.resultText}>{won ? 'W' : 'L'}</Text>
                                <Text style={styles.resultScore}>{score}</Text>
                              </View>
                            </View>
                          );
                        });
                      })()}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <View style={styles.content}>
            <Text style={styles.comingSoon}>Stats coming soon</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.BASALT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.BASALT,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  heroTeam: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
    maxWidth: 120,
  },
  heroTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },
  heroRecord: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.85,
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.75,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.75,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroNetwork: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.75,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.BASALT,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: Colors.SURGE,
    borderRadius: 2,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  voteContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 0,
    marginBottom: 4,
  },
  voteHeader: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 64,
    justifyContent: 'center',
  },
  voteHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  voteHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  voteCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  voteCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 2,
    gap: 8,
    minHeight: 260,
  },
  voteCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  voteCardNameContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    minHeight: 48,
  },
  voteCardTeamName: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  recordContainer: {
    width: '100%',
    minHeight: 32,
    justifyContent: 'center',
  },
  voteCardRecord: {
    fontSize: 16,
    fontWeight: '700',
  },
  lastFiveSection: {
    width: '100%',
    gap: 4,
  },
  lastFiveTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastFiveGame: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  votingIndicator: {
    marginTop: 4,
  },
  voteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  voteFooterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  voteConfirmationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  voteConfirmationFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.SURGE,
  },
  voteConfirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.BASALT,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: Colors.SURGE,
    marginHorizontal: 0,
    marginBottom: 16,
  },
  voteConfirmationBoxText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  predictionsSection: {
    gap: 4,
    marginBottom: 4,
  },
  predictionCardDark: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 0,
    marginBottom: 4,
  },
  predictionHeaderSection: {
    marginBottom: 12,
  },
  gamePredictionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  poweredBy: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999',
  },
  circleAndPercentages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageColumn: {
    gap: 16,
    justifyContent: 'center',
  },
  percentageGroup: {
    alignItems: 'flex-start',
  },
  largePercentage: {
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 52,
  },
  teamNameWhite: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
    marginTop: 2,
  },
  fanPredictionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  fanPredictionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  fanLabelSection: {
    flex: 1,
    gap: 2,
  },
  fanLabelTeam: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fanLabelPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
  },
  fanPredictionBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  fanBarFill: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCheckmarkContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    right: 8,
  },
  fanPredictionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 0,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  sectionContent: {
    gap: 24,
  },
  statCategory: {
    gap: 16,
  },
  statCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  statComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerPosition: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  playerStats: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  teamToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.SURGE,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  gamesTable: {
    gap: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  resultScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  comingSoon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    paddingVertical: 60,
  },
});
