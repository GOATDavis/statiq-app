import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

interface SeasonStats {
  games: number;
  // Offensive stats
  rushAttempts?: number;
  rushYards?: number;
  rushTDs?: number;
  receptions?: number;
  recYards?: number;
  recTDs?: number;
  completions?: number;
  attempts?: number;
  passYards?: number;
  passTDs?: number;
  interceptions?: number;
  // Defensive stats
  tackles?: number;
  sacks?: number;
  forcedFumbles?: number;
  interceptionsDef?: number;
}

interface GameLog {
  id: string;
  date: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  stats: string;
}

export default function MyStatsScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'offense' | 'defense'>('offense');

  // Mock data - replace with real API calls
  const [seasonStats, setSeasonStats] = useState<SeasonStats>({
    games: 9,
    rushAttempts: 127,
    rushYards: 892,
    rushTDs: 12,
    receptions: 23,
    recYards: 287,
    recTDs: 3,
  });

  const [gameLog, setGameLog] = useState<GameLog[]>([
    {
      id: '1',
      date: 'Nov 1',
      opponent: 'vs Prestonwood',
      result: 'W',
      score: '35-28',
      stats: '18 carries, 142 yds, 2 TDs',
    },
    {
      id: '2',
      date: 'Oct 25',
      opponent: '@ Bishop Lynch',
      result: 'W',
      score: '42-21',
      stats: '15 carries, 98 yds, 1 TD',
    },
    {
      id: '3',
      date: 'Oct 18',
      opponent: 'vs Parish Episcopal',
      result: 'L',
      score: '28-31',
      stats: '12 carries, 67 yds, 1 TD',
    },
  ]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setTimeout(() => {
      setIsLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b4d836" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b4d836" />
      }
    >
      {/* Player Header */}
      <View style={styles.playerHeader}>
        <View style={styles.jerseyCircle}>
          <Text style={styles.jerseyNumber}>22</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>Marcus Johnson</Text>
          <Text style={styles.playerDetails}>RB • Grade 11 • Trinity Christian</Text>
        </View>
      </View>

      {/* Season Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Season Summary</Text>
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>8-1</Text>
            <Text style={styles.summaryLabel}>Record</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{seasonStats.games}</Text>
            <Text style={styles.summaryLabel}>Games</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {Math.round((seasonStats.rushYards || 0) / seasonStats.games)}
            </Text>
            <Text style={styles.summaryLabel}>Yds/Game</Text>
          </View>
        </View>
      </View>

      {/* Category Selector */}
      <View style={styles.section}>
        <View style={styles.categoryContainer}>
          <Pressable
            style={[
              styles.categoryTab,
              selectedCategory === 'offense' && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory('offense')}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === 'offense' && styles.categoryTabTextActive,
              ]}
            >
              Offense
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.categoryTab,
              selectedCategory === 'defense' && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory('defense')}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === 'defense' && styles.categoryTabTextActive,
              ]}
            >
              Defense
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Season Stats</Text>
        {selectedCategory === 'offense' && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{seasonStats.rushAttempts}</Text>
              <Text style={styles.statLabel}>Carries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{seasonStats.rushYards}</Text>
              <Text style={styles.statLabel}>Rush Yds</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {((seasonStats.rushYards || 0) / (seasonStats.rushAttempts || 1)).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Yds/Carry</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{seasonStats.rushTDs}</Text>
              <Text style={styles.statLabel}>Rush TDs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{seasonStats.receptions}</Text>
              <Text style={styles.statLabel}>Receptions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{seasonStats.recYards}</Text>
              <Text style={styles.statLabel}>Rec Yds</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{seasonStats.recTDs}</Text>
              <Text style={styles.statLabel}>Rec TDs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {seasonStats.rushTDs! + seasonStats.recTDs!}
              </Text>
              <Text style={styles.statLabel}>Total TDs</Text>
            </View>
          </View>
        )}
        {selectedCategory === 'defense' && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No defensive stats</Text>
          </View>
        )}
      </View>

      {/* Game Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {gameLog.map((game) => (
          <View key={game.id} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameDate}>{game.date}</Text>
                <Text style={styles.gameOpponent}>{game.opponent}</Text>
              </View>
              <View style={styles.gameResult}>
                <View
                  style={[
                    styles.resultBadge,
                    game.result === 'W' ? styles.resultBadgeWin : styles.resultBadgeLoss,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultText,
                      game.result === 'W' ? styles.resultTextWin : styles.resultTextLoss,
                    ]}
                  >
                    {game.result}
                  </Text>
                </View>
                <Text style={styles.gameScore}>{game.score}</Text>
              </View>
            </View>
            <Text style={styles.gameStats}>{game.stats}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#2a2a2a',
    marginBottom: 16,
  },
  jerseyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#b4d836',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b4d836',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#b4d836',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  categoryTabTextActive: {
    color: '#000',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  gameCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  gameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  gameResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBadgeWin: {
    backgroundColor: '#b4d836',
  },
  resultBadgeLoss: {
    backgroundColor: '#3a3a3a',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultTextWin: {
    color: '#000',
  },
  resultTextLoss: {
    color: '#666',
  },
  gameScore: {
    fontSize: 14,
    color: '#999',
  },
  gameStats: {
    fontSize: 14,
    color: '#b4d836',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
