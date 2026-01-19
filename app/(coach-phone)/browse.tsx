import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';
import {
  getPowerRankings,
  type PowerRanking,
} from '@/src/lib/api';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from '@/src/lib/recent-searches';

const SURGE = '#B4D836';

// Helper function to determine if text should be dark or light based on background
const getContrastTextColor = (hexColor: string): string => {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? '#1a1a1a' : '#FFFFFF';
};

const CLASSIFICATIONS = [
  '6A',
  '5A-D1', '5A-D2',
  '4A-D1', '4A-D2',
  '3A-D1', '3A-D2',
  '2A-D1', '2A-D2',
  '1A-D1', '1A-D2',
];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [teams, setTeams] = useState<PowerRanking[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    loadRecentSearches();
    loadTeams();
  }, []);

  useEffect(() => {
    loadTeams();
  }, [selectedClassification]);

  const loadRecentSearches = async () => {
    const searches = await getRecentSearches();
    setRecentSearches(searches.slice(0, 5));
  };

  const handleClearHistory = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleTeamPress = async (team: PowerRanking) => {
    await saveRecentSearch({
      type: 'team',
      id: team.team_id,
      name: team.school_name,
      mascot: team.mascot || team.classification,
    });
    loadRecentSearches();
    router.push(`/(coach-phone)/team/${team.team_id}?from=browse`);
  };

  const handleRecentSearchPress = (search: RecentSearch) => {
    if (search.type === 'team') {
      router.push(`/(coach-phone)/team/${search.id}?from=browse`);
    }
  };

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPowerRankings({
        classification: selectedClassification || undefined,
        season: '2025',
      });
      setTeams(data);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTeams(), loadRecentSearches()]);
    setRefreshing(false);
  }, [selectedClassification]);

  const filteredTeams = (searchQuery.trim()
    ? teams.filter((team) =>
        team.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.mascot && team.mascot.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : teams
  ).sort((a, b) => a.school_name.localeCompare(b.school_name));

  const showRecentSearches = isSearchFocused && !searchQuery.trim() && recentSearches.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SURGE}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Browse</Text>
          <Text style={styles.headerSubtitle}>
            Find teams, view stats & schedules
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>

        {/* Classification Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScroll}
        >
          <Pressable
            style={[styles.filterChip, !selectedClassification && styles.filterChipActive]}
            onPress={() => setSelectedClassification(null)}
          >
            <Text style={[styles.filterText, !selectedClassification && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {CLASSIFICATIONS.map((classification) => (
            <Pressable
              key={classification}
              style={[
                styles.filterChip,
                selectedClassification === classification && styles.filterChipActive,
              ]}
              onPress={() => setSelectedClassification(classification)}
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

        {/* Recent Searches */}
        {showRecentSearches && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <Pressable onPress={handleClearHistory} hitSlop={8}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>
            <View style={styles.recentList}>
              {recentSearches.map((search, index) => (
                <Pressable
                  key={`${search.id}-${index}`}
                  style={[
                    styles.recentItem,
                    index === recentSearches.length - 1 && styles.recentItemLast,
                  ]}
                  onPress={() => handleRecentSearchPress(search)}
                >
                  <Ionicons name="time-outline" size={18} color="#666" />
                  <View style={styles.recentContent}>
                    <Text style={styles.recentName}>{search.name}</Text>
                    {search.mascot && (
                      <Text style={styles.recentSubtext}>{search.mascot}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#444" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Loading State */}
        {isLoading && teams.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SURGE} />
            <Text style={styles.loadingText}>Loading teams...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadTeams}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredTeams.length > 0 ? (
          <View style={styles.teamsSection}>
            {filteredTeams.map((team) => {
              const teamColor = team.primary_color || '#FF6600';
              const textColor = getContrastTextColor(teamColor);
              const isLightBg = textColor === '#1a1a1a';
              
              return (
                <Pressable
                  key={team.team_id || `school-${team.school_id}`}
                  style={[styles.teamCard, { backgroundColor: teamColor }]}
                  onPress={() => handleTeamPress(team)}
                >
                  <View style={styles.teamContent}>
                    <View style={styles.teamInfo}>
                      <Text style={[styles.teamName, { color: textColor }]} numberOfLines={1}>
                        {team.school_name}
                      </Text>
                      <Text style={[styles.teamMascot, { color: textColor, opacity: isLightBg ? 0.7 : 0.85 }]}>
                        {team.mascot || team.classification}
                      </Text>
                    </View>

                    <View style={styles.teamMeta}>
                      <View style={[
                        styles.recordBadge,
                        { 
                          backgroundColor: isLightBg ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                          borderColor: isLightBg ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
                        }
                      ]}>
                        <Text style={[styles.recordText, { color: textColor }]}>{team.record}</Text>
                      </View>
                      <Ionicons 
                        name="chevron-forward" 
                        size={18} 
                        color={textColor}
                        style={{ opacity: 0.7 }}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#444" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtext}>No teams match "{searchQuery}"</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="american-football-outline" size={48} color="#444" />
            <Text style={styles.emptyTitle}>No teams available</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },

  // Filters
  filterScroll: {
    marginBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  filterChipActive: {
    backgroundColor: SURGE,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#888',
  },
  filterTextActive: {
    color: '#000',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  clearText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: SURGE,
  },

  // Recent Searches
  recentList: {
    marginHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  recentSubtext: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
    marginTop: 2,
  },

  // Teams Section
  teamsSection: {
    gap: 10,
    paddingHorizontal: 0,
  },

  // Team Card
  teamCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  teamContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  teamInfo: {
    flex: 1,
    marginRight: 12,
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 2,
  },
  teamMascot: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  recordText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
    textAlign: 'center',
  },

  // Error State
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
  },
  retryButton: {
    backgroundColor: SURGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Bold',
    color: '#000',
  },
});
