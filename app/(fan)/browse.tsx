import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { useTeams } from '@/src/context/AppDataContext';
import { type PowerRanking } from '@/src/lib/api';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from '@/src/lib/recent-searches';
import { SearchIcon } from '@/components/icons/SearchIcon';

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

// Memoized team card component for performance
const TeamCard = React.memo(({ team, onPress }: { team: PowerRanking; onPress: () => void }) => {
  const teamColor = team.primary_color || '#FF6600';
  const textColor = getContrastTextColor(teamColor);
  const isLightBg = textColor === '#1a1a1a';

  return (
    <Pressable
      style={[styles.teamCard, { backgroundColor: teamColor }]}
      onPress={onPress}
    >
      <View style={styles.teamContent}>
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, { color: textColor }]} numberOfLines={1}>
            {team.school_name}
          </Text>
          <Text style={[styles.teamMascot, { color: textColor, opacity: isLightBg ? 0.7 : 0.85 }]}>
            {team.mascot || team.classification}
          </Text>
          {team.city && (
            <Text style={[styles.teamCity, { color: textColor, opacity: isLightBg ? 0.5 : 0.6 }]}>
              {team.city}, TX
            </Text>
          )}
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
});

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teams: allTeams, isLoading, error, refresh } = useTeams();
  const [classifications] = useState<string[]>([
    '6A',
    '5A-D1', '5A-D2',
    '4A-D1', '4A-D2',
    '3A-D1', '3A-D2',
    '2A-D1', '2A-D2',
    '1A-D1', '1A-D2',
    'Non-UIL',
  ]);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const searches = await getRecentSearches();
    setRecentSearches(searches.slice(0, 5));
  };

  const handleClearHistory = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleTeamPress = useCallback(async (team: PowerRanking) => {
    await saveRecentSearch({
      type: 'team',
      id: team.team_id,
      name: team.school_name,
      mascot: team.classification,
    });
    loadRecentSearches();
    router.push(`/(fan)/team/${team.team_id}?from=browse`);
  }, [router]);

  const handleRecentSearchPress = (search: RecentSearch) => {
    if (search.type === 'team') {
      router.push(`/(fan)/team/${search.id}?from=browse`);
    } else {
      router.push(`/player/${search.id}`);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadRecentSearches()]);
    setRefreshing(false);
  }, [refresh]);

  // Filter teams client-side - instant!
  const filteredTeams = useMemo(() => {
    let teams = allTeams;
    
    // Filter by classification
    if (selectedClassification) {
      teams = teams.filter(team => team.classification === selectedClassification);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      teams = teams.filter(team =>
        team.school_name.toLowerCase().includes(query) ||
        (team.mascot && team.mascot.toLowerCase().includes(query)) ||
        (team.city && team.city.toLowerCase().includes(query))
      );
    }
    
    // Sort alphabetically
    return teams.sort((a, b) => a.school_name.localeCompare(b.school_name));
  }, [allTeams, selectedClassification, searchQuery]);

  const showRecentSearches = isSearchFocused && !searchQuery.trim() && recentSearches.length > 0;

  const renderTeamCard = useCallback(({ item }: { item: PowerRanking }) => (
    <TeamCard team={item} onPress={() => handleTeamPress(item)} />
  ), [handleTeamPress]);

  const keyExtractor = useCallback((item: PowerRanking, index: number) => 
    `team-${item.school_id}-${index}`, []);

  const ListHeader = useMemo(() => (
    <>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.TEXT_TERTIARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search teams..."
          placeholderTextColor={Colors.TEXT_TERTIARY}
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
            <Ionicons name="close-circle" size={20} color={Colors.TEXT_TERTIARY} />
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
        {classifications.map((classification) => (
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
                <Ionicons name="time-outline" size={18} color={Colors.TEXT_TERTIARY} />
                <View style={styles.recentContent}>
                  <Text style={styles.recentName}>{search.name}</Text>
                  {search.mascot && (
                    <Text style={styles.recentSubtext}>{search.mascot}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_DISABLED} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </>
  ), [insets.top, filteredTeams.length, searchQuery, selectedClassification, classifications, showRecentSearches, recentSearches, error, refresh]);

  const ListEmpty = useMemo(() => {
    if (error) return null;
    if (!searchQuery.trim()) return null;
    
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <SearchIcon size={40} color={Colors.TEXT_TERTIARY} />
        </View>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtext}>No teams match "{searchQuery}"</Text>
      </View>
    );
  }, [error, searchQuery]);

  if (isLoading && allTeams.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <SearchIcon size={48} color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTeams}
        renderItem={renderTeamCard}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.SURGE}
          />
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 76,
          offset: 76 * index,
          index,
        })}
      />

      {/* Top gradient overlay */}
      <LinearGradient
        colors={[Colors.SHADOW, Colors.SHADOW, 'rgba(26, 26, 26, 0)']}
        locations={[0, insets.top / (insets.top + 20), 1]}
        style={[styles.topGradient, { height: insets.top + 20 }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.CHARCOAL,
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
    fontWeight: '500',
    color: Colors.TEXT_PRIMARY,
  },
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
    backgroundColor: Colors.CHARCOAL,
  },
  filterChipActive: {
    backgroundColor: Colors.SURGE,
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
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.SURGE,
  },
  recentList: {
    marginHorizontal: 20,
    backgroundColor: Colors.CHARCOAL,
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
    borderBottomColor: Colors.GRAPHITE,
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  recentSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    marginTop: 2,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 0,
    marginBottom: 10,
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
    fontWeight: '700',
    marginBottom: 2,
  },
  teamMascot: {
    fontSize: 13,
    fontWeight: '600',
  },
  teamCity: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.CHARCOAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },
  retryButton: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.BASALT,
  },
});
