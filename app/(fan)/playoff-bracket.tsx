import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/design';

const CARD_WIDTH = 180;
const CARD_HEIGHT = 56;
const ROUND_SPACING = 40;
const GAME_GAP = 6;

// Playoff classifications
const PLAYOFF_CLASSIFICATIONS = ['6A-D1', '6A-D2', '5A-D1', '5A-D2', '4A-D1', '4A-D2', '3A-D1', '3A-D2', '2A-D1', '2A-D2', '1A-D1'] as const;
type Classification = typeof PLAYOFF_CLASSIFICATIONS[number];

// ============================================================================
// TYPES
// ============================================================================

interface Team {
  id: number;
  name: string;
  mascot: string;
  seed?: string; // Changed from number to string (e.g., "W1", "F2")
}

interface PlayoffGame {
  id: number;
  game_id: string;
  region: number;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  status: string;
  kickoff_at: string | null;
  location: string;
  home_primary_color?: string;
  away_primary_color?: string;
}

interface PlayoffRound {
  round: string;
  games: PlayoffGame[];
}

interface PlayoffBracketData {
  conference: string;
  rounds: PlayoffRound[];
}

// ============================================================================
// HELPER: Organize games by region and round
// ============================================================================

interface RegionRoundGames {
  [region: number]: {
    [roundIndex: number]: PlayoffGame[];
  };
}

