import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 100;

// Mock data
const MOCK_GAME = {
  home_team: {
    name: 'Joshua',
    mascot: 'Owls',
    score: 42,
    primary_color: '#003366',
    record: '9-2',
  },
  away_team: {
    name: 'Centennial',
    mascot: 'Spartans', 
    score: 28,
    primary_color: '#8B0000',
    record: '7-4',
  },
  date: 'Dec 15, 2025',
  quarter_scores: {
    home: [14, 7, 14, 7],
    away: [7, 14, 0, 7],
  },
  // Win probability over time (0-100 for home team)
  win_probability: [50, 58, 52, 65, 55, 72, 68, 78, 85, 82, 88, 92, 95],
  team_stats: {
    home: {
      total_yards: 425,
      passing_yards: 245,
      rushing_yards: 180,
      first_downs: 24,
      third_down: '8/14',
      turnovers: 1,
      time_of_possession: '32:45',
      penalties: '6-45',
      sacks: 3,
      red_zone: '4/5',
    },
    away: {
      total_yards: 312,
      passing_yards: 198,
      rushing_yards: 114,
      first_downs: 18,
      third_down: '5/12',
      turnovers: 2,
      time_of_possession: '27:15',
      penalties: '8-72',
      sacks: 1,
      red_zone: '3/4',
    },
  },
  player_of_game: {
    name: 'Marcus Williams',
    jersey: 7,
    position: 'QB',
    team: 'Joshua',
    stats: '18/24, 245 YDS, 3 TD',
    highlight: 'Perfect 4th quarter, 2 TD passes in final 6 minutes',
  },
  key_players: {
    home: [
      { name: 'Marcus Williams', jersey: 7, position: 'QB', stat: '245 YDS, 3 TD' },
      { name: 'Deon Jackson', jersey: 22, position: 'RB', stat: '142 YDS, 2 TD' },
      { name: 'Tyler Brooks', jersey: 88, position: 'WR', stat: '98 YDS, 1 TD' },
    ],
    away: [
      { name: 'Jake Martinez', jersey: 12, position: 'QB', stat: '198 YDS, 2 TD' },
      { name: 'DeShawn Harris', jersey: 34, position: 'RB', stat: '78 YDS, 1 TD' },
      { name: 'Marcus Jones', jersey: 5, position: 'WR', stat: '112 YDS, 1 TD' },
    ],
  },
  momentum_plays: [
    { quarter: 1, time: '8:32', description: 'Deon Jackson 45-yd TD run', impact: +15, team: 'home' },
    { quarter: 2, time: '2:15', description: 'Marcus Jones 62-yd TD catch', impact: -12, team: 'away' },
    { quarter: 3, time: '9:45', description: 'Fumble recovery at own 35', impact: +18, team: 'home' },
    { quarter: 4, time: '6:02', description: 'Tyler Brooks 34-yd TD catch', impact: +22, team: 'home' },
  ],
};

