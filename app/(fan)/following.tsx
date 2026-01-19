import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { getFollowedTeams, toggleTeamFollow } from '@/src/lib/storage';
import { getTeam } from '@/src/lib/api';
import { FollowingIcon } from '@/components/icons/FollowingIcon';

interface FavoriteTeam {
  id: string;
  name: string;
  mascot: string;
  record: string;
  primary_color: string;
}

export default function FollowingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const followedIds = await getFollowedTeams();
      
      if (followedIds.length === 0) {
        setFavoriteTeams([]);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      const teamDataPromises = followedIds.map(async (teamId) => {
        try {
          const teamProfile = await getTeam(teamId);
          return {
            id: teamProfile.id,
            name: teamProfile.name,
            mascot: teamProfile.mascot,
            record: `${teamProfile.wins}-${teamProfile.losses}`,
            primary_color: teamProfile.primary_color || '#FF6600',
          };
        } catch (error) {
          console.error(`Error loading team ${teamId}:`, error);
          return null;
        }
      });

      const teams = (await Promise.all(teamDataPromises)).filter(
        (team): team is FavoriteTeam => team !== null
      );

      setFavoriteTeams(teams);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const removeFavorite = async (teamId: string) => {
    try {
      await toggleTeamFollow(teamId);
      setFavoriteTeams(favoriteTeams.filter((team) => team.id !== teamId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <FollowingIcon size={48} color={Colors.SURGE} filled />
          <Text style={styles.loadingText}>Loading your teams...</Text>
        </View>
      </View>
    );
  }

  if (favoriteTeams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.headerTitle}>Following</Text>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <FollowingIcon size={56} color={Colors.TEXT_TERTIARY} filled={false} />
          </View>
          <Text style={styles.emptyTitle}>No teams followed yet</Text>
          <Text style={styles.emptySubtext}>
            Follow teams to track their games and get updates
          </Text>
          <Pressable 
            style={styles.browseButton} 
            onPress={() => router.push('/(fan)/browse')}
          >
            <Ionicons name="search" size={18} color={Colors.BASALT} />
            <Text style={styles.browseButtonText}>Browse Teams</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.SURGE} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View>
            <Text style={styles.headerTitle}>Following</Text>
            <Text style={styles.headerSubtitle}>
              {favoriteTeams.length} {favoriteTeams.length === 1 ? 'team' : 'teams'}
            </Text>
          </View>
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          {favoriteTeams.map((team) => (
            <Pressable
              key={team.id}
              style={[styles.teamCard, { backgroundColor: team.primary_color }]}
              onPress={() => {
                console.log('[Following] Team card pressed:', team.id, team.name);
                router.push(`/(fan)/team/${team.id}?from=following`);
              }}
            >
              {/* Team Content */}
              <View style={styles.teamContent}>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                  <Text style={styles.teamMascot}>{team.mascot}</Text>
                </View>

                <View style={styles.teamMeta}>
                  <View style={styles.recordBadge}>
                    <Text style={styles.recordText}>{team.record}</Text>
                  </View>

                  <Pressable
                    style={styles.unfollowButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeFavorite(team.id);
                    }}
                    hitSlop={8}
                  >
                    <FollowingIcon size={24} color="#FFFFFF" filled />
                  </Pressable>
                </View>
              </View>

              {/* Chevron */}
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#FFFFFF"
                style={styles.chevron}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  scrollView: {
    flex: 1,
  },
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

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },

  // Teams Container
  teamsContainer: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 0,
  },

  // Team Cards
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.CHARCOAL,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  colorBar: {
    width: 6,
    alignSelf: 'stretch',
  },
  teamContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  teamInfo: {
    flex: 1,
    marginRight: 12,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  teamMascot: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.85,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(243, 243, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 243, 247, 0.3)',
  },
  recordText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unfollowButton: {
    padding: 4,
  },
  chevron: {
    marginRight: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.CHARCOAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: Colors.GRAPHITE,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.BASALT,
  },
});
