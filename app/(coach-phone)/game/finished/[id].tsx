import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';
import { getGameRecap, type GameRecapData } from '@/src/lib/coach-api';

type StatTab = 'team' | 'passing' | 'rushing' | 'receiving' | 'defense';

export default function CoachFinishedGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameRecapData | null>(null);
  const [showFullRecap, setShowFullRecap] = useState(false);
  const [selectedTab, setSelectedTab] = useState<StatTab>('team');

  useEffect(() => {
    loadGameData();
  }, [id]);

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const recap = await getGameRecap(Number(id));
      setGameData(recap);
    } catch (err) {
      console.error('Error loading game recap:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
        <Text style={styles.loadingText}>Loading game recap...</Text>
      </View>
    );
  }

  if (error || !gameData) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.BLAZE} />
        <Text style={styles.errorText}>{error || 'Failed to load game'}</Text>
        <Pressable onPress={loadGameData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { home_team, away_team, team_stats, quarter_scores, scoring_plays, rushing, passing, receiving, defense } = gameData;
  const homeWon = home_team.score > away_team.score;

  const gameDate = new Date(gameData.game_date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Get top performer from each team
  const homeTopRusher = rushing.home[0];
  const awayTopRusher = rushing.away[0];
  const homeTopPasser = passing.home[0];
  const awayTopPasser = passing.away[0];

  const tabs: { key: StatTab; label: string }[] = [
    { key: 'team', label: 'Team' },
    { key: 'passing', label: 'Passing' },
    { key: 'rushing', label: 'Rushing' },
    { key: 'receiving', label: 'Receiving' },
    { key: 'defense', label: 'Defense' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>Game Recap</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <LinearGradient
            colors={[`${home_team.primary_color}30`, 'transparent', `${away_team.primary_color}30`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scoreGradient}
          />
          
          <View style={styles.finalBadge}>
            <Text style={styles.finalBadgeText}>FINAL</Text>
          </View>

          <View style={styles.scoreContent}>
            {/* Home Team */}
            <View style={styles.teamSide}>
              <View style={[styles.teamBadge, { backgroundColor: home_team.primary_color }]}>
                <Text style={styles.teamInitial}>{home_team.name.charAt(0)}</Text>
              </View>
              <Text style={styles.teamName}>{home_team.name}</Text>
              <Text style={styles.teamMascot}>{home_team.mascot}</Text>
              {homeWon && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.SURGE} style={{ marginTop: 4 }} />
              )}
            </View>

            {/* Score */}
            <View style={styles.scoreCenter}>
              <Text style={styles.scoreText}>{home_team.score}</Text>
              <Text style={styles.scoreDash}>-</Text>
              <Text style={styles.scoreText}>{away_team.score}</Text>
            </View>

            {/* Away Team */}
            <View style={styles.teamSide}>
              <View style={[styles.teamBadge, { backgroundColor: away_team.primary_color }]}>
                <Text style={styles.teamInitial}>{away_team.name.charAt(0)}</Text>
              </View>
              <Text style={styles.teamName}>{away_team.name}</Text>
              <Text style={styles.teamMascot}>{away_team.mascot}</Text>
              {!homeWon && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.SURGE} style={{ marginTop: 4 }} />
              )}
            </View>
          </View>

          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsCard}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          
          <View style={styles.quickStatsGrid}>
            <QuickStat 
              label="Total Yards" 
              home={team_stats.home.total_yards} 
              away={team_stats.away.total_yards}
              homeColor={home_team.primary_color}
              awayColor={away_team.primary_color}
            />
            <QuickStat 
              label="Passing" 
              home={team_stats.home.passing_yards} 
              away={team_stats.away.passing_yards}
              homeColor={home_team.primary_color}
              awayColor={away_team.primary_color}
            />
            <QuickStat 
              label="Rushing" 
              home={team_stats.home.rushing_yards} 
              away={team_stats.away.rushing_yards}
              homeColor={home_team.primary_color}
              awayColor={away_team.primary_color}
            />
            <QuickStat 
              label="Turnovers" 
              home={team_stats.home.turnovers} 
              away={team_stats.away.turnovers}
              homeColor={home_team.primary_color}
              awayColor={away_team.primary_color}
              inverted
            />
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.performersCard}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          
          <View style={styles.performersRow}>
            {/* Home Team Performer */}
            <View style={styles.performerBlock}>
              <View style={[styles.performerHeader, { backgroundColor: home_team.primary_color }]}>
                <Text style={styles.performerTeam}>{home_team.name}</Text>
              </View>
              <View style={styles.performerContent}>
                {homeTopRusher && (
                  <View style={styles.performerStat}>
                    <Text style={styles.performerName}>#{homeTopRusher.jersey} {homeTopRusher.name}</Text>
                    <Text style={styles.performerLine}>{homeTopRusher.carries} CAR, {homeTopRusher.yards} YDS, {homeTopRusher.tds} TD</Text>
                  </View>
                )}
                {homeTopPasser && (
                  <View style={styles.performerStat}>
                    <Text style={styles.performerName}>#{homeTopPasser.jersey} {homeTopPasser.name}</Text>
                    <Text style={styles.performerLine}>{homeTopPasser.completions}/{homeTopPasser.attempts}, {homeTopPasser.yards} YDS, {homeTopPasser.tds} TD</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Away Team Performer */}
            <View style={styles.performerBlock}>
              <View style={[styles.performerHeader, { backgroundColor: away_team.primary_color }]}>
                <Text style={styles.performerTeam}>{away_team.name}</Text>
              </View>
              <View style={styles.performerContent}>
                {awayTopRusher && (
                  <View style={styles.performerStat}>
                    <Text style={styles.performerName}>#{awayTopRusher.jersey} {awayTopRusher.name}</Text>
                    <Text style={styles.performerLine}>{awayTopRusher.carries} CAR, {awayTopRusher.yards} YDS, {awayTopRusher.tds} TD</Text>
                  </View>
                )}
                {awayTopPasser && (
                  <View style={styles.performerStat}>
                    <Text style={styles.performerName}>#{awayTopPasser.jersey} {awayTopPasser.name}</Text>
                    <Text style={styles.performerLine}>{awayTopPasser.completions}/{awayTopPasser.attempts}, {awayTopPasser.yards} YDS, {awayTopPasser.tds} TD</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Full Recap Toggle */}
        <Pressable 
          style={styles.fullRecapToggle}
          onPress={() => setShowFullRecap(!showFullRecap)}
        >
          <Text style={styles.fullRecapToggleText}>
            {showFullRecap ? 'Hide Full Recap' : 'View Full Recap'}
          </Text>
          <Ionicons 
            name={showFullRecap ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={Colors.SURGE} 
          />
        </Pressable>

        {/* Full Recap Section */}
        {showFullRecap && (
          <>
            {/* Quarter Scores */}
            <View style={styles.quarterSection}>
              <Text style={styles.sectionTitle}>Quarter Scores</Text>
              <View style={styles.quarterTable}>
                <View style={styles.quarterHeader}>
                  <View style={styles.quarterTeamCol} />
                  <Text style={styles.quarterLabel}>1</Text>
                  <Text style={styles.quarterLabel}>2</Text>
                  <Text style={styles.quarterLabel}>3</Text>
                  <Text style={styles.quarterLabel}>4</Text>
                  <Text style={[styles.quarterLabel, styles.quarterTotalLabel]}>T</Text>
                </View>
                <View style={styles.quarterRow}>
                  <Text style={[styles.quarterTeamName, { color: home_team.primary_color }]}>{home_team.name}</Text>
                  {quarter_scores.home.map((score, i) => (
                    <Text key={i} style={styles.quarterScore}>{score}</Text>
                  ))}
                  <Text style={[styles.quarterScore, styles.quarterTotalScore]}>{home_team.score}</Text>
                </View>
                <View style={styles.quarterRow}>
                  <Text style={[styles.quarterTeamName, { color: away_team.primary_color }]}>{away_team.name}</Text>
                  {quarter_scores.away.map((score, i) => (
                    <Text key={i} style={styles.quarterScore}>{score}</Text>
                  ))}
                  <Text style={[styles.quarterScore, styles.quarterTotalScore]}>{away_team.score}</Text>
                </View>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                {tabs.map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => setSelectedTab(tab.key)}
                    style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Tab Content */}
            {selectedTab === 'team' && (
              <>
                <View style={styles.statsCard}>
                  <StatRow label="Total Yards" home={team_stats.home.total_yards} away={team_stats.away.total_yards} homeColor={home_team.primary_color} awayColor={away_team.primary_color} />
                  <StatRow label="Passing" home={team_stats.home.passing_yards} away={team_stats.away.passing_yards} homeColor={home_team.primary_color} awayColor={away_team.primary_color} />
                  <StatRow label="Rushing" home={team_stats.home.rushing_yards} away={team_stats.away.rushing_yards} homeColor={home_team.primary_color} awayColor={away_team.primary_color} />
                  <StatRow label="First Downs" home={team_stats.home.first_downs} away={team_stats.away.first_downs} homeColor={home_team.primary_color} awayColor={away_team.primary_color} />
                  <StatRow label="3rd Down" home={team_stats.home.third_down_conv} away={team_stats.away.third_down_conv} homeColor={home_team.primary_color} awayColor={away_team.primary_color} />
                  <StatRow label="Turnovers" home={team_stats.home.turnovers} away={team_stats.away.turnovers} homeColor={home_team.primary_color} awayColor={away_team.primary_color} inverted />
                  <StatRow label="Penalties" home={team_stats.home.penalties} away={team_stats.away.penalties} homeColor={home_team.primary_color} awayColor={away_team.primary_color} />
                  <StatRow label="Time of Poss." home={team_stats.home.time_of_possession} away={team_stats.away.time_of_possession} homeColor={home_team.primary_color} awayColor={away_team.primary_color} isLast />
                </View>

                {/* Scoring Summary */}
                <Text style={styles.sectionTitle}>Scoring Summary</Text>
                {[1, 2, 3, 4].map((quarter) => {
                  const plays = scoring_plays.filter(p => p.quarter === quarter);
                  if (plays.length === 0) return null;
                  return (
                    <View key={quarter} style={styles.quarterPlays}>
                      <Text style={styles.quarterPlayTitle}>
                        {quarter === 1 ? '1ST' : quarter === 2 ? '2ND' : quarter === 3 ? '3RD' : '4TH'} QUARTER
                      </Text>
                      {plays.map((play, idx) => (
                        <View key={idx} style={styles.scoringPlay}>
                          <View style={[styles.playTeamIndicator, { backgroundColor: play.team === home_team.name ? home_team.primary_color : away_team.primary_color }]} />
                          <View style={styles.playContent}>
                            <View style={styles.playHeader}>
                              <Text style={styles.playTeam}>{play.team}</Text>
                              <Text style={styles.playTime}>{play.time}</Text>
                            </View>
                            <Text style={styles.playDesc}>{play.description}</Text>
                            <Text style={styles.playScore}>{home_team.name} {play.home_score} - {away_team.name} {play.away_score}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </>
            )}

            {selectedTab === 'passing' && (
              <>
                <PlayerStatsTable
                  teamName={home_team.name}
                  teamColor={home_team.primary_color}
                  headers={['Player', 'C/A', 'YDS', 'TD', 'INT']}
                  data={passing.home.map(p => [
                    `#${p.jersey} ${p.name}`,
                    `${p.completions}/${p.attempts}`,
                    p.yards,
                    { value: p.tds, highlight: p.tds > 0 ? 'green' : undefined },
                    { value: p.ints, highlight: p.ints > 0 ? 'red' : undefined },
                  ])}
                />
                <PlayerStatsTable
                  teamName={away_team.name}
                  teamColor={away_team.primary_color}
                  headers={['Player', 'C/A', 'YDS', 'TD', 'INT']}
                  data={passing.away.map(p => [
                    `#${p.jersey} ${p.name}`,
                    `${p.completions}/${p.attempts}`,
                    p.yards,
                    { value: p.tds, highlight: p.tds > 0 ? 'green' : undefined },
                    { value: p.ints, highlight: p.ints > 0 ? 'red' : undefined },
                  ])}
                />
              </>
            )}

            {selectedTab === 'rushing' && (
              <>
                <PlayerStatsTable
                  teamName={home_team.name}
                  teamColor={home_team.primary_color}
                  headers={['Player', 'CAR', 'YDS', 'TD', 'AVG']}
                  data={rushing.home.map(p => [
                    `#${p.jersey} ${p.name}`,
                    p.carries,
                    p.yards,
                    { value: p.tds, highlight: p.tds > 0 ? 'green' : undefined },
                    p.avg.toFixed(1),
                  ])}
                />
                <PlayerStatsTable
                  teamName={away_team.name}
                  teamColor={away_team.primary_color}
                  headers={['Player', 'CAR', 'YDS', 'TD', 'AVG']}
                  data={rushing.away.map(p => [
                    `#${p.jersey} ${p.name}`,
                    p.carries,
                    p.yards,
                    { value: p.tds, highlight: p.tds > 0 ? 'green' : undefined },
                    p.avg.toFixed(1),
                  ])}
                />
              </>
            )}

            {selectedTab === 'receiving' && (
              <>
                <PlayerStatsTable
                  teamName={home_team.name}
                  teamColor={home_team.primary_color}
                  headers={['Player', 'REC', 'YDS', 'TD', 'AVG']}
                  data={receiving.home.map(p => [
                    `#${p.jersey} ${p.name}`,
                    p.receptions,
                    p.yards,
                    { value: p.tds, highlight: p.tds > 0 ? 'green' : undefined },
                    p.avg.toFixed(1),
                  ])}
                />
                <PlayerStatsTable
                  teamName={away_team.name}
                  teamColor={away_team.primary_color}
                  headers={['Player', 'REC', 'YDS', 'TD', 'AVG']}
                  data={receiving.away.map(p => [
                    `#${p.jersey} ${p.name}`,
                    p.receptions,
                    p.yards,
                    { value: p.tds, highlight: p.tds > 0 ? 'green' : undefined },
                    p.avg.toFixed(1),
                  ])}
                />
              </>
            )}

            {selectedTab === 'defense' && (
              <>
                <PlayerStatsTable
                  teamName={home_team.name}
                  teamColor={home_team.primary_color}
                  headers={['Player', 'TOT', 'TFL', 'SCK', 'INT']}
                  data={defense.home.map(p => [
                    `#${p.jersey} ${p.name}`,
                    p.tackles,
                    { value: p.tfl, highlight: p.tfl > 0 ? 'green' : undefined },
                    { value: p.sacks, highlight: p.sacks > 0 ? 'green' : undefined },
                    { value: p.ints, highlight: p.ints > 0 ? 'green' : undefined },
                  ])}
                />
                <PlayerStatsTable
                  teamName={away_team.name}
                  teamColor={away_team.primary_color}
                  headers={['Player', 'TOT', 'TFL', 'SCK', 'INT']}
                  data={defense.away.map(p => [
                    `#${p.jersey} ${p.name}`,
                    p.tackles,
                    { value: p.tfl, highlight: p.tfl > 0 ? 'green' : undefined },
                    { value: p.sacks, highlight: p.sacks > 0 ? 'green' : undefined },
                    { value: p.ints, highlight: p.ints > 0 ? 'green' : undefined },
                  ])}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Quick stat component
function QuickStat({ label, home, away, homeColor, awayColor, inverted = false }: {
  label: string;
  home: string | number;
  away: string | number;
  homeColor: string;
  awayColor: string;
  inverted?: boolean;
}) {
  const homeNum = typeof home === 'number' ? home : parseFloat(home.toString()) || 0;
  const awayNum = typeof away === 'number' ? away : parseFloat(away.toString()) || 0;
  const homeWins = inverted ? homeNum < awayNum : homeNum > awayNum;
  const awayWins = inverted ? awayNum < homeNum : awayNum > homeNum;

  return (
    <View style={styles.quickStatItem}>
      <Text style={styles.quickStatLabel}>{label}</Text>
      <View style={styles.quickStatValues}>
        <Text style={[styles.quickStatValue, { color: homeColor }, homeWins && styles.quickStatWinner]}>{home}</Text>
        <Text style={styles.quickStatDivider}>|</Text>
        <Text style={[styles.quickStatValue, { color: awayColor }, awayWins && styles.quickStatWinner]}>{away}</Text>
      </View>
    </View>
  );
}

// Stat comparison row component
function StatRow({ label, home, away, homeColor, awayColor, inverted = false, isLast = false }: { 
  label: string; 
  home: string | number; 
  away: string | number;
  homeColor: string;
  awayColor: string;
  inverted?: boolean;
  isLast?: boolean;
}) {
  const homeNum = typeof home === 'number' ? home : parseFloat(home.toString().split('/')[0]) || 0;
  const awayNum = typeof away === 'number' ? away : parseFloat(away.toString().split('/')[0]) || 0;
  
  const homeWins = inverted ? homeNum < awayNum : homeNum > awayNum;
  const awayWins = inverted ? awayNum < homeNum : awayNum > homeNum;
  
  return (
    <View style={[styles.statRow, isLast && styles.statRowLast]}>
      <Text style={[styles.statValue, { color: homeColor }, homeWins && styles.statValueWinner]}>{home}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: awayColor }, awayWins && styles.statValueWinner]}>{away}</Text>
    </View>
  );
}

// Player stats table component
type CellValue = string | number | { value: string | number; highlight?: 'green' | 'red' };

function PlayerStatsTable({ teamName, teamColor, headers, data }: {
  teamName: string;
  teamColor: string;
  headers: string[];
  data: CellValue[][];
}) {
  return (
    <View style={styles.playerTable}>
      <View style={[styles.playerTableHeader, { backgroundColor: teamColor }]}>
        <Text style={styles.playerTableTeam}>{teamName}</Text>
      </View>
      <View style={styles.playerTableHeaderRow}>
        {headers.map((header, i) => (
          <Text key={i} style={[styles.playerTableHeaderCell, i === 0 && { flex: 2, textAlign: 'left' }]}>
            {header}
          </Text>
        ))}
      </View>
      {data.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.playerTableRow, rowIdx === data.length - 1 && { borderBottomWidth: 0 }]}>
          {row.map((cell, cellIdx) => {
            const isObject = typeof cell === 'object' && cell !== null;
            const value = isObject ? cell.value : cell;
            const highlight = isObject ? cell.highlight : undefined;
            
            return (
              <Text 
                key={cellIdx} 
                style={[
                  styles.playerTableCell, 
                  cellIdx === 0 && { flex: 2, textAlign: 'left' },
                  highlight === 'green' && styles.highlightGreen,
                  highlight === 'red' && styles.highlightRed,
                ]}
                numberOfLines={1}
              >
                {value}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.VOID,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.VOID,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  loadingText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
  },
  errorText: {
    color: Colors.BLAZE,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    textAlign: 'center',
    paddingHorizontal: Spacing.XL,
    marginTop: Spacing.SM,
  },
  retryButton: {
    backgroundColor: Colors.CHARCOAL,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.SM,
    marginTop: Spacing.SM,
  },
  retryButtonText: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingBottom: Spacing.SM,
    backgroundColor: Colors.VOID,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    color: Colors.TEXT_PRIMARY,
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.MD,
    gap: Spacing.MD,
  },

  // Score Card
  scoreCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  finalBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.GRAPHITE,
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: BorderRadius.XS,
    marginBottom: Spacing.MD,
  },
  finalBadgeText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    letterSpacing: 1,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInitial: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
  },
  teamName: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
  },
  teamMascot: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
  },
  scoreCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
  },
  scoreText: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 48,
    fontFamily: 'NeueHaas-Bold',
  },
  scoreDash: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 32,
    fontFamily: 'NeueHaas-Roman',
    marginHorizontal: 8,
  },
  dateText: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
    textAlign: 'center',
    marginTop: Spacing.MD,
  },

  // Quick Stats
  quickStatsCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
  },
  sectionTitle: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: Spacing.MD,
  },
  quickStatsGrid: {
    gap: Spacing.SM,
  },
  quickStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.XS,
  },
  quickStatLabel: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
  },
  quickStatValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  quickStatValue: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    minWidth: 50,
    textAlign: 'center',
  },
  quickStatWinner: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 17,
  },
  quickStatDivider: {
    color: Colors.GRAPHITE,
    fontSize: 14,
  },

  // Top Performers
  performersCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
  },
  performersRow: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  performerBlock: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
    borderRadius: BorderRadius.MD,
    overflow: 'hidden',
  },
  performerHeader: {
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.SM,
  },
  performerTeam: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
  },
  performerContent: {
    padding: Spacing.SM,
    gap: Spacing.SM,
  },
  performerStat: {
    gap: 2,
  },
  performerName: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },
  performerLine: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Roman',
  },

  // Full Recap Toggle
  fullRecapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.XS,
    paddingVertical: Spacing.SM,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAPHITE,
  },
  fullRecapToggleText: {
    color: Colors.SURGE,
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
  },

  // Quarter Section
  quarterSection: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
  },
  quarterTable: {
    gap: 4,
  },
  quarterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  quarterTeamCol: {
    flex: 1,
  },
  quarterLabel: {
    width: 36,
    color: Colors.TEXT_TERTIARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
  },
  quarterTotalLabel: {
    color: Colors.TEXT_SECONDARY,
  },
  quarterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  quarterTeamName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
  },
  quarterScore: {
    width: 36,
    color: Colors.TEXT_SECONDARY,
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    textAlign: 'center',
  },
  quarterTotalScore: {
    color: Colors.TEXT_PRIMARY,
    fontFamily: 'NeueHaas-Bold',
  },

  // Tabs
  tabContainer: {
    marginBottom: Spacing.SM,
  },
  tabScroll: {
    gap: Spacing.XS,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.FULL,
    backgroundColor: Colors.CHARCOAL,
  },
  tabActive: {
    backgroundColor: Colors.SURGE,
  },
  tabText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
  },
  tabTextActive: {
    color: Colors.VOID,
    fontFamily: 'NeueHaas-Bold',
  },

  // Stats Card
  statsCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.MD,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    textAlign: 'center',
  },
  statValueWinner: {
    fontFamily: 'NeueHaas-Bold',
    fontSize: 17,
  },
  statLabel: {
    flex: 1.5,
    color: Colors.TEXT_TERTIARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Scoring Summary
  quarterPlays: {
    gap: Spacing.XS,
    marginTop: Spacing.SM,
  },
  quarterPlayTitle: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoringPlay: {
    flexDirection: 'row',
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.SM,
    overflow: 'hidden',
  },
  playTeamIndicator: {
    width: 4,
  },
  playContent: {
    flex: 1,
    padding: Spacing.SM,
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playTeam: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },
  playTime: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
  },
  playDesc: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 4,
  },
  playScore: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Medium',
  },

  // Player Stats Table
  playerTable: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.MD,
    overflow: 'hidden',
    marginBottom: Spacing.SM,
  },
  playerTableHeader: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
  },
  playerTableTeam: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
  },
  playerTableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.SM,
    backgroundColor: Colors.SHADOW,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  playerTableHeaderCell: {
    flex: 1,
    color: Colors.TEXT_TERTIARY,
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerTableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  playerTableCell: {
    flex: 1,
    color: Colors.TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    textAlign: 'center',
  },
  highlightGreen: {
    color: Colors.SURGE,
    fontFamily: 'NeueHaas-Bold',
  },
  highlightRed: {
    color: Colors.BLAZE,
    fontFamily: 'NeueHaas-Bold',
  },
});