export default function FullStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const game = MOCK_GAME;
  const homeWon = game.home_team.score > game.away_team.score;

  // Generate path for win probability chart
  const generateWinProbPath = () => {
    const points = game.win_probability;
    const stepX = CHART_WIDTH / (points.length - 1);
    
    let path = `M 0 ${CHART_HEIGHT - (points[0] / 100) * CHART_HEIGHT}`;
    
    for (let i = 1; i < points.length; i++) {
      const x = i * stepX;
      const y = CHART_HEIGHT - (points[i] / 100) * CHART_HEIGHT;
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };

  // Generate fill path (area under curve)
  const generateFillPath = () => {
    const points = game.win_probability;
    const stepX = CHART_WIDTH / (points.length - 1);
    
    let path = `M 0 ${CHART_HEIGHT}`;
    path += ` L 0 ${CHART_HEIGHT - (points[0] / 100) * CHART_HEIGHT}`;
    
    for (let i = 1; i < points.length; i++) {
      const x = i * stepX;
      const y = CHART_HEIGHT - (points[i] / 100) * CHART_HEIGHT;
      path += ` L ${x} ${y}`;
    }
    
    path += ` L ${CHART_WIDTH} ${CHART_HEIGHT} Z`;
    
    return path;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.headerTitle}>Full Stats</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero Score Section */}
      <LinearGradient
        colors={[game.home_team.primary_color, Colors.BASALT, Colors.BASALT, game.away_team.primary_color]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.08, 0.92, 1]}
        style={styles.heroGradient}
      >
        <View style={styles.heroTeam}>
          <Text style={styles.heroTeamName}>{game.home_team.name.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{game.home_team.record}</Text>
          {homeWon && <Ionicons name="checkmark-circle" size={18} color={Colors.SURGE} style={{ marginTop: 4 }} />}
        </View>

        <View style={styles.heroCenter}>
          <Text style={styles.finalLabel}>FINAL</Text>
          <Text style={styles.heroScore}>
            {game.home_team.score} - {game.away_team.score}
          </Text>
          <Text style={styles.heroDate}>{game.date}</Text>
        </View>

        <View style={styles.heroTeam}>
          <Text style={styles.heroTeamName}>{game.away_team.name.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{game.away_team.record}</Text>
          {!homeWon && <Ionicons name="checkmark-circle" size={18} color={Colors.SURGE} style={{ marginTop: 4 }} />}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scoring by Quarter */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scoring by Quarter</Text>
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
              <View style={styles.quarterTeamCol}>
                <View style={[styles.teamDot, { backgroundColor: game.home_team.primary_color }]} />
                <Text style={styles.quarterTeamName}>{game.home_team.name}</Text>
              </View>
              {game.quarter_scores.home.map((score, i) => (
                <Text key={i} style={styles.quarterScore}>{score}</Text>
              ))}
              <Text style={[styles.quarterScore, styles.quarterTotalScore]}>{game.home_team.score}</Text>
            </View>
            <View style={styles.quarterRow}>
              <View style={styles.quarterTeamCol}>
                <View style={[styles.teamDot, { backgroundColor: game.away_team.primary_color }]} />
                <Text style={styles.quarterTeamName}>{game.away_team.name}</Text>
              </View>
              {game.quarter_scores.away.map((score, i) => (
                <Text key={i} style={styles.quarterScore}>{score}</Text>
              ))}
              <Text style={[styles.quarterScore, styles.quarterTotalScore]}>{game.away_team.score}</Text>
            </View>
          </View>
        </View>

        {/* Win Probability Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Win Probability</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: game.home_team.primary_color }]} />
              <Text style={styles.legendText}>{game.home_team.name}</Text>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>100%</Text>
              <Text style={styles.chartLabel}>50%</Text>
              <Text style={styles.chartLabel}>0%</Text>
            </View>
            
            <View style={styles.chartSvgWrapper}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
                <Defs>
                  <SvgLinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={game.home_team.primary_color} stopOpacity="0.4" />
                    <Stop offset="1" stopColor={game.home_team.primary_color} stopOpacity="0.05" />
                  </SvgLinearGradient>
                </Defs>
                
                {/* 50% line */}
                <Line
                  x1={0}
                  y1={CHART_HEIGHT / 2}
                  x2={CHART_WIDTH}
                  y2={CHART_HEIGHT / 2}
                  stroke={Colors.GRAPHITE}
                  strokeDasharray="4,4"
                />
                
                {/* Quarter markers */}
                {[0.25, 0.5, 0.75].map((pos, i) => (
                  <Line
                    key={i}
                    x1={CHART_WIDTH * pos}
                    y1={0}
                    x2={CHART_WIDTH * pos}
                    y2={CHART_HEIGHT}
                    stroke={Colors.GRAPHITE}
                    strokeWidth={1}
                  />
                ))}
                
                {/* Fill area */}
                <Path
                  d={generateFillPath()}
                  fill="url(#fillGradient)"
                />
                
                {/* Line */}
                <Path
                  d={generateWinProbPath()}
                  stroke={game.home_team.primary_color}
                  strokeWidth={2.5}
                  fill="none"
                />
                
                {/* End point */}
                <Circle
                  cx={CHART_WIDTH}
                  cy={CHART_HEIGHT - (game.win_probability[game.win_probability.length - 1] / 100) * CHART_HEIGHT}
                  r={5}
                  fill={game.home_team.primary_color}
                />
                
                {/* Quarter labels */}
                <SvgText x={CHART_WIDTH * 0.125} y={CHART_HEIGHT + 14} fill={Colors.TEXT_TERTIARY} fontSize={10} textAnchor="middle">Q1</SvgText>
                <SvgText x={CHART_WIDTH * 0.375} y={CHART_HEIGHT + 14} fill={Colors.TEXT_TERTIARY} fontSize={10} textAnchor="middle">Q2</SvgText>
                <SvgText x={CHART_WIDTH * 0.625} y={CHART_HEIGHT + 14} fill={Colors.TEXT_TERTIARY} fontSize={10} textAnchor="middle">Q3</SvgText>
                <SvgText x={CHART_WIDTH * 0.875} y={CHART_HEIGHT + 14} fill={Colors.TEXT_TERTIARY} fontSize={10} textAnchor="middle">Q4</SvgText>
              </Svg>
            </View>
          </View>
          
          <View style={styles.winProbResult}>
            <Text style={styles.winProbPercent}>{game.win_probability[game.win_probability.length - 1]}%</Text>
            <Text style={styles.winProbText}>Final win probability</Text>
          </View>
        </View>

        {/* StatIQ Player of the Game */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>StatIQ Player of the Game</Text>
          
          <LinearGradient
            colors={[game.home_team.primary_color, `${game.home_team.primary_color}90`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.potgCard}
          >
            <View style={styles.potgContent}>
              <View style={styles.potgJersey}>
                <Text style={styles.potgJerseyNum}>#{game.player_of_game.jersey}</Text>
              </View>
              
              <View style={styles.potgInfo}>
                <Text style={styles.potgName}>{game.player_of_game.name}</Text>
                <Text style={styles.potgPosition}>{game.player_of_game.position} • {game.player_of_game.team}</Text>
                <Text style={styles.potgStats}>{game.player_of_game.stats}</Text>
                <Text style={styles.potgHighlight}>{game.player_of_game.highlight}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Team Comparison */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Team Comparison</Text>
          
          <View style={styles.teamHeaders}>
            <View style={styles.teamHeaderLeft}>
              <View style={[styles.teamDot, { backgroundColor: game.home_team.primary_color }]} />
              <Text style={styles.teamHeaderName}>{game.home_team.name}</Text>
            </View>
            <View style={styles.teamHeaderRight}>
              <Text style={styles.teamHeaderName}>{game.away_team.name}</Text>
              <View style={[styles.teamDot, { backgroundColor: game.away_team.primary_color }]} />
            </View>
          </View>
          
          <StatCompareRow
            label="Total Yards"
            home={game.team_stats.home.total_yards}
            away={game.team_stats.away.total_yards}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
          />
          <StatCompareRow
            label="Passing"
            home={game.team_stats.home.passing_yards}
            away={game.team_stats.away.passing_yards}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
          />
          <StatCompareRow
            label="Rushing"
            home={game.team_stats.home.rushing_yards}
            away={game.team_stats.away.rushing_yards}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
          />
          <StatCompareRow
            label="First Downs"
            home={game.team_stats.home.first_downs}
            away={game.team_stats.away.first_downs}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
          />
          <StatCompareRow
            label="3rd Down"
            home={game.team_stats.home.third_down}
            away={game.team_stats.away.third_down}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
            isRatio
          />
          <StatCompareRow
            label="Red Zone"
            home={game.team_stats.home.red_zone}
            away={game.team_stats.away.red_zone}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
            isRatio
          />
          <StatCompareRow
            label="Turnovers"
            home={game.team_stats.home.turnovers}
            away={game.team_stats.away.turnovers}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
            inverted
          />
          <StatCompareRow
            label="Sacks"
            home={game.team_stats.home.sacks}
            away={game.team_stats.away.sacks}
            homeColor={game.home_team.primary_color}
            awayColor={game.away_team.primary_color}
            isLast
          />
        </View>

        {/* Key Momentum Plays */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Key Momentum Plays</Text>
          
          {game.momentum_plays.map((play, idx) => (
            <View key={idx} style={[styles.momentumPlay, idx === game.momentum_plays.length - 1 && styles.momentumPlayLast]}>
              <View style={[
                styles.momentumIndicator,
                { backgroundColor: play.team === 'home' ? game.home_team.primary_color : game.away_team.primary_color }
              ]} />
              
              <View style={styles.momentumContent}>
                <View style={styles.momentumHeader}>
                  <Text style={styles.momentumQuarter}>Q{play.quarter} • {play.time}</Text>
                  <View style={[
                    styles.impactBadge,
                    { backgroundColor: play.impact > 0 ? `${Colors.SURGE}20` : `${Colors.BLAZE}20` }
                  ]}>
                    <Ionicons 
                      name={play.impact > 0 ? 'trending-up' : 'trending-down'} 
                      size={12} 
                      color={play.impact > 0 ? Colors.SURGE : Colors.BLAZE} 
                    />
                    <Text style={[
                      styles.impactText,
                      { color: play.impact > 0 ? Colors.SURGE : Colors.BLAZE }
                    ]}>
                      {play.impact > 0 ? '+' : ''}{play.impact}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.momentumDesc}>{play.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stat Leaders */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Stat Leaders</Text>
          
          {/* Home Team Leaders */}
          <View style={[styles.leadersSection, { borderLeftColor: game.home_team.primary_color }]}>
            <Text style={[styles.leadersTeamName, { color: game.home_team.primary_color }]}>{game.home_team.name}</Text>
            {game.key_players.home.map((player, idx) => (
              <View key={idx} style={styles.leaderRow}>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>#{player.jersey} {player.name}</Text>
                  <Text style={styles.leaderPos}>{player.position}</Text>
                </View>
                <Text style={styles.leaderStat}>{player.stat}</Text>
              </View>
            ))}
          </View>
          
          {/* Away Team Leaders */}
          <View style={[styles.leadersSection, { borderLeftColor: game.away_team.primary_color }]}>
            <Text style={[styles.leadersTeamName, { color: game.away_team.primary_color }]}>{game.away_team.name}</Text>
            {game.key_players.away.map((player, idx) => (
              <View key={idx} style={styles.leaderRow}>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>#{player.jersey} {player.name}</Text>
                  <Text style={styles.leaderPos}>{player.position}</Text>
                </View>
                <Text style={styles.leaderStat}>{player.stat}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Stat comparison row with visual bar
function StatCompareRow({ 
  label, 
  home, 
  away, 
  homeColor, 
  awayColor, 
  inverted = false,
  isRatio = false,
  isLast = false,
}: { 
  label: string; 
  home: number | string; 
  away: number | string; 
  homeColor: string; 
  awayColor: string;
  inverted?: boolean;
  isRatio?: boolean;
  isLast?: boolean;
}) {
  let homeNum: number, awayNum: number;
  
  if (isRatio && typeof home === 'string') {
    const [made, att] = home.split('/').map(Number);
    homeNum = att > 0 ? (made / att) * 100 : 0;
    const [aMade, aAtt] = (away as string).split('/').map(Number);
    awayNum = aAtt > 0 ? (aMade / aAtt) * 100 : 0;
  } else {
    homeNum = typeof home === 'number' ? home : parseFloat(home) || 0;
    awayNum = typeof away === 'number' ? away : parseFloat(away) || 0;
  }
  
  const total = homeNum + awayNum || 1;
  const homePercent = (homeNum / total) * 100;
  const awayPercent = (awayNum / total) * 100;
  
  const homeWins = inverted ? homeNum < awayNum : homeNum > awayNum;
  const awayWins = inverted ? awayNum < homeNum : awayNum > homeNum;

  return (
    <View style={[styles.statRow, isLast && styles.statRowLast]}>
      <Text style={[styles.statValue, homeWins && styles.statValueWinner]}>{home}</Text>
      
      <View style={styles.statCenter}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statBarContainer}>
          <View style={[styles.statBarLeft, { width: `${homePercent}%`, backgroundColor: homeColor }]} />
          <View style={[styles.statBarRight, { width: `${awayPercent}%`, backgroundColor: awayColor }]} />
        </View>
      </View>
      
      <Text style={[styles.statValue, awayWins && styles.statValueWinner]}>{away}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.VOID,
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
  
  // Hero Section
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: Spacing.MD,
  },
  heroTeam: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
    maxWidth: 100,
  },
  heroTeamName: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 15,
  },
  heroRecord: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.TEXT_SECONDARY,
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    gap: 4,
  },
  finalLabel: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.TEXT_TERTIARY,
    letterSpacing: 1.5,
  },
  heroScore: {
    fontSize: 36,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.TEXT_PRIMARY,
  },
  heroDate: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.TEXT_TERTIARY,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.MD,
    gap: Spacing.SM,
  },

  // Card
  card: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: Spacing.MD,
  },

  // Quarter Table
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quarterTeamName: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.TEXT_PRIMARY,
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

  // Chart
  chartContainer: {
    flexDirection: 'row',
    marginTop: Spacing.SM,
  },
  chartLabels: {
    width: 32,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  chartLabel: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 9,
    fontFamily: 'NeueHaas-Medium',
  },
  chartSvgWrapper: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
  },
  winProbResult: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: Spacing.MD,
    gap: 8,
  },
  winProbPercent: {
    color: Colors.SURGE,
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
  },
  winProbText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
  },

  // Player of the Game
  potgCard: {
    borderRadius: BorderRadius.MD,
    overflow: 'hidden',
  },
  potgContent: {
    flexDirection: 'row',
    padding: Spacing.MD,
    gap: Spacing.MD,
    alignItems: 'center',
  },
  potgJersey: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  potgJerseyNum: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
  },
  potgInfo: {
    flex: 1,
    gap: 2,
  },
  potgName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
  },
  potgPosition: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
  },
  potgStats: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    marginTop: 4,
  },
  potgHighlight: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    marginTop: 2,
    lineHeight: 16,
  },

  // Team Comparison
  teamHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
    marginTop: -Spacing.XS,
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamHeaderName: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statValue: {
    width: 50,
    color: Colors.TEXT_SECONDARY,
    fontSize: 15,
    fontFamily: 'NeueHaas-Medium',
    textAlign: 'center',
  },
  statValueWinner: {
    color: Colors.TEXT_PRIMARY,
    fontFamily: 'NeueHaas-Bold',
  },
  statCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statBarContainer: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.GRAPHITE,
  },
  statBarLeft: {
    height: '100%',
  },
  statBarRight: {
    height: '100%',
  },

  // Momentum Plays
  momentumPlay: {
    flexDirection: 'row',
    paddingBottom: Spacing.SM,
    marginBottom: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  momentumPlayLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  momentumIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.SM,
  },
  momentumContent: {
    flex: 1,
  },
  momentumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  momentumQuarter: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  impactText: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
  },
  momentumDesc: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
  },

  // Stat Leaders
  leadersSection: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  leadersTeamName: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: Spacing.SM,
  },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaderName: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },
  leaderPos: {
    color: Colors.TEXT_TERTIARY,
    fontSize: 11,
    fontFamily: 'NeueHaas-Medium',
  },
  leaderStat: {
    color: Colors.SURGE,
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
  },
});
