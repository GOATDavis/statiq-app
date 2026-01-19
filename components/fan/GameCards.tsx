import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Colors, BorderRadius } from '@/src/constants/design';
import type { LiveGame } from '@/src/lib/types/game';
import { FootballIcon } from '@/components/icons/FootballIcon';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import { getVote, storeVote } from '@/src/lib/votes';
import { API_BASE } from '@/src/lib/api';

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

// Vote submission
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

// ============================================================================
// COLOR HELPER FUNCTIONS
// ============================================================================

// Helper function to determine if a color is light or dark
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return Basalt for light backgrounds, HALO for dark backgrounds
  return luminance > 0.5 ? Colors.BASALT : Colors.HALO;
}

// Helper function to detect if color is very light (luminance > 0.7)
function isLightColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if very light
  return luminance > 0.7;
}

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

// ============================================================================
// GAME CARD - STATIQ STYLE WITH FAN PREDICTIONS
// ============================================================================

interface GameCardProps {
  game: LiveGame;
  onPress?: (voteFor?: 'home' | 'away') => void;
  isFollowed?: boolean;
  refreshTrigger?: number; // Add refresh trigger to force re-check of votes
}

export function UpcomingGameCard({ game, onPress, isFollowed, refreshTrigger }: GameCardProps) {
  const [userVote, setUserVote] = React.useState<'home' | 'away' | null>(null);
  const [deviceId, setDeviceId] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showVoteConfirmation, setShowVoteConfirmation] = React.useState(false);
  const [fadeAnim] = React.useState(new Animated.Value(1)); // For fade out animation
  const [localPredictions, setLocalPredictions] = React.useState<{
    total_votes: number;
    home_votes: number;
    away_votes: number;
    home_percentage: number;
    away_percentage: number;
  } | null>(null);

  // Get device ID
  React.useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  // Check if user has voted on this game - re-check whenever refreshTrigger changes
  React.useEffect(() => {
    console.log(`[GameCard ${game.id}] Checking vote (trigger: ${refreshTrigger})`);
    getVote(game.id).then(async vote => {
      console.log(`[GameCard ${game.id}] Vote found:`, vote);
      if (vote) {
        console.log(`[GameCard ${game.id}] ✅ User voted for ${vote} - showing predictions`);
        setUserVote(vote);
        
        // Fetch fresh predictions from backend
        try {
          const resp = await fetch(`${API_BASE}/games/${game.id}/votes`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          if (resp.ok) {
            const voteData = await resp.json();
            console.log(`[GameCard ${game.id}] Fetched predictions on load:`, voteData);
            setLocalPredictions({
              total_votes: (voteData.home || 0) + (voteData.away || 0),
              home_votes: voteData.home || 0,
              away_votes: voteData.away || 0,
              home_percentage: voteData.home_percentage || 50,
              away_percentage: voteData.away_percentage || 50,
            });
          }
        } catch (e) {
          console.log(`[GameCard ${game.id}] Failed to fetch predictions on load:`, e);
        }
      } else {
        console.log(`[GameCard ${game.id}] ❌ No vote - hiding predictions`);
        setUserVote(null);
      }
    });
  }, [game.id, refreshTrigger]); // Add refreshTrigger as dependency

  // Handle vote submission directly from card
  const handleVote = async (team: 'home' | 'away') => {
    if (!deviceId || isSubmitting || userVote) {
      console.log('[GameCard Vote] Blocked - already voted or missing device ID');
      return;
    }

    setIsSubmitting(true);
    console.log(`[GameCard Vote] Submitting vote for ${team} on game ${game.id}`);

    try {
      // Submit to backend
      await submitVote(game.id, deviceId, team);
      
      // Store locally
      await storeVote(game.id, team);
      
      // Update UI
      setUserVote(team);
      
      // Show confirmation for 3 seconds
      setShowVoteConfirmation(true);
      fadeAnim.setValue(1); // Reset to full opacity
      
      // Fetch updated predictions from backend after a short delay
      setTimeout(async () => {
        try {
          const resp = await fetch(`${API_BASE}/games/${game.id}/votes`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          if (resp.ok) {
            const voteData = await resp.json();
            console.log(`[GameCard ${game.id}] Fetched updated predictions:`, voteData);
            setLocalPredictions({
              total_votes: (voteData.home || 0) + (voteData.away || 0),
              home_votes: voteData.home || 0,
              away_votes: voteData.away || 0,
              home_percentage: voteData.home_percentage || 50,
              away_percentage: voteData.away_percentage || 50,
            });
          }
        } catch (e) {
          console.log(`[GameCard ${game.id}] Failed to fetch updated predictions:`, e);
        }
      }, 500); // Wait 500ms for backend to process
      
      setTimeout(() => {
        // Start fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500, // Fade out over 500ms
          useNativeDriver: true,
        }).start(() => {
          // Hide after animation completes
          setShowVoteConfirmation(false);
          fadeAnim.setValue(1); // Reset for next time
        });
      }, 3000); // Changed from 2500 to 3000
      
      console.log(`[GameCard Vote] Successfully voted for ${team}`);
    } catch (error) {
      console.error('[GameCard Vote] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show prediction data if user has voted
  // Use localPredictions if available (fetched after voting), otherwise fall back to game.predictions
  const predictions = localPredictions || (game as any).predictions;
  const totalVotes = userVote ? (predictions?.total_votes ?? 1) : 0;
  
  // Debug: Log prediction data
  if (userVote) {
    console.log(`[GameCard ${game.id}] Prediction data:`, {
      totalVotes,
      away_percentage: predictions?.away_percentage,
      home_percentage: predictions?.home_percentage,
      userVote,
      usingLocalPredictions: !!localPredictions,
    });
  }
  
  // If user voted but backend hasn't returned percentages yet, show 100% for their choice
  let awayWinPercentage = 50;
  let homeWinPercentage = 50;
  
  if (userVote && totalVotes > 0) {
    // Check if backend returned valid percentage data
    const hasBackendPercentages = predictions?.away_percentage !== undefined && predictions?.home_percentage !== undefined;
    
    // If we only have 1 vote and backend shows 50/50, override it
    const backendDataInvalid = totalVotes === 1 && hasBackendPercentages && 
      predictions.away_percentage === 50 && predictions.home_percentage === 50;
    
    if (hasBackendPercentages && !backendDataInvalid && totalVotes > 1) {
      // Use backend data for multiple votes
      awayWinPercentage = predictions.away_percentage;
      homeWinPercentage = predictions.home_percentage;
      console.log(`[GameCard ${game.id}] Using backend percentages:`, { awayWinPercentage, homeWinPercentage });
    } else {
      // Fallback: show 100% for the team user voted for (single vote or bad backend data)
      if (userVote === 'home') {
        homeWinPercentage = 100;
        awayWinPercentage = 0;
      } else {
        homeWinPercentage = 0;
        awayWinPercentage = 100;
      }
      console.log(`[GameCard ${game.id}] Using calculated percentages:`, { awayWinPercentage, homeWinPercentage, reason: backendDataInvalid ? 'invalid backend data' : 'single vote' });
    }
  }

  return (
    <GameCardLayout
      game={game}
      onPress={onPress}
      isFollowed={isFollowed}
      awayWinPercentage={awayWinPercentage}
      homeWinPercentage={homeWinPercentage}
      totalVotes={totalVotes}
      showScores={false}
      userVote={userVote}
      onVote={handleVote}
      isSubmitting={isSubmitting}
      showVoteConfirmation={showVoteConfirmation}
      fadeAnim={fadeAnim}
    />
  );
}

export function LiveGameCard({ game, onPress, isFollowed }: GameCardProps) {
  // Force EXACTLY 50/50 when no real prediction data exists
  const totalVotes = (game as any).predictions?.total_votes ?? 0;
  const awayWinPercentage = totalVotes > 0 ? (game as any).predictions?.away_percentage : 50;
  const homeWinPercentage = totalVotes > 0 ? (game as any).predictions?.home_percentage : 50;

  return (
    <GameCardLayout
      game={game}
      onPress={onPress}
      isFollowed={isFollowed}
      awayWinPercentage={awayWinPercentage}
      homeWinPercentage={homeWinPercentage}
      totalVotes={totalVotes}
      showScores={true}
      isLive={true}
    />
  );
}

export function FinishedGameCard({ game, onPress, isFollowed }: GameCardProps) {
  // Force EXACTLY 50/50 when no real prediction data exists
  const totalVotes = (game as any).predictions?.total_votes ?? 0;
  const awayWinPercentage = totalVotes > 0 ? (game as any).predictions?.away_percentage : 50;
  const homeWinPercentage = totalVotes > 0 ? (game as any).predictions?.home_percentage : 50;

  return (
    <GameCardLayout
      game={game}
      onPress={onPress}
      isFollowed={isFollowed}
      awayWinPercentage={awayWinPercentage}
      homeWinPercentage={homeWinPercentage}
      totalVotes={totalVotes}
      showScores={true}
      isFinished={true}
    />
  );
}

// ============================================================================
// SHARED CARD LAYOUT
// ============================================================================

interface GameCardLayoutProps {
  game: LiveGame;
  onPress?: (voteFor?: 'home' | 'away') => void;
  isFollowed?: boolean;
  awayWinPercentage: number;
  homeWinPercentage: number;
  totalVotes: number;
  showScores?: boolean;
  isLive?: boolean;
  isFinished?: boolean;
  userVote?: 'home' | 'away' | null;
  onVote?: (team: 'home' | 'away') => void;
  isSubmitting?: boolean;
  showVoteConfirmation?: boolean;
  fadeAnim?: Animated.Value;
}

function GameCardLayout({
  game,
  onPress,
  isFollowed,
  awayWinPercentage,
  homeWinPercentage,
  totalVotes,
  showScores = false,
  isLive = false,
  isFinished = false,
  userVote = null,
  onVote,
  isSubmitting = false,
  showVoteConfirmation = false,
  fadeAnim,
}: GameCardLayoutProps) {
  const router = useRouter();
  const [notificationEnabled, setNotificationEnabled] = React.useState(false); // Start disabled
  const [showModal, setShowModal] = React.useState(false);
  
  const awayScore = game.away_score ?? 0;
  const homeScore = game.home_score ?? 0;
  const awayWinning = showScores && awayScore > homeScore;
  const homeWinning = showScores && homeScore > awayScore;

  // Format date/time - Figma style
  const formatDateTime = () => {
    // For finished games, the date might already be formatted from the parent component
    // Check if date is already in "Day, M/D" format
    const dateStr = (game as any).date || '';
    if (!dateStr) return { date: '', time: '' };
    
    // If date is already formatted (e.g., "Fri, 8/29"), use it directly
    if (dateStr.includes(',') && dateStr.split(',').length === 2) {
      const time = (game as any).time || '';
      return { date: dateStr, time };
    }
    
    // Otherwise, parse and format the raw date
    const fullDateStr = (game as any).kickoff_at || dateStr || (game as any).started_at || '';
    if (!fullDateStr) return { date: '', time: '' };
    
    // Parse date in local timezone to avoid UTC issues
    let date: Date;
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For YYYY-MM-DD format, parse in local timezone
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // For ISO timestamps, use standard parsing
      date = new Date(fullDateStr);
    }
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
    
    // For upcoming games, use the time field directly from the API to avoid timezone conversion
    const time = (game as any).time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    return { date: `${dayOfWeek}, ${monthDay}`, time };
  };

  const { date, time } = formatDateTime();

  // Parse playoff seeds from playoff_seeds field
  // Format: "W1El Dorado * F2Amarillo"
  const parseSeeds = (playoffSeeds: string | undefined) => {
    if (!playoffSeeds || !playoffSeeds.includes(' * ')) return null;

    const parts = playoffSeeds.split(' * ');
    const seed1Match = parts[0].match(/^([WRFT]\d+)/);
    const seed2Match = parts[1]?.match(/^([WRFT]\d+)/);

    return {
      team1Seed: seed1Match ? seed1Match[1] : '',
      team2Seed: seed2Match ? seed2Match[1] : ''
    };
  };

  // Extract seed from team name if embedded (e.g., "W2 Abilene" -> seed: "W2", name: "Abilene")
  const extractSeedFromName = (teamName: string): { seed: string; cleanName: string } => {
    const match = teamName.match(/^([WRFT]\d+)\s+(.+)$/);
    if (match) {
      return { seed: match[1], cleanName: match[2] };
    }
    return { seed: '', cleanName: teamName };
  };

  // Check playoff_seeds field (new) or notes field (fallback)
  const seeds = parseSeeds((game as any).playoff_seeds || (game as any).notes);

  // Extract seeds from team names if embedded
  const homeNameData = extractSeedFromName(game.home_team_name);
  const awayNameData = extractSeedFromName(game.away_team_name);

  // Get team data - Priority: extracted from name > playoff_seeds field > fallback fields
  const homePlayoffSeed = homeNameData.seed || seeds?.team1Seed || (game as any).home_playoff_seed || '';
  const awayPlayoffSeed = awayNameData.seed || seeds?.team2Seed || (game as any).away_playoff_seed || '';
  
  // Use clean names (without embedded seeds)
  const displayHomeName = homeNameData.cleanName;
  const displayAwayName = awayNameData.cleanName;

  // Debug: Log playoff seed parsing
  if (__DEV__) {
    console.log('=== PLAYOFF SEED DEBUG ===');
    console.log('Game:', game.home_team_name, 'vs', game.away_team_name);
    console.log('Raw playoff_seeds:', (game as any).playoff_seeds);
    console.log('Parsed seeds:', seeds);
    console.log('Home seed:', homePlayoffSeed);
    console.log('Away seed:', awayPlayoffSeed);
    console.log('========================');
  }

  // Get records - default to '0-0' if not provided
  const awayRecord = (game as any).away_record || '0-0';
  const homeRecord = (game as any).home_record || '0-0';

  // Get team logos
  const awayLogo = (game as any).away_team_logo || null;
  const homeLogo = (game as any).home_team_logo || null;

  // Get mascots
  const awayMascot = game.away_team_mascot || '';
  const homeMascot = game.home_team_mascot || '';

  // Get team colors for prediction bars
  const awayPrimaryColor = game.away_primary_color || '#FDDB28';
  const homePrimaryColor = game.home_primary_color || '#900727';

  // HOME team (left): Full color background + automatic contrast text
  const homeBarColor = homePrimaryColor;
  const homeTextColor = getContrastColor(homePrimaryColor);

  // AWAY team (right): Lightened background (85% white mix) + team color text (or Basalt if very light)
  const awayBarColor = lightenColor(awayPrimaryColor, 0.85);
  const awayTextColor = isLightColor(awayPrimaryColor) ? Colors.BASALT : awayPrimaryColor;

  // Debug logging
  if (__DEV__) {
    console.log('Parsed game data:', {
      id: game.id,
      notes: (game as any).notes,
      seeds,
      awayLogo,
      homeLogo,
      awayPlayoffSeed,
      homePlayoffSeed,
      awayRecord,
      homeRecord,
      awayMascot,
      homeMascot,
      awayPrimaryColor,
      homePrimaryColor,
      homeBarColor,
      homeTextColor,
      awayBarColor,
      awayTextColor,
    });
  }

  return (
    <Pressable
      style={styles.cardContainer}
      onPress={() => !isFinished && onPress && onPress()} // Only allow voting on non-finished games
      android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
      disabled={isFinished}
    >
      <View style={styles.cardInner}>
        {/* Left: Teams Column */}
        <View style={styles.teamsColumn}>
          {/* Row 1: Home Team */}
          <View style={styles.teamRow}>
            <View style={styles.logoSeedContainer}>
              {/* Team Logo */}
              {homeLogo ? (
                <Image source={{ uri: homeLogo }} style={styles.teamLogo} />
              ) : (
                <View style={styles.teamLogoFallback}>
                  <FootballIcon size={16} color={Colors.SURGE} />
                </View>
              )}

              {/* Playoff Seed */}
              {homePlayoffSeed && (
                <Text style={styles.playoffSeed}>{homePlayoffSeed}</Text>
              )}
            </View>

            {/* Team Name */}
            <Text style={styles.teamName} numberOfLines={1}>
              {displayHomeName}
            </Text>
          </View>

          {/* Row 2: Away Team */}
          <View style={styles.teamRow}>
            <View style={styles.logoSeedContainer}>
              {/* Team Logo */}
              {awayLogo ? (
                <Image source={{ uri: awayLogo }} style={styles.teamLogo} />
              ) : (
                <View style={styles.teamLogoFallback}>
                  <FootballIcon size={16} color={Colors.SURGE} />
                </View>
              )}

              {/* Playoff Seed */}
              {awayPlayoffSeed && (
                <Text style={styles.playoffSeed}>{awayPlayoffSeed}</Text>
              )}
            </View>

            {/* Team Name */}
            <Text style={styles.teamName} numberOfLines={1}>
              {displayAwayName}
            </Text>
          </View>
        </View>

        {/* Right: Info Section (3-column layout) */}
        <View style={styles.infoSection}>
          {/* Records Column - Stacked vertically */}
          <View style={styles.recordsColumn}>
            {showScores ? (
              <View style={styles.scoreRow}>
                <Text style={[styles.score, homeWinning && styles.scoreWinning]}>
                  {homeScore}
                </Text>
                {isFinished && homeWinning ? (
                  <View style={styles.winIndicator} />
                ) : isFinished ? (
                  <View style={styles.winIndicatorPlaceholder} />
                ) : null}
              </View>
            ) : (
              <Text style={styles.record}>{homeRecord}</Text>
            )}
            {showScores ? (
              <View style={styles.scoreRow}>
                <Text style={[styles.score, awayWinning && styles.scoreWinning]}>
                  {awayScore}
                </Text>
                {isFinished && awayWinning ? (
                  <View style={styles.winIndicator} />
                ) : isFinished ? (
                  <View style={styles.winIndicatorPlaceholder} />
                ) : null}
              </View>
            ) : (
              <Text style={styles.record}>{awayRecord}</Text>
            )}
          </View>

          {/* Vertical Divider */}
          <View style={styles.verticalDivider} />

          {/* DateTime Column - Stacked on right */}
          {!isFinished ? (
            <View style={styles.dateTimeColumn}>
              {date && <Text style={styles.dateText}>{date}</Text>}
              {time && <Text style={styles.timeText}>{time}</Text>}
              {game.broadcaster && (
                <Text style={styles.networkText}>{game.broadcaster}</Text>
              )}
            </View>
          ) : (
            <View style={styles.dateTimeColumn}>
              <Text style={styles.finalText}>Final</Text>
              {date && <Text style={[styles.dateText, { marginBottom: 4 }]}>{date}</Text>}
              <Pressable
                style={styles.fullStatsButtonCompact}
                onPress={() => router.push(`/(coach-phone)/game/stats/${game.id}`)}
                android_ripple={{ color: 'rgba(180, 216, 54, 0.2)' }}
              >
                <Text style={styles.fullStatsTextCompact}>Full Stats</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.SURGE} />
              </Pressable>
            </View>
          )}

          {/* Notification Bell - Hide for finished games */}
          {!isFinished && (
            <Pressable
              style={styles.bellIcon}
              onPress={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              hitSlop={8}
              android_ripple={{ color: 'rgba(180, 216, 54, 0.3)', borderless: true, radius: 20 }}
            >
              <Image
                source={
                  notificationEnabled
                    ? require('@/assets/images/notification-bell.png')
                    : require('@/assets/images/notification-bell-outline.png')
                }
                style={styles.bellImage}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Prediction/Voting Section - Only for non-finished games */}
      {!isFinished && (
      <View style={styles.predictionContainer}>
        {userVote ? (
          // User has voted - show prediction bar with their vote
          <>
            <View style={styles.predictionBarWrapper}>
              {/* Home Team Bar - Only render if has votes */}
              {homeWinPercentage > 0 && (
                <View
                  style={[
                    styles.predictionBar,
                    {
                      backgroundColor: homeBarColor,
                      width: `${homeWinPercentage}%`,
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                      borderTopRightRadius: awayWinPercentage === 0 ? 6 : 0,
                      borderBottomRightRadius: awayWinPercentage === 0 ? 6 : 0,
                    }
                  ]}
                >
                  {/* Home team is always on the LEFT side of the bar */}
                  {homeWinPercentage >= awayWinPercentage ? (
                    // Majority - show full content
                    <View style={styles.predictionBarContent}>
                      {/* Team name on left */}
                      <Text style={[styles.predictionTeamText, { color: homeTextColor }]} numberOfLines={1}>
                        {displayHomeName.toUpperCase()}
                      </Text>
                      {/* Checkmark + Percentage on right */}
                      <View style={styles.predictionRightSide}>
                        {userVote === 'home' && (
                          <Ionicons name="checkmark-circle" size={14} color={homeTextColor} style={styles.voteCheckmark} />
                        )}
                        <Text style={[styles.predictionPercent, { color: homeTextColor }]}>
                          {Math.round(homeWinPercentage)}%
                        </Text>
                      </View>
                    </View>
                  ) : (
                    // Minority - only show checkmark if user voted for this team
                    userVote === 'home' && (
                      <View style={[styles.predictionBarContent, { justifyContent: 'flex-end' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={homeTextColor} />
                      </View>
                    )
                  )}
                </View>
              )}

              {/* Away Team Bar - Only render if has votes */}
              {awayWinPercentage > 0 && (
                <View
                  style={[
                    styles.predictionBar,
                    styles.predictionBarAway,
                    {
                      backgroundColor: awayBarColor,
                      width: `${awayWinPercentage}%`,
                      borderTopRightRadius: 6,
                      borderBottomRightRadius: 6,
                      borderTopLeftRadius: homeWinPercentage === 0 ? 6 : 0,
                      borderBottomLeftRadius: homeWinPercentage === 0 ? 6 : 0,
                    }
                  ]}
                >
                  {/* Away team is always on the RIGHT side of the bar */}
                  {awayWinPercentage > homeWinPercentage ? (
                    // Majority - show full content
                    <>
                      {/* Percentage + Checkmark on left */}
                      <View style={styles.predictionRightSide}>
                        <Text style={[styles.predictionPercent, { color: awayTextColor }]}>
                          {Math.round(awayWinPercentage)}%
                        </Text>
                        {userVote === 'away' && (
                          <Ionicons name="checkmark-circle" size={14} color={awayTextColor} style={styles.voteCheckmark} />
                        )}
                      </View>
                      {/* Team name on right */}
                      <Text style={[styles.predictionTeamText, { color: awayTextColor }]} numberOfLines={1}>
                        {displayAwayName.toUpperCase()}
                      </Text>
                    </>
                  ) : (
                    // Minority - only show checkmark if user voted for this team
                    userVote === 'away' && (
                      <View style={[styles.predictionBarContent, { justifyContent: 'flex-start' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={awayTextColor} />
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
            
            {/* Show confirmation or vote count below bar */}
            {showVoteConfirmation && fadeAnim ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.whoWillWinTextLarge}>YOUR PREDICTION IS LOCKED IN</Text>
              </Animated.View>
            ) : (
              <Text style={styles.whoWillWinText}>
                According to StatIQ fans ({Math.max(1, totalVotes).toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'})
              </Text>
            )}
          </>
        ) : (
          // User hasn't voted - show voting buttons
          <>
            <View style={styles.votingButtonsRow}>
              {/* Home Team Button */}
              <Pressable
                style={[
                  styles.voteButton,
                  { backgroundColor: homeBarColor, borderColor: homeBarColor },
                  isSubmitting && styles.voteButtonDisabled
                ]}
                onPress={() => {
                  if (onVote && !isSubmitting) {
                    onVote('home');
                  } else if (onPress) {
                    onPress('home');
                  }
                }}
                disabled={isSubmitting}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Text style={[styles.voteButtonText, { color: homeTextColor }]} numberOfLines={1}>
                  {isSubmitting ? 'VOTING...' : displayHomeName.toUpperCase()}
                </Text>
              </Pressable>

              {/* Away Team Button */}
              <Pressable
                style={[
                  styles.voteButton,
                  { backgroundColor: awayBarColor, borderColor: awayPrimaryColor },
                  isSubmitting && styles.voteButtonDisabled
                ]}
                onPress={() => {
                  if (onVote && !isSubmitting) {
                    onVote('away');
                  } else if (onPress) {
                    onPress('away');
                  }
                }}
                disabled={isSubmitting}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Text style={[styles.voteButtonText, { color: awayTextColor }]} numberOfLines={1}>
                  {displayAwayName.toUpperCase()}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.whoWillWinTextLarge}>WHO WILL WIN?</Text>
          </>
        )}
      </View>
      )}
      
      {/* Notification Settings Modal */}
      {showModal && (
        <NotificationSettingsModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          gameName={`${displayAwayName} @ ${displayHomeName}`}
          onSettingsChange={(anyEnabled) => setNotificationEnabled(anyEnabled)}
        />
      )}
    </Pressable>
  );
}

// ============================================================================
// DATE HEADER COMPONENT
// ============================================================================

export function DateHeader({ date }: { date: string }) {
  return (
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText}>{date.toUpperCase()}</Text>
      <View style={styles.dateHeaderLine} />
    </View>
  );
}

// ============================================================================
// DATE SECTION WRAPPER - Gray container for date groups
// ============================================================================

export function DateSection({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.dateSection}>
      {children}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Date Section - Gray container for each date group
  dateSection: {
    backgroundColor: '#2A2A2A',
    marginBottom: 8,
    borderRadius: 10,
    marginHorizontal: 0,
    overflow: 'hidden',
  },

  // Date Header
  dateHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16, // Match card marginHorizontal
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.HALO, // Changed from #999 to HALO
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  dateHeaderLine: {
    width: '100%', // Full width of container (which has margins)
    height: 1,
    backgroundColor: '#777', // Match game card dividers
  },

  // Card Container - Ultra compact StatIQ style
  cardContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 0,
    marginBottom: 0,
    marginHorizontal: 0, // Edge-to-edge
    width: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#777',
  },

  // Card Inner - Wrapper for team rows and info section
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 0, // No padding - let content span full divider width
  },

  // Teams Column - Left side with both teams stacked
  teamsColumn: {
    flex: 2, // Give more space to team names
    gap: 2, // Reduced from 4
  },

  // Team Row - Each team occupies one row
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Logo and seed container - Fixed width for alignment
  logoSeedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 52, // Reduced from 60 to push team names left
  },

  // Team Info - Left side (icon + seed + name)
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  // Info Section - Right side with 3-column layout
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3, // Reduced from 4 for maximum tightness
    flexShrink: 0, // Prevent shrinking
  },

  // Records Column - Stacked vertically with divider
  recordsColumn: {
    alignItems: 'center',
    gap: 4, // Reduced from 6
    minWidth: 35, // Reduced from 40
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  winIndicator: {
    width: 3,
    height: 18,
    backgroundColor: Colors.SURGE,
    borderRadius: 1.5,
  },

  winIndicatorPlaceholder: {
    width: 3,
    height: 18,
    backgroundColor: 'transparent',
  },

  // Vertical divider between records and date/time
  verticalDivider: {
    width: 1,
    height: 40, // Increased from 32
    backgroundColor: '#555',
  },

  // DateTime Column - Stacked info on right
  dateTimeColumn: {
    alignItems: 'flex-start', // Left-aligned
    gap: 1, // Reduced from 2
    width: 95, // Fixed width instead of flex
    paddingLeft: 6, // Add space between divider and date/time info
  },

  // Bell Icon
  bellIcon: {
    marginLeft: 0, // No margin for maximum tightness
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bell Image
  bellImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  // Right Info - Right side (record + date/time) - DEPRECATED, keeping for compatibility
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Record/Score Text
  record: {
    fontSize: 14, // Increased from 12
    fontWeight: '700', // Increased from 600
    color: '#CCC', // Lighter gray for better visibility
  },

  score: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },

  // Date/Time/Network Text
  dateText: {
    fontSize: 11, // Increased from 10
    fontWeight: '500', // Reduced from 600
    color: '#AAA', // Lighter for better readability
  },

  timeText: {
    fontSize: 11, // Increased from 10
    fontWeight: '700', // Bolder
    color: '#DDD', // Much lighter for prominence
  },

  networkText: {
    fontSize: 11, // Increased from 9 to match date and time
    fontWeight: '500',
    color: '#888',
  },

  // Team Logo - Ultra compact 24x24
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teamLogoFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Playoff Seed - Ultra compact
  playoffSeed: {
    color: Colors.HALO, // Changed from white to HALO
    fontSize: 11,
    fontWeight: '700',
  },

  // Team Name - Ultra compact
  teamName: {
    color: Colors.HALO, // Changed from white to HALO
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // Score winning style (used by scoreCard)
  scoreWinning: {
    fontWeight: '800',
  },

  // Prediction Container - Voting UI
  predictionContainer: {
    marginTop: 6, // Reduced from 8
    gap: 6, // Reduced from 8
    paddingHorizontal: 0,
  },

  whoWillWinText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#AAA',
    textAlign: 'center',
    letterSpacing: 0,
  },

  whoWillWinTextLarge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.HALO,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // New clean prediction styles
  fansPredictLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
    letterSpacing: 1,
  },

  predictionSummary: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  predictionLeader: {
    flex: 1,
    gap: 4,
  },

  predictionLeaderTeam: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },

  predictionLeaderPercent: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.SURGE,
  },

  yourVoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  yourVoteText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.SURGE,
  },

  voteCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },

  votingButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  voteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  voteButtonDisabled: {
    opacity: 0.5,
  },

  voteButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  predictionBarWrapper: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
  },

  predictionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },

  predictionBarAway: {
    justifyContent: 'space-between',
  },

  predictionBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  predictionRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  predictionTeamText: {
    fontSize: 10,
    fontWeight: '700',
  },

  predictionPercent: {
    fontSize: 12,
    fontWeight: '800',
  },

  voteCheckmark: {
    marginRight: 2,
  },

  voteLockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.SURGE,
    textAlign: 'center',
    marginTop: 6,
  },

  voteText: {
    fontSize: 12, // Increased for better visibility
    fontWeight: '500',
    color: Colors.HALO, // Changed from #666 to HALO
    textAlign: 'center',
  },

  // Finished Game Actions - Compact in dateTimeColumn
  finalText: {
    fontSize: 12,
    fontWeight: '600', // Reduced from 700
    color: Colors.TEXT_SECONDARY,
    marginBottom: 0, // Reduced from 2 - let gap handle spacing
  },

  fullStatsButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.SURGE,
  },

  fullStatsTextCompact: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.SURGE,
  },
});
