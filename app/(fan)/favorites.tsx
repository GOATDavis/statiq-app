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
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

interface FavoriteTeam {
  id: string;
  name: string;
  mascot: string;
  record: string;
  nextGame?: {
    opponent: string;
    date: string;
    time: string;
  };
  lastGame?: {
    opponent: string;
    score: string;
    result: 'W' | 'L';
  };
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setTimeout(() => {
      const mockFavorites: FavoriteTeam[] = [
        {
          id: '1',
          name: 'Trinity Christian',
          mascot: 'Eagles',
          record: '8-1',
          nextGame: {
            opponent: 'vs Parish Episcopal',
            date: 'Friday, Nov 8',
            time: '7:00 PM',
          },
          lastGame: {
            opponent: 'Prestonwood',
            score: '35-28',
            result: 'W',
          },
        },
        {
          id: '2',
          name: 'Highland Park',
          mascot: 'Scots',
          record: '9-0',
          nextGame: {
            opponent: '@ Lovejoy',
            date: 'Friday, Nov 8',
            time: '7:30 PM',
          },
          lastGame: {
            opponent: 'Royse City',
            score: '42-21',
            result: 'W',
          },
        },
      ];
      setFavoriteTeams(mockFavorites);
      setIsLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const removeFavorite = (teamId: string) => {
    setFavoriteTeams(favoriteTeams.filter((team) => team.id !== teamId));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b4d836" />
      </View>
    );
  }

  if (favoriteTeams.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="star-outline" size={64} color="#666" />
        <Text style={styles.emptyText}>No favorite teams yet</Text>
        <Text style={styles.emptySubtext}>Browse teams to add your favorites</Text>
        <Pressable style={styles.browseButton} onPress={() => router.push('/(fan)/browse')}>
          <Text style={styles.browseButtonText}>Browse Teams</Text>
        </Pressable>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Teams</Text>
        <Text style={styles.headerSubtitle}>{favoriteTeams.length} team{favoriteTeams.length !== 1 ? 's' : ''}</Text>
      </View>

      {favoriteTeams.map((team) => (
        <View key={team.id} style={styles.teamCard}>
          {/* Team Header */}
          <Pressable
            style={styles.teamHeader}
            onPress={() => router.push(`/team/${team.id}`)}
          >
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamMascot}>{team.mascot}</Text>
            </View>
            <View style={styles.teamActions}>
              <View style={styles.recordBadge}>
                <Text style={styles.recordText}>{team.record}</Text>
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeFavorite(team.id)}
              >
                <Ionicons name="star" size={20} color="#b4d836" />
              </Pressable>
            </View>
          </Pressable>

          {/* Last Game */}
          {team.lastGame && (
            <View style={styles.gameSection}>
              <Text style={styles.gameSectionLabel}>Last Game</Text>
              <View style={styles.lastGameInfo}>
                <View
                  style={[
                    styles.resultBadge,
                    team.lastGame.result === 'W'
                      ? styles.resultBadgeWin
                      : styles.resultBadgeLoss,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultText,
                      team.lastGame.result === 'W'
                        ? styles.resultTextWin
                        : styles.resultTextLoss,
                    ]}
                  >
                    {team.lastGame.result}
                  </Text>
                </View>
                <Text style={styles.lastGameText}>
                  {team.lastGame.score} vs {team.lastGame.opponent}
                </Text>
              </View>
            </View>
          )}

          {/* Next Game */}
          {team.nextGame && (
            <View style={styles.gameSection}>
              <Text style={styles.gameSectionLabel}>Next Game</Text>
              <Text style={styles.nextGameOpponent}>{team.nextGame.opponent}</Text>
              <Text style={styles.nextGameTime}>
                {team.nextGame.date} • {team.nextGame.time}
              </Text>
              <Pressable style={styles.notifyButton}>
                <Ionicons name="notifications-outline" size={16} color="#b4d836" />
                <Text style={styles.notifyButtonText}>Notify Me</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
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
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  teamCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamMascot: {
    fontSize: 14,
    color: '#b4d836',
    fontWeight: '600',
  },
  teamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recordText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b4d836',
  },
  removeButton: {
    padding: 4,
  },
  gameSection: {
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    paddingTop: 12,
    marginTop: 12,
  },
  gameSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  lastGameInfo: {
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
  lastGameText: {
    fontSize: 14,
    color: '#fff',
  },
  nextGameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  nextGameTime: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  notifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b4d836',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#b4d836',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
