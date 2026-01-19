import React, { useState, useEffect, useRef } from 'react';
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
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Colors } from '@/src/constants/design';
import { 
  getScores, 
  API_BASE, 
  getGameLeaders, 
  getTeam, 
  getVotes,
  getTeamSeasonLeaders,
  getTeamRecentGames,
  TeamSeasonLeadersResponse,
  TeamRecentGamesResponse,
} from '@/src/lib/api';
import { getDisplayColor } from '@/src/lib/utils/colors';
import { storeVote, getVote as getStoredVote } from '@/src/lib/votes';
import { PredictionCircle } from '@/components/PredictionCircle';
import { ChatRoom } from '../../../../components/shared/ChatRoom';
import { getGameChatRoom, type ChatRoom as ChatRoomType } from '../../../../src/lib/chat-api';
import { GameShareCard } from '@/components/share/GameShareCard';

// Helper function to lighten a color by mixing with white
function lightenColor(hex: string, amount: number = 0.85): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Lighten by mixing with white
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Helper function to determine if a color is light or dark and return contrast color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark color for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? Colors.BASALT : '#fff';
}

// Helper function to detect if color is very light
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

// Helper function to get text color with original team color preference
function getTextColorWithTeamPreference(bgColor: string, teamColor: string): string {
  // Remove # if present
  const bgHex = bgColor.replace('#', '');
  const teamHex = teamColor.replace('#', '');
  
  // Convert background to RGB
  const bgR = parseInt(bgHex.substr(0, 2), 16);
  const bgG = parseInt(bgHex.substr(2, 2), 16);
  const bgB = parseInt(bgHex.substr(4, 2), 16);
  
  // Convert team color to RGB
  const teamR = parseInt(teamHex.substr(0, 2), 16);
  const teamG = parseInt(teamHex.substr(2, 2), 16);
  const teamB = parseInt(teamHex.substr(4, 2), 16);
  
  // Calculate relative luminance for both colors
  const bgLuminance = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;
  const teamLuminance = (0.299 * teamR + 0.587 * teamG + 0.114 * teamB) / 255;
  
  // Calculate contrast ratio
  const lighter = Math.max(bgLuminance, teamLuminance);
  const darker = Math.min(bgLuminance, teamLuminance);
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);
  
  // If contrast is good (ratio > 3.0), use original team color
  // Otherwise use BASALT for better readability
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

