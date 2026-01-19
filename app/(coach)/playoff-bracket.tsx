import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  seed?: string;
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
    0: {},
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

export default function CoachPlayoffBracketScreen() {
  const router = useRouter();
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
      setBracketData(data);
    } catch (err) {
      console.error('Error loading playoff bracket:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bracket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGamePress = (gameId: number) => {
    router.push(`/(coach)/game/${gameId}`);
  };

  const handleClassificationChange = (classification: Classification) => {
    setSelectedClassification(classification);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Playoff Bracket</Text>
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
        <View style={styles.header}>
          <Text style={styles.title}>Playoff Bracket</Text>
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
  const centerGames = organizedGames[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Playoff Bracket</Text>
        <Text style={styles.subtitle}>{selectedClassification} • Texas UIL Football</Text>
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

      {/* Bracket */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.bracketHorizontalScroll}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <ScrollView
          style={styles.bracketVerticalScroll}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bracketContainer}>
            {/* Round names header */}
            <View style={styles.globalRoundNamesRow}>
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
              
              <View style={{ width: 0 }} />
              
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
  const stateSemiIndex = roundNames.findIndex(r => r.includes('State Semifinal'));
  const championshipIndex = roundNames.findIndex(r => r.includes('Championship'));

  let semiGames = centerGames[stateSemiIndex] || [];
  let champGames = centerGames[championshipIndex] || [];
  
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
  
  semiGames = [...semiGames];
  while (semiGames.length < 2) {
    semiGames.push(createTBDGame(-2000 - semiGames.length));
  }
  
  champGames = [];
  champGames.push(createTBDGame(-3000));

  return (
    <View style={styles.centerColumn}>
      <View style={styles.finalFourLayout}>
        <View style={styles.semiSide}>
          <Text style={styles.centerRoundName}>STATE SEMIS</Text>
          <MatchupCard 
            game={semiGames[0]} 
            onPress={() => semiGames[0].id > 0 ? onGamePress(semiGames[0].id) : undefined}
            isTBD={semiGames[0].id < 0}
          />
        </View>

        <View style={styles.championshipCenter}>
          <Text style={styles.championshipLabel}>STATE CHAMPIONSHIP</Text>
          <MatchupCard 
            game={champGames[0]} 
            onPress={() => champGames[0].id > 0 ? onGamePress(champGames[0].id) : undefined}
            isTBD={champGames[0].id < 0}
          />
        </View>

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
// BRACKET CONNECTOR
// ============================================================================

interface BracketConnectorProps {
  gamesCount: number;
  isLeftSide: boolean;
}

function BracketConnector({ gamesCount, isLeftSide }: BracketConnectorProps) {
  const pairs = Math.ceil(gamesCount / 2);
  const totalHeight = gamesCount * CARD_HEIGHT + (gamesCount - 1) * GAME_GAP;
  
  const isAreaToRegionalQF = gamesCount === 4;
  const verticalLineExtension = isAreaToRegionalQF ? 60 : 0;
  
  const isRegionalsToQuarters = gamesCount === 2;
  const regionalsToQuartersExtension = isRegionalsToQuarters ? 186 : 0;
  
  return (
    <View style={[styles.bracketConnector, { height: totalHeight }]}>
      {Array.from({ length: pairs }).map((_, pairIdx) => {
        const bracketGroupOffset = isAreaToRegionalQF ? (pairIdx === 0 ? -94 : 33) : 0;
        const regionalsToQuartersOffset = isRegionalsToQuarters ? -regionalsToQuartersExtension / 2 : 0;
        
        const topGameCenter = pairIdx * 2 * (CARD_HEIGHT + GAME_GAP) + (CARD_HEIGHT / 2) + bracketGroupOffset + regionalsToQuartersOffset;
        const bottomGameCenter = (pairIdx * 2 + 1) * (CARD_HEIGHT + GAME_GAP) + (CARD_HEIGHT / 2) + bracketGroupOffset + regionalsToQuartersOffset;
        const verticalLineHeight = bottomGameCenter - topGameCenter + verticalLineExtension + regionalsToQuartersExtension;
        
        return (
          <View key={pairIdx} style={{ position: 'absolute', width: ROUND_SPACING, top: topGameCenter }}>
            <View style={[
              styles.horizontalLine, 
              { 
                position: 'absolute', 
                top: 0, 
                left: isLeftSide ? 0 : ROUND_SPACING / 2
              }
            ]} />
            
            <View style={[
              styles.verticalLine,
              { 
                height: verticalLineHeight,
                top: 0,
                left: ROUND_SPACING / 2,
              }
            ]} />
            
            <View style={[
              styles.horizontalLine, 
              { 
                position: 'absolute', 
                top: verticalLineHeight, 
                left: isLeftSide ? 0 : ROUND_SPACING / 2
              }
            ]} />
            
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
  const regionalRounds = ['Bi-District', 'Area', 'Regionals', 'Quarterfinals'];
  const expectedGamesPerRound = [8, 4, 2, 1];
  
  const allRounds = regionalRounds.map((roundName, idx) => {
    const roundIndex = roundNames.findIndex(r => r === roundName);
    const roundGames = roundIndex >= 0 ? (games[roundIndex] || []) : [];
    const expectedCount = expectedGamesPerRound[idx] || 1;
    const shortName = roundName
      .replace('Bi-District', 'BI-DISTRICT')
      .replace('Area', 'AREA')
      .replace('Regionals', 'REGIONALS')
      .replace('Quarterfinals', 'QUARTERS')
      .toUpperCase();
    
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

  const getGapForRound = (roundIdx: number) => {
    if (roundIdx === 0) return GAME_GAP;
    const spacingMultiplier = Math.pow(2, roundIdx);
    const cardSpacing = CARD_HEIGHT + GAME_GAP;
    return cardSpacing * spacingMultiplier - CARD_HEIGHT;
  };

  if (allRounds.length === 0) {
    return null;
  }

  return (
    <View style={styles.regionBracket}>
      <View style={[styles.roundsRow, !isLeftSide && { flexDirection: 'row-reverse' }]}>
        {allRounds.map(({ roundIndex, roundName, games: roundGames }, roundIdx) => (
            <React.Fragment key={roundIndex}>
              <View style={styles.roundColumn}>
                {roundIdx === 2 && (
                  <View style={[
                    styles.regionLabelOverlay,
                    { top: CARD_HEIGHT + getGapForRound(2) / 2 - 10 }
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
  
  const homeWinnerColor = game.home_primary_color || Colors.SURGE;
  const awayWinnerColor = game.away_primary_color || Colors.SURGE;
  
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
      {isTBD && (
        <View style={styles.incomingLine} />
      )}
      
      {isLive && (
        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      
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
    backgroundColor: '#323232',
    borderRadius: 20,
  },

  // Header - iPad coach style
  header: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 20,
  },
  title: {
    fontSize: 42,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
    marginTop: 4,
  },

  // Classification Filters
  filterScroll: {
    maxHeight: 70,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#3a3a3a',
    borderWidth: 2,
    borderColor: '#555',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  filterChipActive: {
    backgroundColor: Colors.SURGE,
    borderColor: Colors.SURGE,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  filterTextActive: {
    color: Colors.BASALT,
    fontFamily: 'NeueHaas-Bold',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Medium',
    color: '#999',
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
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
    textAlign: 'center',
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
    minWidth: 2000,
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

  halfContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    position: 'relative',
  },

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
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    backgroundColor: '#323232',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roundNameHeader: {
    alignItems: 'center',
  },
  roundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 1000,
  },

  roundColumn: {
    alignItems: 'center',
  },
  roundName: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  gamesColumn: {
  },

  // Bracket Connectors
  bracketConnector: {
    width: ROUND_SPACING,
    position: 'relative',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: '#555',
    width: ROUND_SPACING / 2,
  },
  incomingLine: {
    position: 'absolute',
    left: -ROUND_SPACING / 2,
    top: CARD_HEIGHT / 2,
    width: ROUND_SPACING / 2,
    height: 1,
    backgroundColor: '#555',
  },
  verticalLine: {
    width: 1,
    backgroundColor: '#555',
    position: 'absolute',
  },

  // Center Column
  centerColumn: {
    width: 440,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 458,
  },
  centerColumnAbsolute: {
    position: 'absolute',
    left: '50%',
    top: 0,
    transform: [{ translateX: -220 }],
    zIndex: 100,
  },
  finalFourLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  semiSide: {
    alignItems: 'center',
  },
  championshipCenter: {
    alignItems: 'center',
  },
  centerRoundName: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  centerSpacer: {
    width: 0,
    position: 'absolute',
  },
  championshipLabel: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.SURGE,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Matchup Card
  matchupCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
    overflow: 'hidden',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2a2a2a',
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
    minWidth: 0,
    marginRight: 8,
  },
  seedNumber: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
    width: 20,
    flexShrink: 0,
  },
  teamName: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Medium',
    color: '#aaa',
    flex: 1,
    minWidth: 0,
  },
  teamNameWinner: {
    color: '#fff',
    fontFamily: 'NeueHaas-Bold',
  },
  score: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Bold',
    color: '#aaa',
    width: 32,
    flexShrink: 0,
    textAlign: 'center',
    marginTop: -2,
  },
  scoreWinner: {
    color: Colors.SURGE,
  },
  scheduledDay: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
    width: 32,
    flexShrink: 0,
    textAlign: 'center',
  },
  scheduledTime: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
    width: 45,
    flexShrink: 0,
    textAlign: 'center',
  },
  matchupDivider: {
    height: 1,
    backgroundColor: '#4a4a4a',
  },
  matchupCardTBD: {
    opacity: 0.4,
  },
  matchupCardScheduled: {
    borderColor: '#4a4a4a',
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
  },
  matchupCardLive: {
    borderColor: Colors.BLAZE,
    borderWidth: 2,
  },
  
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
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
