import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';

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

// Helper function to detect yellow/gold colors that need special text treatment
function isYellowGold(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Check if very light (luminance > 0.7)
  if (luminance > 0.7) return true;

  // Check if both R and G channels start with F, E, or D (like #FDDB28, #FFF000, #EED000)
  const rHex = hex.substr(0, 2).toUpperCase();
  const gHex = hex.substr(2, 2).toUpperCase();
  const yellowPrefixes = ['F', 'E', 'D'];

  if (yellowPrefixes.includes(rHex[0]) && yellowPrefixes.includes(gHex[0])) {
    return true;
  }

  return false;
}

// Helper function to create a light version of a color (20% opacity effect)
function getLightBackground(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Blend with white (20% color, 80% white) for light background
  const lightR = Math.round(r * 0.2 + 255 * 0.8);
  const lightG = Math.round(g * 0.2 + 255 * 0.8);
  const lightB = Math.round(b * 0.2 + 255 * 0.8);

  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16).padStart(2, '0');
    return hex.toUpperCase();
  };

  return `#${toHex(lightR)}${toHex(lightG)}${toHex(lightB)}`;
}

// ============================================================================
// GAME DETAIL HEADER - Hero with team logos, records, date/time
// ============================================================================

interface GameDetailHeaderProps {
  awayTeam: {
    id?: string;
    name: string;
    mascot: string;
    record: string;
    rank?: number;
    logo?: string;
  };
  homeTeam: {
    id?: string;
    name: string;
    mascot: string;
    record: string;
    rank?: number;
    logo?: string;
  };
  date: string;
  time: string;
  network?: string;
  classification: string;
}

export function GameDetailHeader({
  awayTeam,
  homeTeam,
  date,
  time,
  network,
  classification,
}: GameDetailHeaderProps) {
  const router = useRouter();
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // If already formatted (contains comma), return as-is
    if (dateStr.includes(',')) return dateStr;

    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // Return original if invalid
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      return `${month} ${day}`;
    } catch {
      return dateStr; // Return original on error
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    // Remove leading zero from time (e.g., "06:30 PM" -> "6:30 PM")
    return timeStr.replace(/^0/, '');
  };

  // Get team abbreviations (first 3-4 letters of name)
  const homeAbbr = homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOME';
  const awayAbbr = awayTeam?.name?.substring(0, 4).toUpperCase() || 'AWAY';

  return (
    <View>
      {/* StatIQ Header - Single Row with Safe Area */}
      <View style={styles.espnHeaderContainer}>
        <View style={styles.espnHeader}>
          {/* Left: Home Team */}
          <Pressable 
            style={styles.espnTeamSection}
            onPress={() => {
              if (homeTeam?.id) {
                router.push(`/fan-team/${homeTeam.id}`);
              }
            }}
          >
            <View style={styles.espnTeamLogo}>
              <Ionicons name="football" size={40} color={Colors.SURGE} />
            </View>
            <View style={styles.espnTeamInfo}>
              <Text style={styles.espnTeamAbbr}>{homeAbbr}</Text>
              <Text style={styles.espnTeamRecord}>{homeTeam?.record || '0-0'}</Text>
            </View>
          </Pressable>

          {/* Center: Date/Time/Network */}
          <View style={styles.espnCenterInfo}>
            <Text style={styles.espnDate}>{formatDate(date)}</Text>
            <Text style={styles.espnTime}>{formatTime(time)}</Text>
            {network && (
              <View style={styles.espnNetworkBadge}>
                <Text style={styles.espnNetworkText}>{network}</Text>
              </View>
            )}
          </View>

          {/* Right: Away Team */}
          <Pressable 
            style={styles.espnTeamSection}
            onPress={() => {
              if (awayTeam?.id) {
                router.push(`/fan-team/${awayTeam.id}`);
              }
            }}
          >
            <View style={styles.espnTeamInfo}>
              <Text style={styles.espnTeamAbbr}>{awayAbbr}</Text>
              <Text style={styles.espnTeamRecord}>{awayTeam?.record || '0-0'}</Text>
            </View>
            <View style={styles.espnTeamLogo}>
              <Ionicons name="football" size={40} color={Colors.SURGE} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = ['PregameIQ', 'Preview', 'Tickets'];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          style={styles.tabButton}
          onPress={() => onTabChange(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
          </Text>
          {activeTab === tab && <View style={styles.tabIndicator} />}
        </Pressable>
      ))}
    </View>
  );
}

