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
import { Colors } from '@/src/constants/design';
import { getScores, getTeam } from '@/src/lib/api';

export default function CoachLiveGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState<any>(null);
  const [homeTeamData, setHomeTeamData] = useState<any>(null);
  const [awayTeamData, setAwayTeamData] = useState<any>(null);

  useEffect(() => {
    loadGameData();
  }, [id]);

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      const scores = await getScores();
      const game = scores.live_games.find(g => g.id === id);

      if (!game) {
        console.error('Live game not found:', id);
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
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game data:', error);
      setIsLoading(false);
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

  const homeColor = gameData.home_primary_color || '#DC143C';
  const awayColor = gameData.away_primary_color || '#FF6B35';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.navigate('/(coach-phone)/scores')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </Pressable>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Hero */}
      <LinearGradient
        colors={[homeColor, Colors.BASALT, Colors.BASALT, awayColor]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.05, 0.95, 1]}
        style={styles.heroGradient}
      >
        <View style={styles.heroTeam}>
          <Text style={styles.heroTeamName}>{gameData.home_team_name?.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{getTeamRecord(homeTeamData, gameData.home_record)}</Text>
        </View>

        <View style={styles.heroCenter}>
          <Text style={styles.heroScore}>
            {gameData.home_score || 0} - {gameData.away_score || 0}
          </Text>
          <Text style={styles.heroQuarter}>{gameData.quarter || 'Q1'} • {gameData.time_remaining || '12:00'}</Text>
        </View>

        <View style={styles.heroTeam}>
          <Text style={styles.heroTeamName}>{gameData.away_team_name?.toUpperCase()}</Text>
          <Text style={styles.heroRecord}>{getTeamRecord(awayTeamData, gameData.away_record)}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.comingSoonContainer}>
            <Ionicons name="football-outline" size={64} color="#666" />
            <Text style={styles.comingSoonTitle}>Live Game Stats</Text>
            <Text style={styles.comingSoonText}>Live statistics will appear here during the game</Text>
          </View>
        </View>
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 54, 54, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.BLAZE,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.BLAZE,
    letterSpacing: 0.5,
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
    maxWidth: 100,
  },
  heroTeamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },
  heroRecord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.85,
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  heroScore: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  heroQuarter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.75,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});