export default function PregameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<any>(null);
  const [homeTeamData, setHomeTeamData] = useState<any>(null);
  const [awayTeamData, setAwayTeamData] = useState<any>(null);
  const [leaders, setLeaders] = useState<any>(null);
  const [homeSeasonLeaders, setHomeSeasonLeaders] = useState<TeamSeasonLeadersResponse | null>(null);
  const [awaySeasonLeaders, setAwaySeasonLeaders] = useState<TeamSeasonLeadersResponse | null>(null);
  const [homeRecentGames, setHomeRecentGames] = useState<TeamRecentGamesResponse | null>(null);
  const [awayRecentGames, setAwayRecentGames] = useState<TeamRecentGamesResponse | null>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [fanVotes, setFanVotes] = useState<any>(null);
  const [userVote, setUserVote] = useState<'home' | 'away' | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [showVoteFooter, setShowVoteFooter] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1)); // For fade out animation
  const [activeTab, setActiveTab] = useState<'pregameiq' | 'stats' | 'tickets' | 'chat'>('pregameiq');
  
  // Share card ref
  const viewShotRef = useRef<ViewShot>(null);
  
  // Chat state
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  // Collapsible sections
  const [seasonLeadersExpanded, setSeasonLeadersExpanded] = useState(true);
  const [lastFiveExpanded, setLastFiveExpanded] = useState(true);
  
  // Team toggle for Last 5 Games
  const [lastFiveTeam, setLastFiveTeam] = useState<'home' | 'away'>('home');

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  // Load chat room when Chat tab is selected
  useEffect(() => {
    if (activeTab === 'chat' && id && !chatRoom && !chatError) {
      loadChatRoom();
    }
  }, [activeTab, id]);

  const loadChatRoom = async () => {
    if (!id) return;
    
    setIsLoadingChat(true);
    try {
      console.log('[Chat] Loading chat for game ID:', id);
      const room = await getGameChatRoom(parseInt(id as string));
      console.log('[Chat] Successfully loaded chat room:', room);
      setChatRoom(room);
      setChatError(null);
    } catch (err: any) {
      console.log('[Chat] Error loading room:', err.message);
      if (err.message === 'CHAT_CLOSED') {
        // Check if this is an upcoming game
        if (gameData) {
          const gameDate = new Date(gameData.date);
          const now = new Date();
          if (gameDate > now) {
            // Upcoming game - chat should be open but backend says closed
            setChatError('Chat is temporarily unavailable. Please try again later.');
          } else {
            // Past game
            setChatError('This game chat has closed. Game chats close when the game is final.');
          }
        } else {
          setChatError('This game chat has closed. Game chats close when the game is final.');
        }
      } else {
        setChatError(err.message || 'Failed to load chat');
      }
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    // Reset vote state when game changes
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

  // Debug: Log userVote state changes
  useEffect(() => {
    console.log(`[PregameIQ] userVote state changed:`, userVote);
    if (userVote) {
      console.log(`[PregameIQ] ✅ User HAS voted - predictions should be visible`);
    } else {
      console.log(`[PregameIQ] ❌ User has NOT voted - predictions should be hidden`);
    }
  }, [userVote]);

  const checkExistingVote = async () => {
    if (!id || !deviceId) return;
    
    try {
      const storedVote = await getStoredVote(id as string);
      console.log(`[Vote Check] Game ${id}: stored vote = ${storedVote}`);
      
      if (storedVote) {
        console.log(`[Vote Check] User has already voted for ${storedVote} team`);
        setUserVote(storedVote);
        // Load predictions if user already voted
        await loadPredictions();
      } else {
        console.log(`[Vote Check] No existing vote found - user must vote first`);
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
      
      // Fetch team profiles for accurate records
      if (game.home_team_id && game.away_team_id) {
        try {
          console.log('[Teams] Fetching team data for:', game.home_team_id, game.away_team_id);
          const [homeTeam, awayTeam] = await Promise.all([
            getTeam(game.home_team_id),
            getTeam(game.away_team_id)
          ]);
          console.log('[Teams] Home team full data:', JSON.stringify(homeTeam, null, 2));
          console.log('[Teams] Away team full data:', JSON.stringify(awayTeam, null, 2));
          setHomeTeamData(homeTeam);
          setAwayTeamData(awayTeam);
        } catch (err) {
          console.error('[Teams] Error fetching team data:', err);
        }
      } else {
        console.log('[Teams] Missing team IDs:', game.home_team_id, game.away_team_id);
      }
      
      // Fetch leaders, season leaders, and recent games in parallel
      try {
        const [leadersData, homeSeasonLeadersData, awaySeasonLeadersData, homeRecentGamesData, awayRecentGamesData] = await Promise.all([
          getGameLeaders(id as string).catch(() => null),
          game.home_team_id ? getTeamSeasonLeaders(game.home_team_id).catch(() => null) : null,
          game.away_team_id ? getTeamSeasonLeaders(game.away_team_id).catch(() => null) : null,
          game.home_team_id ? getTeamRecentGames(game.home_team_id, 5).catch(() => null) : null,
          game.away_team_id ? getTeamRecentGames(game.away_team_id, 5).catch(() => null) : null,
        ]);
        
        setLeaders(leadersData);
        setHomeSeasonLeaders(homeSeasonLeadersData);
        setAwaySeasonLeaders(awaySeasonLeadersData);
        setHomeRecentGames(homeRecentGamesData);
        setAwayRecentGames(awayRecentGamesData);
        
        console.log('[Pregame] Home season leaders:', homeSeasonLeadersData);
        console.log('[Pregame] Away season leaders:', awaySeasonLeadersData);
        console.log('[Pregame] Home recent games:', homeRecentGamesData);
        console.log('[Pregame] Away recent games:', awayRecentGamesData);
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
    console.log('[Vote] Button pressed for:', team);
    
    if (!deviceId || !id || isSubmitting || userVote) {
      console.log('[Vote] Blocked - already voted or missing requirements');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVote(id as string, deviceId, team);
      await storeVote(id as string, team);
      setUserVote(team);
      console.log('[Vote] Vote successful:', team);
      
      // Show "Your prediction is locked in" for 3 seconds
      setShowVoteConfirmation(true);
      
      setTimeout(() => {
        // Hide confirmation, show footer with vote count
        setShowVoteConfirmation(false);
        setShowVoteFooter(true);
      }, 3000);
      
      // Fetch predictions and fan votes after voting
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
      console.log('[Predictions] Loading for game:', id);
      
      // Fetch fan votes
      const votes = await getVotes(id as string);
      console.log('[Predictions] Fan votes:', JSON.stringify(votes, null, 2));
      setFanVotes(votes);
      
      // Fetch ML predictions if available
      try {
        // Note: analytics endpoint is at /games not /api/v1/games
        const baseUrl = API_BASE.replace('/api/v1', '');
        const predictionUrl = `${baseUrl}/games/${id}/analytics`;
        console.log('[Predictions] Full API_BASE:', API_BASE);
        console.log('[Predictions] Constructed baseUrl:', baseUrl);
        console.log('[Predictions] Final predictionUrl:', predictionUrl);
        
        const predictionResp = await fetch(predictionUrl, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        console.log('[Predictions] Response status:', predictionResp.status);
        
        if (predictionResp.ok) {
          const predictionData = await predictionResp.json();
          console.log('[Predictions] ML prediction data:', JSON.stringify(predictionData, null, 2));
          setPredictions(predictionData);
        } else {
          const errorText = await predictionResp.text();
          console.log('[Predictions] Response not OK:', predictionResp.status, errorText);
        }
      } catch (err) {
        console.error('[Predictions] ML predictions error:', err);
      }
    } catch (err) {
      console.error('[Predictions] Error loading predictions:', err);
    }
  };

  // Get team records - try multiple field names
  const getTeamRecord = (teamData: any, fallbackRecord?: string) => {
    if (!teamData) return fallbackRecord || '0-0';
    
    // Try direct record field
    if (teamData.record) return teamData.record;
    
    // Try wins/losses fields
    if (teamData.wins !== undefined && teamData.losses !== undefined) {
      return `${teamData.wins}-${teamData.losses}`;
    }
    
    // Try overall_record
    if (teamData.overall_record) return teamData.overall_record;
    
    return fallbackRecord || '0-0';
  };

  // Handle share button with custom share card
  const handleShare = async () => {
    if (!gameData || !viewShotRef.current) return;
    
    try {
      // Capture the share card as an image
      const uri = await viewShotRef.current.capture();
      
      // Share the image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${gameData.away_team_name} vs ${gameData.home_team_name}`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading || !gameData) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
      </View>
    );
  }

  const gameDate = (() => {
    // Parse date in local timezone to avoid UTC issues
    if (gameData.date && gameData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For YYYY-MM-DD format, parse in local timezone
      const [year, month, day] = gameData.date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // For ISO timestamps, use standard parsing
    return new Date(gameData.date);
  })();
  
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  // Get team colors - fallback to defaults if not available
  const awayColorOriginal = gameData.away_primary_color || '#FF6B35';
  const homeColor = gameData.home_primary_color || '#DC143C';
  
  // Apply away team styling - lightened color for bars/backgrounds
  const awayColor = lightenColor(awayColorOriginal, 0.85);
  // Very very light for circle - 95% white, 5% main color
  const awayColorCircle = lightenColor(awayColorOriginal, 0.95);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </Pressable>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton}>
            <Image 
              source={require('@/assets/images/notification-bell-filled-white.png')}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleShare}>
            <Image 
              source={require('@/assets/images/export-icon.png')}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>

      {/* Hero Gradient Header */}
      <LinearGradient
        colors={[homeColor, Colors.SHADOW, Colors.SHADOW, awayColorCircle]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.05, 0.95, 1]}
        style={styles.heroGradient}
      >
        {/* Home Team - LEFT SIDE */}
        <Pressable
          style={styles.heroTeam}
          onPress={() => {
            if (gameData.home_team_id) {
              router.push(`/(fan)/team/${gameData.home_team_id}`);
            }
          }}
        >
          <Text style={styles.heroTeamName}>{gameData.home_team_name.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{getTeamRecord(homeTeamData, gameData.home_record)}</Text>
        </Pressable>

        {/* Center Info */}
        <View style={styles.heroCenter}>
          <Text style={styles.heroDate}>{formattedDate}</Text>
          <Text style={styles.heroTime}>{gameData.time}</Text>
          <Text style={styles.heroNetwork}>NFHS Network</Text>
        </View>

        {/* Away Team - RIGHT SIDE */}
        <Pressable
          style={styles.heroTeam}
          onPress={() => {
            if (gameData.away_team_id) {
              router.push(`/(fan)/team/${gameData.away_team_id}`);
            }
          }}
        >
          <Text style={styles.heroTeamName}>{gameData.away_team_name.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{getTeamRecord(awayTeamData, gameData.away_record)}</Text>
        </Pressable>
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
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
            Tickets
          </Text>
          {activeTab === 'tickets' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('chat')}
        >
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
              <Ionicons name="lock-closed-outline" size={64} color="#666" />
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
        // Other tabs use ScrollView
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
                  {/* Home Team - LEFT SIDE */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.voteCard,
                      { 
                        backgroundColor: homeColor,
                        borderColor: homeColor,
                      },
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
                    
                    {/* Last 5 Games */}
                    <View style={styles.lastFiveSection}>
                      <Text style={[styles.lastFiveTitle, { color: getContrastColor(homeColor), opacity: 0.7 }]}>Last 5 games:</Text>
                      {(() => {
                        const games = homeRecentGames?.games?.slice(0, 5) || [];
                        if (games.length === 0) {
                          return <Text style={[styles.lastFiveGame, { color: getContrastColor(homeColor), opacity: 0.6 }]}>No recent games</Text>;
                        }
                        return games.map((game, idx: number) => {
                          const opponent = game.opponent_name || 'TBD';
                          const vsAt = game.location; // 'vs' or '@'
                          return (
                            <Text key={idx} style={[styles.lastFiveGame, { color: getContrastColor(homeColor), opacity: 0.85 }]}>
                              {game.result} {vsAt} {opponent}
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
                  
                  {/* Away Team - RIGHT SIDE */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.voteCard,
                      { 
                        backgroundColor: awayColor,
                        borderColor: awayColor,
                      },
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
                    
                    {/* Last 5 Games */}
                    <View style={styles.lastFiveSection}>
                      <Text style={[styles.lastFiveTitle, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.7 }]}>Last 5 games:</Text>
                      {(() => {
                        const games = awayRecentGames?.games?.slice(0, 5) || [];
                        if (games.length === 0) {
                          return <Text style={[styles.lastFiveGame, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.6 }]}>No recent games</Text>;
                        }
                        return games.map((game, idx: number) => {
                          const opponent = game.opponent_name || 'TBD';
                          const vsAt = game.location; // 'vs' or '@'
                          return (
                            <Text key={idx} style={[styles.lastFiveGame, { color: getTextColorWithTeamPreference(awayColor, awayColorOriginal), opacity: 0.85 }]}>
                              {game.result} {vsAt} {opponent}
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
                {/* Vote Confirmation - Fades out after 2.5 seconds */}
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
                      {/* Sort by percentage - larger on top */}
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
                  
                  {/* Team labels above bar */}
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
                  
                  {/* Bar visualization */}
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
                  
                  {/* Subtitle */}
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
              
              {seasonLeadersExpanded && (homeSeasonLeaders || awaySeasonLeaders) && (
                <View style={styles.sectionContent}>
                  {/* Passing Yards */}
                  {(homeSeasonLeaders?.passing_leader || awaySeasonLeaders?.passing_leader) && (
                    <View style={styles.statCategory}>
                      <Text style={styles.statCategoryTitle}>Passing Yards</Text>
                      <View style={styles.statComparison}>
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar} />
                          <Text style={styles.statValue}>{homeSeasonLeaders?.passing_leader?.yards?.toLocaleString() || '0'}</Text>
                          <Text style={styles.playerName}>{homeSeasonLeaders?.passing_leader?.name || 'N/A'}</Text>
                          <Text style={styles.playerPosition}>
                            {homeSeasonLeaders?.passing_leader?.position || 'QB'}
                            {homeSeasonLeaders?.passing_leader?.jersey && ` #${homeSeasonLeaders.passing_leader.jersey}`}
                          </Text>
                          <Text style={styles.playerStats}>
                            {homeSeasonLeaders?.passing_leader?.completions || 0}/{homeSeasonLeaders?.passing_leader?.attempts || 0}, {homeSeasonLeaders?.passing_leader?.tds || 0} TD
                          </Text>
                        </View>
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar} />
                          <Text style={styles.statValue}>{awaySeasonLeaders?.passing_leader?.yards?.toLocaleString() || '0'}</Text>
                          <Text style={styles.playerName}>{awaySeasonLeaders?.passing_leader?.name || 'N/A'}</Text>
                          <Text style={styles.playerPosition}>
                            {awaySeasonLeaders?.passing_leader?.position || 'QB'}
                            {awaySeasonLeaders?.passing_leader?.jersey && ` #${awaySeasonLeaders.passing_leader.jersey}`}
                          </Text>
                          <Text style={styles.playerStats}>
                            {awaySeasonLeaders?.passing_leader?.completions || 0}/{awaySeasonLeaders?.passing_leader?.attempts || 0}, {awaySeasonLeaders?.passing_leader?.tds || 0} TD
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Rushing Yards */}
                  {(homeSeasonLeaders?.rushing_leader || awaySeasonLeaders?.rushing_leader) && (
                    <View style={styles.statCategory}>
                      <Text style={styles.statCategoryTitle}>Rushing Yards</Text>
                      <View style={styles.statComparison}>
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar} />
                          <Text style={styles.statValue}>{homeSeasonLeaders?.rushing_leader?.yards?.toLocaleString() || '0'}</Text>
                          <Text style={styles.playerName}>{homeSeasonLeaders?.rushing_leader?.name || 'N/A'}</Text>
                          <Text style={styles.playerPosition}>
                            {homeSeasonLeaders?.rushing_leader?.position || 'RB'}
                            {homeSeasonLeaders?.rushing_leader?.jersey && ` #${homeSeasonLeaders.rushing_leader.jersey}`}
                          </Text>
                          <Text style={styles.playerStats}>
                            {homeSeasonLeaders?.rushing_leader?.attempts || 0} ATT, {homeSeasonLeaders?.rushing_leader?.tds || 0} TD
                          </Text>
                        </View>
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar} />
                          <Text style={styles.statValue}>{awaySeasonLeaders?.rushing_leader?.yards?.toLocaleString() || '0'}</Text>
                          <Text style={styles.playerName}>{awaySeasonLeaders?.rushing_leader?.name || 'N/A'}</Text>
                          <Text style={styles.playerPosition}>
                            {awaySeasonLeaders?.rushing_leader?.position || 'RB'}
                            {awaySeasonLeaders?.rushing_leader?.jersey && ` #${awaySeasonLeaders.rushing_leader.jersey}`}
                          </Text>
                          <Text style={styles.playerStats}>
                            {awaySeasonLeaders?.rushing_leader?.attempts || 0} ATT, {awaySeasonLeaders?.rushing_leader?.tds || 0} TD
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Receiving Yards */}
                  {(homeSeasonLeaders?.receiving_leader || awaySeasonLeaders?.receiving_leader) && (
                    <View style={styles.statCategory}>
                      <Text style={styles.statCategoryTitle}>Receiving Yards</Text>
                      <View style={styles.statComparison}>
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar} />
                          <Text style={styles.statValue}>{homeSeasonLeaders?.receiving_leader?.yards?.toLocaleString() || '0'}</Text>
                          <Text style={styles.playerName}>{homeSeasonLeaders?.receiving_leader?.name || 'N/A'}</Text>
                          <Text style={styles.playerPosition}>
                            {homeSeasonLeaders?.receiving_leader?.position || 'WR'}
                            {homeSeasonLeaders?.receiving_leader?.jersey && ` #${homeSeasonLeaders.receiving_leader.jersey}`}
                          </Text>
                          <Text style={styles.playerStats}>
                            {homeSeasonLeaders?.receiving_leader?.receptions || 0} REC, {homeSeasonLeaders?.receiving_leader?.tds || 0} TD
                          </Text>
                        </View>
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar} />
                          <Text style={styles.statValue}>{awaySeasonLeaders?.receiving_leader?.yards?.toLocaleString() || '0'}</Text>
                          <Text style={styles.playerName}>{awaySeasonLeaders?.receiving_leader?.name || 'N/A'}</Text>
                          <Text style={styles.playerPosition}>
                            {awaySeasonLeaders?.receiving_leader?.position || 'WR'}
                            {awaySeasonLeaders?.receiving_leader?.jersey && ` #${awaySeasonLeaders.receiving_leader.jersey}`}
                          </Text>
                          <Text style={styles.playerStats}>
                            {awaySeasonLeaders?.receiving_leader?.receptions || 0} REC, {awaySeasonLeaders?.receiving_leader?.tds || 0} TD
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* Show message if no leaders data */}
              {seasonLeadersExpanded && !homeSeasonLeaders && !awaySeasonLeaders && (
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
                  {/* Team Toggle */}
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

                  {/* Games Table */}
                  <View style={styles.gamesTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 1 }]}>DATE</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>OPP</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>RESULT</Text>
                    </View>
                    
                    {/* Real recent games data */}
                    {(() => {
                      const recentGames = lastFiveTeam === 'home' ? homeRecentGames : awayRecentGames;
                      const games = recentGames?.games?.slice(0, 5) || [];
                      
                      if (games.length === 0) {
                        return (
                          <Text style={styles.comingSoon}>No recent games</Text>
                        );
                      }
                      
                      return games.map((game, idx: number) => {
                        const formattedGameDate = game.date; // Already formatted as "MM/DD"
                        const opponent = game.opponent_name || 'TBD';
                        const score = `${game.team_score}-${game.opponent_score}`;
                        const won = game.result === 'W';
                        const vsAt = game.location; // 'vs' or '@'
                        
                        return (
                          <View key={game.game_id || idx} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 1 }]}>{formattedGameDate}</Text>
                            <Text style={[styles.tableCell, { flex: 1.5 }]}>
                              {vsAt} {opponent}
                            </Text>
                            <View style={[styles.resultBadge, { 
                              backgroundColor: won ? '#00C853' : '#FF1744',
                              flex: 1,
                              alignItems: 'flex-end'
                            }]}>
                              <Text style={styles.resultText}>{game.result}</Text>
                              <Text style={styles.resultScore}>{score}</Text>
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </View>

                  <Pressable style={styles.fullScheduleButton}>
                    <Text style={styles.fullScheduleText}>Full Schedule</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.SURGE} />
                  </Pressable>
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

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <View style={styles.content}>
              <Text style={styles.comingSoon}>Tickets coming soon</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Hidden Share Card for capture */}
      <ViewShot 
        ref={viewShotRef} 
        options={{ format: 'png', quality: 1 }}
        style={{ position: 'absolute', left: -1000 }}
      >
        <GameShareCard
          type="upcoming"
          homeTeamName={gameData?.home_team_name || ''}
          awayTeamName={gameData?.away_team_name || ''}
          homeRecord={getTeamRecord(homeTeamData, gameData?.home_record)}
          awayRecord={getTeamRecord(awayTeamData, gameData?.away_record)}
          homeColor={homeColor || '#333'}
          awayColor={awayColorOriginal || '#333'}
          gameDate={gameDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
          })}
          gameTime={gameData?.time}
        />
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.SHADOW,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  // Hero Gradient Header
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 14,
  },
  heroRecord: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 2,
  },
  heroDate: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  heroTime: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    lineHeight: 26,
  },
  heroNetwork: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.SHADOW,
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
    backgroundColor: Colors.HALO,
    borderRadius: 2,
  },

  // Content
  content: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  // Vote Container - Card style matching LiveIQ
  voteContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  voteHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  voteConfirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  voteConfirmationHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  voteHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    textAlign: 'center',
    letterSpacing: 1,
  },
  voteHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  voteCards: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  voteCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    borderWidth: 2,
    gap: 6,
    minHeight: 220,
  },
  voteCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  voteCardNameContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    minHeight: 44,
  },
  voteCardTeamName: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  recordContainer: {
    width: '100%',
    minHeight: 28,
    justifyContent: 'center',
  },
  voteCardRecord: {
    fontSize: 15,
    fontWeight: '700',
  },
  lastFiveSection: {
    width: '100%',
    gap: 3,
    marginTop: 4,
  },
  lastFiveTitle: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastFiveGame: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  votingIndicator: {
    marginTop: 4,
  },
  voteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  voteFooterText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  voteConfirmationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  voteConfirmationFooterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.SURGE,
  },

  // Vote Indicator Box - Persistent after voting
  voteIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180, 216, 54, 0.3)',
    marginHorizontal: 8,
    marginBottom: 12,
  },
  voteIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.SURGE,
  },

  // Vote Confirmation Box
  voteConfirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180, 216, 54, 0.3)',
    marginHorizontal: 8,
    marginBottom: 12,
  },
  voteConfirmationBoxText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Predictions Section
  predictionsSection: {
    gap: 12,
    marginBottom: 12,
  },
  predictionCardDark: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  predictionHeaderSection: {
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  gamePredictionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
  },
  poweredBy: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  circleAndPercentages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageColumn: {
    gap: 12,
    justifyContent: 'center',
  },
  percentageGroup: {
    alignItems: 'flex-start',
  },
  percentageRow: {
    alignItems: 'flex-start',
  },
  largePercentage: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 44,
  },
  teamNameWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginTop: 2,
  },
  fanPredictionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fanPredictionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  fanLabelSection: {
    flex: 1,
    gap: 2,
  },
  fanLabelTeam: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fanLabelPercentage: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 28,
  },
  fanPredictionBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0f0f0f',
    marginHorizontal: 14,
    marginTop: 10,
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
    right: 6,
  },
  fanPredictionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555',
    textAlign: 'center',
    padding: 14,
  },

  // Section - Card style matching LiveIQ
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.HALO,
    letterSpacing: 1,
  },
  sectionContent: {
    padding: 14,
    gap: 20,
  },

  // Season Leaders - Updated to match LiveIQ stat cards
  statCategory: {
    gap: 12,
  },
  statCategoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#151515',
    borderRadius: 10,
    padding: 12,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  playerPosition: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
  },
  playerStats: {
    fontSize: 10,
    fontWeight: '500',
    color: '#555',
    textAlign: 'center',
  },

  // Last Five Games - Updated toggle and table
  teamToggle: {
    flexDirection: 'row',
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.SURGE,
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  gamesTable: {
    gap: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#151515',
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  tableCell: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ccc',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  resultScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  fullScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  fullScheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.SURGE,
  },

  // Coming Soon
  comingSoon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    paddingVertical: 40,
  },

  // Chat Styles
  chatContainer: {
    flex: 1,
    minHeight: 500,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  chatLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  chatLoadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
});