// ============================================================================
// GAME PREVIEW CARD
// ============================================================================

interface GamePreviewProps {
  title: string;
  body: string;
  timestamp: string;
  author: string;
}

export function GamePreview({ title, body, timestamp, author }: GamePreviewProps) {
  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>{title}</Text>
      <Text style={styles.previewBody} numberOfLines={3}>
        {body}
      </Text>
      <Text style={styles.previewTimestamp}>
        {timestamp} - {author}
      </Text>
    </View>
  );
}

// ============================================================================
// STATIQ ANALYTICS ENGINE - Power Rankings & Predictions
// ============================================================================

interface StatIQAnalyticsProps {
  awayTeam: {
    name: string;
    winProbability: number;
    powerRanking?: number;
    offensiveRating?: number;
    defensiveRating?: number;
    primaryColor?: string;
  };
  homeTeam: {
    name: string;
    winProbability: number;
    powerRanking?: number;
    offensiveRating?: number;
    defensiveRating?: number;
    primaryColor?: string;
  };
  predictedScore?: {
    away: number;
    home: number;
  };
  keyFactors?: string[];
  confidence?: 'High' | 'Medium' | 'Low';
}

export function StatIQAnalytics({
  awayTeam,
  homeTeam,
  predictedScore,
  keyFactors = [],
  confidence = 'High',
}: StatIQAnalyticsProps) {
  // Round probabilities for display
  const awayProbDisplay = `${Math.round(awayTeam.winProbability * 10) / 10}%`;
  const homeProbDisplay = `${Math.round(homeTeam.winProbability * 10) / 10}%`;

  // Get percentages
  const awayPercentage = awayTeam.winProbability;
  const homePercentage = homeTeam.winProbability;

  // Get team abbreviations
  const awayAbbr = awayTeam.name.substring(0, 4).toUpperCase();
  const homeAbbr = homeTeam.name.substring(0, 3).toUpperCase();

  // Use exact same color logic as Fan Predictions:
  // Home team = full color, Away team = light version
  const awayColorFull = awayTeam.primaryColor || Colors.SURGE;
  const homeColorFull = homeTeam.primaryColor || Colors.BLAZE;
  
  const awayColor = getLightBackground(awayColorFull); // Light version for away
  const homeColor = homeColorFull; // Full color for home
  
  // Text colors
  const awayTextColor = isYellowGold(awayColorFull) ? Colors.BASALT : awayColorFull;
  const homeTextColor = homeColorFull;

  // Donut chart calculations
  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate arc lengths (as portions of circumference)
  const awayArcLength = (awayPercentage / 100) * circumference;
  const homeArcLength = (homePercentage / 100) * circumference;

  return (
    <View style={styles.analyticsCard}>
      {/* Header */}
      <View style={styles.simpleHeader}>
        <Text style={styles.simpleTitle}>Game Prediction</Text>
        <Text style={styles.simpleSubtitle}>Powered by StatIQ Analytics Engine</Text>
      </View>

      {/* Donut Chart Layout */}
      <View style={styles.donutLayout}>
        {/* Left Side - Home Team */}
        <View style={styles.donutSideColumn}>
          <Text style={styles.donutPercent}>{homeProbDisplay}</Text>
          <View style={styles.teamLabelRow}>
            <View style={[styles.teamColorBox, { backgroundColor: homeColor }]} />
            <Text style={[styles.donutTeamName, { color: homeTextColor }]}>{homeAbbr}</Text>
          </View>
        </View>

        {/* Center - Donut Chart */}
        <View style={styles.donutCenterColumn}>
          <Svg width={size} height={size}>
            {/* Background circle (dark gray) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2a2a2a"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Home team arc - starts at top, goes clockwise */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={homeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${homeArcLength} ${circumference - homeArcLength}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />

            {/* Away team arc - starts where home ends, completes circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={awayColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${awayArcLength} ${circumference - awayArcLength}`}
              strokeDashoffset={-homeArcLength}
              strokeLinecap="butt"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />

            {/* Center circle (inner hollow - creates donut effect) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius - strokeWidth}
              fill="#1a1a1a"
            />
          </Svg>
        </View>

        {/* Right Side - Away Team */}
        <View style={styles.donutSideColumn}>
          <Text style={styles.donutPercent}>{awayProbDisplay}</Text>
          <View style={styles.teamLabelRow}>
            <Text style={[styles.donutTeamName, { color: awayTextColor }]}>{awayAbbr}</Text>
            <View style={[styles.teamColorBox, { backgroundColor: awayColor }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// FAN PREDICTIONS - Pie Chart
// ============================================================================

interface FanPredictionsProps {
  awayTeam: {
    name: string;
    percentage: number;
    primaryColor?: string;
  };
  homeTeam: {
    name: string;
    percentage: number;
    primaryColor?: string;
  };
  totalVotes: number;
}

export function FanPredictions({ awayTeam, homeTeam, totalVotes }: FanPredictionsProps) {
  const [expanded, setExpanded] = useState(true); // Start expanded

  // Use team colors or fallback to defaults
  const awayColor = awayTeam?.primaryColor || '#DC0000';
  const homeColor = homeTeam?.primaryColor || Colors.SURGE;

  // HOME team (LEFT): Full color background + automatic contrast text
  const homeTextColor = getContrastColor(homeColor);

  // AWAY team (RIGHT): Light background + full color text (except yellow/gold)
  const awayBackgroundColor = getLightBackground(awayColor);
  const awayTextColor = isYellowGold(awayColor) ? Colors.BASALT : awayColor;

  return (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>FAN PREDICTIONS</Text>
          {!expanded && (
            <Text style={styles.predictionPreview}>
              {homeTeam?.percentage}% {homeTeam?.name} • {awayTeam?.percentage}% {awayTeam?.name} ({totalVotes?.toLocaleString() || 0} votes)
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.TEXT_SECONDARY}
        />
      </Pressable>

      {expanded && (
        <View style={styles.predictionsContent}>
          {/* Bar Chart with Labels Inside */}
          <View style={styles.predictionBarContainer}>
            <View style={styles.predictionBar}>
              {/* Home Team Section (Left) */}
              <View
                style={[
                  styles.predictionBarFill,
                  { width: `${homeTeam?.percentage || 50}%`, backgroundColor: homeColor },
                ]}
              >
                <Text style={[styles.barLabel, { color: homeTextColor }]}>
                  {homeTeam?.percentage || 50}% {homeTeam?.name}
                </Text>
              </View>
              
              {/* Away Team Section (Right) */}
              <View
                style={[
                  styles.predictionBarFill,
                  { width: `${awayTeam?.percentage || 50}%`, backgroundColor: awayBackgroundColor },
                ]}
              >
                <Text style={[styles.barLabel, { color: awayTextColor }]}>
                  {awayTeam?.name} {awayTeam?.percentage || 50}%
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.predictionSubtext}>
            According to StatIQ Fans ({totalVotes?.toLocaleString() || 0} votes)
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// SEASON LEADERS
// ============================================================================

interface Leader {
  name: string;
  position: string;
  stat: string;
  details: string;
}

interface SeasonLeadersProps {
  awayLeaders: {
    passing?: Leader;
    rushing?: Leader;
    receiving?: Leader;
  };
  homeLeaders: {
    passing?: Leader;
    rushing?: Leader;
    receiving?: Leader;
  };
}

export function SeasonLeaders({ awayLeaders, homeLeaders }: SeasonLeadersProps) {
  const [expanded, setExpanded] = useState(true);

  const categories = [
    { key: 'passing', label: 'Passing Yards' },
    { key: 'rushing', label: 'Rushing Yards' },
    { key: 'receiving', label: 'Receiving Yards' },
  ];

  return (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.sectionTitle}>SEASON LEADERS</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.TEXT_SECONDARY}
        />
      </Pressable>

      {expanded && (
        <View style={styles.leadersContent}>
          {categories.map((category) => {
            const awayLeader = awayLeaders[category.key as keyof typeof awayLeaders];
            const homeLeader = homeLeaders[category.key as keyof typeof homeLeaders];

            if (!awayLeader && !homeLeader) return null;

            return (
              <View key={category.key} style={styles.leaderCategory}>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <View style={styles.leaderComparison}>
                  {/* Away Leader */}
                  <Pressable 
                    style={styles.leaderCard}
                    onPress={() => {
                      // TODO: Connect to real player IDs
                      // router.push(`/player/${awayLeader?.player_id}`);
                    }}
                    disabled={!awayLeader}
                  >
                    {awayLeader ? (
                      <>
                        <View style={styles.playerPhoto}>
                          <Ionicons name="person-circle" size={60} color={Colors.TEXT_SECONDARY} />
                        </View>
                        <Text style={styles.leaderStat}>{awayLeader.stat}</Text>
                        <Text style={styles.leaderName}>{awayLeader.name}</Text>
                        <Text style={styles.leaderPosition}>{awayLeader.position}</Text>
                        <Text style={styles.leaderDetails}>{awayLeader.details}</Text>
                      </>
                    ) : (
                      <Text style={styles.noData}>No data</Text>
                    )}
                  </Pressable>

                  {/* Home Leader */}
                  <Pressable 
                    style={styles.leaderCard}
                    onPress={() => {
                      // TODO: Connect to real player IDs
                      // router.push(`/player/${homeLeader?.player_id}`);
                    }}
                    disabled={!homeLeader}
                  >
                    {homeLeader ? (
                      <>
                        <View style={styles.playerPhoto}>
                          <Ionicons name="person-circle" size={60} color={Colors.TEXT_SECONDARY} />
                        </View>
                        <Text style={styles.leaderStat}>{homeLeader.stat}</Text>
                        <Text style={styles.leaderName}>{homeLeader.name}</Text>
                        <Text style={styles.leaderPosition}>{homeLeader.position}</Text>
                        <Text style={styles.leaderDetails}>{homeLeader.details}</Text>
                      </>
                    ) : (
                      <Text style={styles.noData}>No data</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// LAST FIVE GAMES
// ============================================================================

interface GameResult {
  date: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
}

interface LastFiveGamesProps {
  awayTeam: {
    name: string;
    games: GameResult[];
  };
  homeTeam: {
    name: string;
    games: GameResult[];
  };
}

export function LastFiveGames({ awayTeam, homeTeam }: LastFiveGamesProps) {
  const [selectedTeam, setSelectedTeam] = useState<'away' | 'home'>('away');
  const [expanded, setExpanded] = useState(true);

  const currentTeam = selectedTeam === 'away' ? awayTeam : homeTeam;

  return (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.sectionTitle}>LAST FIVE GAMES</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.TEXT_SECONDARY}
        />
      </Pressable>

      {expanded && (
        <View style={styles.lastFiveContent}>
          {/* Team Toggle */}
          <View style={styles.teamToggle}>
            <Pressable
              style={[
                styles.toggleButton,
                selectedTeam === 'away' && styles.toggleButtonActive,
              ]}
              onPress={() => setSelectedTeam('away')}
            >
              <Text
                style={[
                  styles.toggleText,
                  selectedTeam === 'away' && styles.toggleTextActive,
                ]}
              >
                {awayTeam?.name || 'Away Team'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleButton,
                selectedTeam === 'home' && styles.toggleButtonActive,
              ]}
              onPress={() => setSelectedTeam('home')}
            >
              <Text
                style={[
                  styles.toggleText,
                  selectedTeam === 'home' && styles.toggleTextActive,
                ]}
              >
                {homeTeam?.name || 'Home Team'}
              </Text>
            </Pressable>
          </View>

          {/* Games Table */}
          <View style={styles.gamesTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>DATE</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>OPP</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>
                RESULT
              </Text>
            </View>
            {currentTeam?.games?.map((game, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{game.date}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{game.opponent}</Text>
                <View style={[styles.resultCell, { flex: 1 }]}>
                  <View
                    style={[
                      styles.resultBadge,
                      game.result === 'W' ? styles.resultWin : styles.resultLoss,
                    ]}
                  >
                    <Text style={styles.resultText}>{game.result}</Text>
                  </View>
                  <Text style={styles.scoreText}>{game.score}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable style={styles.fullScheduleLink}>
            <Text style={styles.linkText}>Full Schedule</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.SURGE} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STANDINGS
// ============================================================================

interface Standing {
  team: string;
  conf: string;
  ovr: string;
  isCurrentTeam?: boolean;
}

interface StandingsProps {
  conference: string;
  standings: Standing[];
}

export function Standings({ conference, standings }: StandingsProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.sectionTitle}>2025 STANDINGS</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.TEXT_SECONDARY}
        />
      </Pressable>

      {expanded && (
        <View style={styles.standingsContent}>
          <Text style={styles.conferenceLabel}>{conference}</Text>

          {/* Standings Table */}
          <View style={styles.standingsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>TEAM</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>
                CONF
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>
                OVR
              </Text>
            </View>
            {standings.map((standing, index) => (
              <View
                key={index}
                style={[
                  styles.standingRow,
                  standing.isCurrentTeam && styles.standingRowHighlight,
                ]}
              >
                <Text style={[styles.tableCell, { flex: 3 }]}>{standing.team}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {standing.conf}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {standing.ovr}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // StatIQ Header - Single Row with Safe Area
  espnHeaderContainer: {
    paddingTop: 50, // Space for notch/dynamic island
    backgroundColor: '#1E1E1E',
  },
  espnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  espnTeamSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  espnTeamLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  espnTeamInfo: {
    alignItems: 'center',
    gap: 2,
  },
  espnTeamAbbr: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  espnTeamRecord: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  espnCenterInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  espnDate: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  espnTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  espnNetworkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 2,
  },
  espnNetworkText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: Colors.TEXT_PRIMARY,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.SURGE, // #B4D836
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    margin: 16,
    borderRadius: BorderRadius.LG,
    gap: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    lineHeight: 22,
  },
  previewBody: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  previewTimestamp: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    marginTop: 4,
  },

  // StatIQ Analytics Engine
  analyticsCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  analyticsTitleMain: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  analyticsPoweredBy: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },
  analyticsPreview: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    marginTop: 8,
  },
  analyticsContent: {
    padding: 16,
    gap: 20,
  },
  
  // Circular Prediction Chart - StatIQ Style
  circularPredictionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  circularSideSection: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  circularPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  circularTeamLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circularTeamIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#666',
  },
  circularTeamName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  circularChartContainer: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularChart: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 12,
    borderColor: '#333',
  },
  circularInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsAttribution: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
  },

  // Section Cards
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderStyle: 'dotted',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  predictionPreview: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    marginTop: 4,
  },

  // Fan Predictions
  predictionsContent: {
    padding: 16,
  },
  predictionBarContainer: {
    marginBottom: 16,
  },
  predictionBar: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  predictionBarFill: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  predictionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  predictionTeam: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.MD,
    flex: 1,
    marginHorizontal: 4,
  },
  predictionPercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  predictionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  predictionSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
  },

  // Season Leaders
  leadersContent: {
    padding: 16,
    gap: 24,
  },
  leaderCategory: {
    gap: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  leaderComparison: {
    flexDirection: 'row',
    gap: 12,
  },
  leaderCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#121212',
    borderRadius: BorderRadius.MD,
  },
  playerPhoto: {
    marginBottom: 8,
  },
  leaderStat: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  leaderName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 2,
  },
  leaderPosition: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 4,
  },
  leaderDetails: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
  },
  noData: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },

  // Last Five Games
  lastFiveContent: {
    padding: 16,
  },
  teamToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#121212',
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.SURGE,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  toggleTextActive: {
    color: Colors.SHADOW,
  },
  gamesTable: {
    gap: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderStyle: 'dotted',
  },
  tableCell: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_PRIMARY,
  },
  resultCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  resultBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultWin: {
    backgroundColor: '#00A650',
  },
  resultLoss: {
    backgroundColor: '#DC0000',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  fullScheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.SURGE,
  },

  // Standings
  standingsContent: {
    padding: 16,
  },
  conferenceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  standingsTable: {
    gap: 4,
  },
  standingRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderStyle: 'dotted',
  },
  standingRowHighlight: {
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    borderRadius: BorderRadius.SM,
  },

  // Simple Donut Chart Styles
  simpleHeader: {
    padding: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  simpleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 6,
  },
  simpleSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },

  // Donut layout - three column layout
  donutLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingHorizontal: 12,
  },

  // Side columns (left and right) - fixed width
  donutSideColumn: {
    alignItems: 'center',
    gap: 8,
    width: 100,
  },

  // Percentage text
  donutPercent: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },

  // Team label row (box + name)
  teamLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Team color indicator box
  teamColorBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },

  // Team name
  donutTeamName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Center chart column
  donutCenterColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
  },
});