function organizeGamesByRegionAndRound(bracketData: PlayoffBracketData): RegionRoundGames {
  const organized: RegionRoundGames = {
    0: {}, // State semis and championship (region 0)
    1: {}, 
    2: {}, 
    3: {}, 
    4: {}
  };

  bracketData.rounds.forEach((round, roundIndex) => {
    round.games.forEach(game => {
      const region = game.region;
      if (region >= 0 && region <= 4) {
        if (!organized[region][roundIndex]) {
          organized[region][roundIndex] = [];
        }
        organized[region][roundIndex].push(game);
      }
    });
  });

  return organized;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlayoffBracketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedClassification, setSelectedClassification] = useState<Classification>('5A-D1');
  const [bracketData, setBracketData] = useState<PlayoffBracketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBracket();
  }, [selectedClassification]);

  const loadBracket = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";
      const conference = selectedClassification.replace('-', ' ');

      console.log('[BRACKET] Fetching:', `${API_BASE}/playoff-bracket?conference=${encodeURIComponent(conference)}`);

      const response = await fetch(
        `${API_BASE}/playoff-bracket?conference=${encodeURIComponent(conference)}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bracket: ${response.status}`);
      }

      const data = await response.json();
      console.log('[BRACKET] Data received:', data);
      console.log('[BRACKET] Rounds count:', data.rounds?.length);
      setBracketData(data);
    } catch (err) {
      console.error('Error loading playoff bracket:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bracket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGamePress = (gameId: number) => {
    router.push(`/game/${gameId}`);
  };

  const handleClassificationChange = (classification: Classification) => {
    setSelectedClassification(classification);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
          </Pressable>
          <Text style={styles.headerTitle}>PLAYOFF BRACKET</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading bracket...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
          </Pressable>
          <Text style={styles.headerTitle}>PLAYOFF BRACKET</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScroll}
        >
          {PLAYOFF_CLASSIFICATIONS.map(classification => (
            <Pressable
              key={classification}
              style={[
                styles.filterChip,
                selectedClassification === classification && styles.filterChipActive,
              ]}
              onPress={() => handleClassificationChange(classification)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedClassification === classification && styles.filterTextActive,
                ]}
              >
                {classification}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.BLAZE} />
          <Text style={styles.errorTitle}>Failed to Load Bracket</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadBracket}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const organizedGames = organizeGamesByRegionAndRound(bracketData!);
  const roundNames = bracketData?.rounds.map(r => r.round) || [];

  // Get center games (state semis & championship)
  const centerGames = organizedGames[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PLAYOFF BRACKET</Text>
          <Text style={styles.headerSubtitle}>{selectedClassification} • Week 1 • Bi-District</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Classification Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {PLAYOFF_CLASSIFICATIONS.map(classification => (
          <Pressable
            key={classification}
            style={[
              styles.filterChip,
              selectedClassification === classification && styles.filterChipActive,
            ]}
            onPress={() => handleClassificationChange(classification)}
          >
            <Text
              style={[
                styles.filterText,
                selectedClassification === classification && styles.filterTextActive,
              ]}
            >
              {classification}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* March Madness Style Bracket */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.bracketHorizontalScroll}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <ScrollView
          style={styles.bracketVerticalScroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bracketContainer}>
            {/* Round names header - once for entire bracket */}
            <View style={styles.globalRoundNamesRow}>
              {/* Left side round names */}
              <View style={styles.roundNamesSection}>
                {['BI-DISTRICT', 'AREA', 'REGIONALS', 'QUARTERS'].map((name, idx) => (
                  <React.Fragment key={`left-${idx}`}>
                    <View style={[styles.roundNameHeader, { width: CARD_WIDTH }]}>
                      <Text style={styles.roundName}>{name}</Text>
                    </View>
                    {idx < 4 && <View style={{ width: ROUND_SPACING }} />}
                  </React.Fragment>
                ))}
              </View>
              
              {/* Center spacer */}
              <View style={{ width: 0 }} />
              
              {/* Right side round names (reversed) */}
              <View style={styles.roundNamesSection}>
                {['QUARTERS', 'REGIONALS', 'AREA', 'BI-DISTRICT'].map((name, idx) => (
                  <React.Fragment key={`right-${idx}`}>
                    <View style={[styles.roundNameHeader, { width: CARD_WIDTH }]}>
                      <Text style={styles.roundName}>{name}</Text>
                    </View>
                    {idx < 4 && <View style={{ width: ROUND_SPACING }} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
            
            {/* Top Half: Regions 1 & 3 */}
            <View style={styles.halfContainer}>
              {/* Region 1 (Top Left) */}
              <View style={{ flex: 1 }}>
                <RegionBracket
                  regionNumber={1}
                  regionLabel="REGION 1"
                  games={organizedGames[1]}
                  roundNames={roundNames}
                  onGamePress={handleGamePress}
                  isLeftSide={true}
                />
              </View>

              {/* Region 3 (Top Right) */}
              <View style={{ flex: 1 }}>
                <RegionBracket
                  regionNumber={3}
                  regionLabel="REGION 3"
                  games={organizedGames[3]}
                  roundNames={roundNames}
                  onGamePress={handleGamePress}
                  isLeftSide={false}
                />
              </View>

              {/* Center Column (State Semifinals & Championship) - Absolutely positioned to overlap */}
              <View style={styles.centerColumnAbsolute}>
                <CenterColumn
                  centerGames={centerGames}
                  roundNames={roundNames}
                  onGamePress={handleGamePress}
                />
              </View>
            </View>

            {/* Bottom Half: Regions 2 & 4 */}
            <View style={styles.halfContainer}>
              {/* Region 2 (Bottom Left) */}
              <View style={{ flex: 1 }}>
                <RegionBracket
                  regionNumber={2}
                  regionLabel="REGION 2"
                  games={organizedGames[2]}
                  roundNames={roundNames}
                  onGamePress={handleGamePress}
                  isLeftSide={true}
                />
              </View>

              {/* Region 4 (Bottom Right) */}
              <View style={{ flex: 1 }}>
                <RegionBracket
                  regionNumber={4}
                  regionLabel="REGION 4"
                  games={organizedGames[4]}
                  roundNames={roundNames}
                  onGamePress={handleGamePress}
                  isLeftSide={false}
                />
              </View>

              {/* Center Spacer - matches centerColumnAbsolute width */}
              <View style={styles.centerSpacer} />
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// CENTER COLUMN (State Semis & Championship)
// ============================================================================

interface CenterColumnProps {
  centerGames: { [roundIndex: number]: PlayoffGame[] };
  roundNames: string[];
  onGamePress: (gameId: number) => void;
}

function CenterColumn({ centerGames, roundNames, onGamePress }: CenterColumnProps) {
  // Find state semis and championship rounds
  const stateSemiIndex = roundNames.findIndex(r => r.includes('State Semifinal'));
  const championshipIndex = roundNames.findIndex(r => r.includes('Championship'));

  let semiGames = centerGames[stateSemiIndex] || [];
  let champGames = centerGames[championshipIndex] || [];
  
  // Fill with TBD games if needed
  const createTBDGame = (id: number): PlayoffGame => ({
    id,
    game_id: 'TBD',
    region: 0,
    home_team: { id: -1, name: 'TBD', mascot: '' },
    away_team: { id: -1, name: 'TBD', mascot: '' },
    home_score: null,
    away_score: null,
    status: 'scheduled',
    kickoff_at: null,
    location: 'TBD',
  });
  
  // State semifinals should have 2 games
  semiGames = [...semiGames];
  while (semiGames.length < 2) {
    semiGames.push(createTBDGame(-2000 - semiGames.length));
  }
  
  // Championship should have 1 game - force TBD for now
  champGames = []; // Clear any backend data
  champGames.push(createTBDGame(-3000));

  return (
    <View style={styles.centerColumn}>
      {/* Horizontal layout: Semi 1 | Championship | Semi 2 */}
      <View style={styles.finalFourLayout}>
        {/* Left Semifinal */}
        <View style={styles.semiSide}>
          <Text style={styles.centerRoundName}>STATE SEMIS</Text>
          <MatchupCard 
            game={semiGames[0]} 
            onPress={() => semiGames[0].id > 0 ? onGamePress(semiGames[0].id) : undefined}
            isTBD={semiGames[0].id < 0}
          />
        </View>

        {/* Center Championship */}
        <View style={styles.championshipCenter}>
          <Text style={styles.championshipLabel}>STATE CHAMPIONSHIP</Text>
          <MatchupCard 
            game={champGames[0]} 
            onPress={() => champGames[0].id > 0 ? onGamePress(champGames[0].id) : undefined}
            isTBD={champGames[0].id < 0}
          />
        </View>

        {/* Right Semifinal */}
        <View style={styles.semiSide}>
          <Text style={styles.centerRoundName}>STATE SEMIS</Text>
          <MatchupCard 
            game={semiGames[1]} 
            onPress={() => semiGames[1].id > 0 ? onGamePress(semiGames[1].id) : undefined}
            isTBD={semiGames[1].id < 0}
          />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// BRACKET CONNECTOR - Lines between rounds
// ============================================================================

interface BracketConnectorProps {
  gamesCount: number;
  isLeftSide: boolean;
}

function BracketConnector({ gamesCount, isLeftSide }: BracketConnectorProps) {
  // Each pair of games connects to one game in the next round
  const pairs = Math.ceil(gamesCount / 2);
  const totalHeight = gamesCount * CARD_HEIGHT + (gamesCount - 1) * GAME_GAP;
  
  // Determine if this is the Area->Regionals connector (4 games)
  const isAreaToRegionalQF = gamesCount === 4;
  const verticalLineExtension = isAreaToRegionalQF ? 60 : 0; // Add 60px to make vertical lines taller
  
  // Determine if this is Regionals->Quarterfinals connector (2 games)
  const isRegionalsToQuarters = gamesCount === 2;
  const regionalsToQuartersExtension = isRegionalsToQuarters ? 186 : 0; // Add 186px for Regionals to Quarters
  
  return (
    <View style={[styles.bracketConnector, { height: totalHeight }]}>
      {Array.from({ length: pairs }).map((_, pairIdx) => {
        // Calculate exact center position for each game
        // For Area->Regionals, spread bracket groups vertically
        const bracketGroupOffset = isAreaToRegionalQF ? (pairIdx === 0 ? -94 : 33) : 0; // Top -94, bottom +33
        
        // For Regionals->Quarters, offset to keep centered while extending height
        const regionalsToQuartersOffset = isRegionalsToQuarters ? -regionalsToQuartersExtension / 2 : 0; // Offset up by half the extension to keep centered
        
        const topGameCenter = pairIdx * 2 * (CARD_HEIGHT + GAME_GAP) + (CARD_HEIGHT / 2) + bracketGroupOffset + regionalsToQuartersOffset;
        const bottomGameCenter = (pairIdx * 2 + 1) * (CARD_HEIGHT + GAME_GAP) + (CARD_HEIGHT / 2) + bracketGroupOffset + regionalsToQuartersOffset;
        const verticalLineHeight = bottomGameCenter - topGameCenter + verticalLineExtension + regionalsToQuartersExtension;
        
        return (
          <View key={pairIdx} style={{ position: 'absolute', width: ROUND_SPACING, top: topGameCenter }}>
            {/* Top horizontal line from first game */}
            <View style={[
              styles.horizontalLine, 
              { 
                position: 'absolute', 
                top: 0, 
                left: isLeftSide ? 0 : ROUND_SPACING / 2
              }
            ]} />
            
            {/* Vertical connecting line */}
            <View style={[
              styles.verticalLine,
              { 
                height: verticalLineHeight,
                top: 0,
                left: ROUND_SPACING / 2,
              }
            ]} />
            
            {/* Bottom horizontal line from second game */}
            <View style={[
              styles.horizontalLine, 
              { 
                position: 'absolute', 
                top: verticalLineHeight, 
                left: isLeftSide ? 0 : ROUND_SPACING / 2
              }
            ]} />
            
            {/* Outgoing horizontal line to next round (at center) */}
            <View style={[
              styles.horizontalLine,
              {
                position: 'absolute',
                top: verticalLineHeight / 2,
                left: isLeftSide ? ROUND_SPACING / 2 : 0,
                width: ROUND_SPACING / 2,
              }
            ]} />
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// REGION BRACKET COMPONENT
// ============================================================================

interface RegionBracketProps {
  regionNumber: number;
  regionLabel: string;
  games: { [roundIndex: number]: PlayoffGame[] };
  roundNames: string[];
  onGamePress: (gameId: number) => void;
  isLeftSide: boolean;
}

function RegionBracket({ regionNumber, regionLabel, games, roundNames, onGamePress, isLeftSide }: RegionBracketProps) {
  // Get regional rounds only (not state semis/championship)
  const regionalRounds = ['Bi-District', 'Area', 'Regionals', 'Quarterfinals'];
  
  // Expected games per round for 16 teams per region (each region has 16 seeds)
  const expectedGamesPerRound = [8, 4, 2, 1]; // Bi-District, Area, Regionals, Quarters
  
  // Build ALL rounds, even if they don't have data yet
  const allRounds = regionalRounds.map((roundName, idx) => {
    // Find if this round exists in the data
    const roundIndex = roundNames.findIndex(r => r === roundName);
    const roundGames = roundIndex >= 0 ? (games[roundIndex] || []) : [];
    const expectedCount = expectedGamesPerRound[idx] || 1;
    // Abbreviate round names
    const shortName = roundName
      .replace('Bi-District', 'BI-DISTRICT')
      .replace('Area', 'AREA')
      .replace('Regionals', 'REGIONALS')
      .replace('Quarterfinals', 'QUARTERS')
      .toUpperCase();
    
    // Fill with TBD games if needed
    const allGames = [...roundGames];
    while (allGames.length < expectedCount) {
      allGames.push({
        id: -1 * (allGames.length + 1) * 1000 - idx - (regionNumber * 10000),
        game_id: 'TBD',
        region: regionNumber,
        home_team: { id: -1, name: 'TBD', mascot: '' },
        away_team: { id: -1, name: 'TBD', mascot: '' },
        home_score: null,
        away_score: null,
        status: 'scheduled',
        kickoff_at: null,
        location: 'TBD',
      } as PlayoffGame);
    }
    
    return {
      roundIndex: idx,
      roundName: shortName,
      games: allGames,
    };
  });

  // Calculate the gap between games for proper bracket alignment
  const getGapForRound = (roundIdx: number) => {
    if (roundIdx === 0) return GAME_GAP; // First round uses normal spacing
    
    // Each subsequent round doubles the spacing
    const spacingMultiplier = Math.pow(2, roundIdx);
    const cardSpacing = CARD_HEIGHT + GAME_GAP;
    
    // Gap needed to center this round's games with previous round's pairs
    return cardSpacing * spacingMultiplier - CARD_HEIGHT;
  };

  if (allRounds.length === 0) {
    return null;
  }

  return (
    <View style={styles.regionBracket}>
      {/* Games columns */}
      <View style={[styles.roundsRow, !isLeftSide && { flexDirection: 'row-reverse' }]}>
        {allRounds.map(({ roundIndex, roundName, games: roundGames }, roundIdx) => (
            <React.Fragment key={roundIndex}>
              <View style={styles.roundColumn}>
                {/* Region label between the 2 Regionals games (roundIdx 2) */}
                {roundIdx === 2 && (
                  <View style={[
                    styles.regionLabelOverlay,
                    { top: CARD_HEIGHT + getGapForRound(2) / 2 - 10 } // Center between the 2 games
                  ]}>
                    <Text style={styles.regionLabel}>{regionLabel}</Text>
                  </View>
                )}
                
                <View style={[styles.gamesColumn, { gap: getGapForRound(roundIdx) }]}>
                {roundGames.map((game) => (
                  <MatchupCard
                    key={game.id}
                    game={game}
                    onPress={() => game.id > 0 ? onGamePress(game.id) : undefined}
                    isTBD={game.id < 0}
                  />
                ))}
              </View>
            </View>
            
            {/* Connector lines between rounds */}
            {roundIdx < allRounds.length - 1 && (
              <BracketConnector gamesCount={roundGames.length} isLeftSide={isLeftSide} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// MATCHUP CARD COMPONENT
// ============================================================================

interface MatchupCardProps {
  game: PlayoffGame;
  onPress: () => void;
  isTBD?: boolean;
}

function MatchupCard({ game, onPress, isTBD = false }: MatchupCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const awayWinner = game.away_score !== null && game.home_score !== null && game.away_score > game.home_score;
  const homeWinner = game.home_score !== null && game.away_score !== null && game.home_score > game.away_score;
  const isLive = game.status === 'live' || game.status === 'in_progress';
  const isFinished = game.status === 'final' || game.status === 'finished';
  const isScheduled = game.status === 'scheduled' || (!isLive && !isFinished);
  
  // Use team colors for winners
  const homeWinnerColor = game.home_primary_color || Colors.SURGE;
  const awayWinnerColor = game.away_primary_color || Colors.SURGE;
  
  // Pulsing animation for live games
  useEffect(() => {
    if (isLive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLive]);
  
  // Format time for scheduled games
  const formatGameTime = () => {
    if (!game.kickoff_at) return { date: 'TBD', time: '' };
    const date = new Date(game.kickoff_at);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    return { date: dayOfWeek, time };
  };
  
  const { date: gameDay, time: gameTime } = formatGameTime();

  return (
    <Pressable 
      style={[
        styles.matchupCard, 
        isTBD && styles.matchupCardTBD,
        isScheduled && !isTBD && styles.matchupCardScheduled,
        isLive && styles.matchupCardLive,
      ]} 
      onPress={isTBD ? undefined : onPress} 
      disabled={isTBD}
    >
      {/* Incoming line for TBD games (later rounds) */}
      {isTBD && (
        <View style={styles.incomingLine} />
      )}
      
      {/* Live Indicator */}
      {isLive && (
        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      
      {/* Home Team - ALWAYS ON TOP */}
      <View style={[
        styles.teamRow, 
        homeWinner && styles.teamRowWinner,
        homeWinner && { borderLeftColor: homeWinnerColor, borderLeftWidth: 3 }
      ]}>
        <View style={styles.teamLeft}>
          {game.home_team.seed && (
            <Text style={styles.seedNumber}>{game.home_team.seed}</Text>
          )}
          <Text style={[styles.teamName, homeWinner && styles.teamNameWinner]} numberOfLines={1}>
            {game.home_team.name}
          </Text>
        </View>
        {isScheduled && !isTBD ? (
          <Text style={styles.scheduledDay}>{gameDay}</Text>
        ) : (
          <Text style={[
            styles.score, 
            homeWinner && styles.scoreWinner,
            homeWinner && { color: homeWinnerColor }
          ]}>
            {game.home_score ?? '-'}
          </Text>
        )}
      </View>

      <View style={styles.matchupDivider} />

      {/* Away Team */}
      <View style={[
        styles.teamRow, 
        awayWinner && styles.teamRowWinner,
        awayWinner && { borderLeftColor: awayWinnerColor, borderLeftWidth: 3 }
      ]}>
        <View style={styles.teamLeft}>
          {game.away_team.seed && (
            <Text style={styles.seedNumber}>{game.away_team.seed}</Text>
          )}
          <Text style={[styles.teamName, awayWinner && styles.teamNameWinner]} numberOfLines={1}>
            {game.away_team.name}
          </Text>
        </View>
        {isScheduled && !isTBD ? (
          <Text style={styles.scheduledTime}>{gameTime}</Text>
        ) : (
          <Text style={[
            styles.score, 
            awayWinner && styles.scoreWinner,
            awayWinner && { color: awayWinnerColor }
          ]}>
            {game.away_score ?? '-'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.SHADOW,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  playoffLogo: {
    width: 120,
    height: 80,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 44,
  },

  // Classification Filters
  filterScroll: {
    maxHeight: 60,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 1.5,
    borderColor: Colors.GRAPHITE,
  },
  filterChipActive: {
    backgroundColor: Colors.SURGE,
    borderColor: Colors.SURGE,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  filterTextActive: {
    color: Colors.BASALT,
    fontWeight: '700',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.SURGE,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.BASALT,
  },

  // Bracket Layout
  bracketHorizontalScroll: {
    flex: 1,
  },
  bracketVerticalScroll: {
    flex: 1,
  },
  bracketContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    minWidth: 2000, // Force horizontal scroll
  },
  globalRoundNamesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundNamesSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Half containers (top/bottom)
  halfContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative', // Allow absolute positioning of center column
  },

  // Region Bracket
  regionBracket: {
    flex: 1,
  },
  regionLabelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  regionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.5,
    backgroundColor: Colors.SHADOW,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roundNamesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundNameHeader: {
    alignItems: 'center',
  },
  roundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 1000, // Force horizontal scrolling
  },

  // Round Column
  roundColumn: {
    alignItems: 'center',
  },
  roundName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.TEXT_TERTIARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  gamesColumn: {
    // gap set dynamically
  },

  // Bracket Connectors
  bracketConnector: {
    width: ROUND_SPACING,
    position: 'relative',
  },
  connectorGroup: {
    height: CARD_HEIGHT * 2 + GAME_GAP,
    justifyContent: 'center',
    position: 'relative',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: Colors.HALO,
    width: ROUND_SPACING / 2,
  },
  incomingLine: {
    position: 'absolute',
    left: -ROUND_SPACING / 2,
    top: CARD_HEIGHT / 2,
    width: ROUND_SPACING / 2,
    height: 1,
    backgroundColor: Colors.HALO,
  },
  verticalLine: {
    width: 1,
    backgroundColor: Colors.HALO,
    position: 'absolute',
  },

  // Center Column
  centerColumn: {
    width: 440,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 458, // Fine-tuned position
  },
  centerColumnAbsolute: {
    position: 'absolute',
    left: '50%',
    top: 0,
    transform: [{ translateX: -220 }], // Half of 440px width to center
    zIndex: 100,
  },
  finalFourLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Minimal gap between the 3 final game boxes
  },
  semiSide: {
    alignItems: 'center',
  },
  championshipCenter: {
    alignItems: 'center',
  },
  centerLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  centerPlayoffLogo: {
    width: 200,
    height: 140,
  },
  centerRound: {
    alignItems: 'center',
    marginBottom: 20,
  },
  centerRoundName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  centerGames: {
    gap: GAME_GAP,
  },
  centerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSpacer: {
    width: 0, // No space needed since center is absolutely positioned
    position: 'absolute', // Make it invisible
  },
  championshipLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.SURGE,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Matchup Card
  matchupCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.GRAPHITE,
    overflow: 'hidden',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  // Team Row
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.VOID,
    flex: 1,
  },
  teamRowWinner: {
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
  },
  teamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    minWidth: 0, // Allow shrinking
    marginRight: 8, // Space before score
  },
  seedNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.TEXT_TERTIARY,
    width: 20, // Increased to fit W1, F16, etc.
    flexShrink: 0, // Don't shrink seed
  },
  teamName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  teamNameWinner: {
    color: Colors.TEXT_PRIMARY,
    fontWeight: '700',
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    width: 32, // Fixed width - enough for 2-digit scores
    flexShrink: 0, // Never shrink score
    textAlign: 'center', // Center-aligned
    marginTop: -2, // Bump up 2px for better vertical alignment
  },
  scoreWinner: {
    color: Colors.SURGE,
    fontWeight: '800',
  },
  scheduledDay: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.TEXT_TERTIARY,
    width: 32, // Match score width
    flexShrink: 0,
    textAlign: 'center',
  },
  scheduledTime: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
    width: 45, // Wider for times like "7:00 PM"
    flexShrink: 0,
    textAlign: 'center',
  },
  matchupDivider: {
    height: 1,
    backgroundColor: Colors.GRAPHITE,
  },
  matchupCardTBD: {
    opacity: 0.4,
  },
  matchupCardScheduled: {
    borderColor: Colors.GRAPHITE,
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
  },
  matchupCardLive: {
    borderColor: Colors.BLAZE,
    borderWidth: 2,
  },
  
  // Live Indicator
  liveIndicator: {
    position: 'absolute',
    top: -10,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.BLAZE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.HALO,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.HALO,
    letterSpacing: 0.5,
  },
});
