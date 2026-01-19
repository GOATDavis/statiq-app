import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Animated,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getScores } from '@/src/lib/api';
import { getFollowedTeams } from '@/src/lib/storage';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';
import type { LiveGame, FinishedGame, UpcomingGame, Classification } from '@/src/lib/types/game';
import { FootballIcon } from '@/components/icons/FootballIcon';
import {
  LiveGameCard,
  FinishedGameCard,
  UpcomingGameCard,
  DateHeader,
  DateSection,
} from '@/components/fan/GameCards';
import { Rankings } from '@/components/fan/Rankings';
import { LargeBlockAd, SmallBannerAd } from '@/components/ads';

type ViewMode = 'live' | 'weekend' | 'weekday' | 'playoff';
type TabMode = 'scores' | 'rankings';

const CLASSIFICATIONS: Classification[] = ['6A', '5A-D1', '5A-D2', '4A-D1', '4A-D2', '3A-D1', '3A-D2', '2A-D1', '2A-D2', '1A-D1'];
const PLAYOFF_CLASSIFICATIONS: Classification[] = ['6A-D1', '6A-D2', '5A-D1', '5A-D2', '4A-D1', '4A-D2', '3A-D1', '3A-D2', '2A-D1', '2A-D2', '1A-D1'];

export default function ScoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabMode>('scores');
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [finishedGames, setFinishedGames] = useState<FinishedGame[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [followedTeamIds, setFollowedTeamIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<Classification | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Key to force re-render of game cards
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Refresh game cards when screen comes into focus (e.g., after voting)
  useFocusEffect(
    useCallback(() => {
      // Increment refresh key to force game cards to re-check votes
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    if (autoRefreshEnabled && viewMode === 'live') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulse.start();
      return () => pulse.stop();
    }
  }, [autoRefreshEnabled, viewMode]);

  const viewMode = useMemo((): ViewMode => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const month = now.getMonth();

    const isPlayoffSeason = month >= 10 && month <= 11;
    const mode = isPlayoffSeason ? 'playoff' :
                 (day === 5 && hour >= 17 && hour <= 23) ? 'live' :
                 day === 6 ? 'weekend' : 'weekday';

    console.log('[Scores] viewMode:', mode, '| month:', month, '| isPlayoffSeason:', isPlayoffSeason);
    return mode;
  }, []);

  const loadFollowedTeams = useCallback(async () => {
    try {
      const teams = await getFollowedTeams();
      setFollowedTeamIds(new Set(teams));
    } catch (err) {
      console.error('Error loading followed teams:', err);
    }
  }, []);

  // Helper function to deduplicate games by ID
  const deduplicateGames = <T extends { id: string }>(games: T[]): T[] => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const result = games.filter(game => {
      if (seen.has(game.id)) {
        duplicates.push(game.id);
        return false;
      }
      seen.add(game.id);
      return true;
    });

    if (duplicates.length > 0) {
      console.log(`[DEDUP] Removed ${duplicates.length} duplicate games:`, duplicates);
    }
    console.log(`[DEDUP] Input: ${games.length}, Output: ${result.length}`);
    return result;
  };

  const loadGames = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const data = await getScores({
        classification: selectedClassification || undefined,
      });

      console.log('[API] Live games count:', data.live_games.length);
      console.log('[API] Finished games count:', data.finished_games.length);
      console.log('[API] Upcoming games count:', data.upcoming_games.length);

      // Log upcoming game IDs and matchups to debug duplicates
      if (data.upcoming_games.length > 0) {
        console.log('[API] Upcoming games:', data.upcoming_games.map(g => ({
          id: g.id,
          matchup: `${g.away_team_name} @ ${g.home_team_name}`,
          date: g.date
        })));
      }

      // Deduplicate games by ID before setting state
      const deduplicatedLiveGames = deduplicateGames(data.live_games);

      setLiveGames(deduplicatedLiveGames);
      setFinishedGames(deduplicateGames(data.finished_games));
      setUpcomingGames(deduplicateGames(data.upcoming_games));
      setAutoRefreshEnabled(data.live_games.length > 0);
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Failed to load games. Please try again.');
      Alert.alert('Error', 'Failed to load games. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedClassification]);

  useEffect(() => {
    loadFollowedTeams();
    loadGames();
  }, [loadFollowedTeams, loadGames]);

  // Debug: Log available game fields
  useEffect(() => {
    if (upcomingGames.length > 0) {
      console.log('[DEBUG] Game fields available:', Object.keys(upcomingGames[0]));
      console.log('[DEBUG] First game sample:', upcomingGames[0]);
    }
  }, [upcomingGames]);

  useEffect(() => {
    if (autoRefreshEnabled && viewMode === 'live') {
      const interval = setInterval(() => {
        loadGames(false);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, viewMode, loadGames]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFollowedTeams();
    loadGames(false);
  };

  const handleClassificationFilter = (classification: Classification) => {
    if (selectedClassification === classification) {
      setSelectedClassification(null);
    } else {
      setSelectedClassification(classification);
    }
  };

  const isGameFollowed = useCallback((game: LiveGame | FinishedGame | UpcomingGame) => {
    return followedTeamIds.has(game.home_team_id) || followedTeamIds.has(game.away_team_id);
  }, [followedTeamIds]);

  // Helper function to group games by date
  const groupGamesByDate = <T extends { kickoff_at?: string; date?: string; started_at?: string }>(games: T[]) => {
    const groups: { date: string; games: T[] }[] = [];
    const groupMap = new Map<string, { sortDate: Date; games: T[] }>();

    games.forEach(game => {
      // Get date from game (try multiple fields)
      const dateStr = game.kickoff_at || game.date || game.started_at;
      if (!dateStr) return;

      // Parse date in local timezone to avoid UTC issues
      let date: Date;
      if (game.date && game.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For YYYY-MM-DD format, parse in local timezone
        const [year, month, day] = game.date.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // For ISO timestamps, use standard parsing
        date = new Date(dateStr);
      }
      
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).toUpperCase();

      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, { sortDate: date, games: [] });
      }
      groupMap.get(dateKey)!.games.push(game);
    });

    // Convert map to array and sort by actual date
    Array.from(groupMap.entries())
      .sort(([, a], [, b]) => a.sortDate.getTime() - b.sortDate.getTime())
      .forEach(([date, { games }]) => {
        groups.push({ date, games });
      });

    return groups;
  };

  const getPageTitle = () => {
    switch (viewMode) {
      case 'live': return 'Live Games';
      case 'weekend': return 'This Weekend';
      case 'playoff': return 'Games';
      default: return 'Scores';
    }
  };

  const getPageSubtitle = () => {
    if (viewMode === 'playoff') {
      // Determine current playoff round from games in view
      const allGames = [...liveGames, ...upcomingGames, ...finishedGames];
      
      // Map database playoff_round values to display names
      const roundDisplayNames: Record<string, string> = {
        'Bi-District': 'Playoffs - Bi-District',
        'Area': 'Playoffs - Area',
        'Regional Quarterfinals': 'Playoffs - Regional',
        'Regional Semifinals': 'Playoffs - Quarterfinals',
        'Regional Finals': 'Playoffs - Regional Finals',
        'State Semifinal': 'Playoffs - State Semis',
        'State Semifinals': 'Playoffs - State Semis',
        'State Championship': 'Playoffs - State Championship',
        'Championship': 'Playoffs - State Championship',
      };
      
      // Find the first game and use its playoff_round
      if (allGames.length > 0 && 'playoff_round' in allGames[0]) {
        const round = (allGames[0] as any).playoff_round;
        return roundDisplayNames[round] || 'Playoffs';
      }
      
      return 'Playoffs';
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <FootballIcon size={48} color={Colors.SURGE} />
          </Animated.View>
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      </View>
    );
  }

  const followedLiveGames = liveGames.filter(isGameFollowed);
  const otherLiveGames = liveGames.filter(g => !isGameFollowed(g));
  const followedFinishedGames = finishedGames.filter(isGameFollowed);
  const otherFinishedGames = finishedGames.filter(g => !isGameFollowed(g));
  
  // Filter out past upcoming games (games with dates before today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureUpcomingGames = upcomingGames.filter(game => {
    if (!game.date) return true; // Keep games without dates
    // Parse date string in local timezone, not UTC
    const [year, month, day] = game.date.split('-').map(Number);
    const gameDate = new Date(year, month - 1, day); // month is 0-indexed
    gameDate.setHours(0, 0, 0, 0);
    return gameDate >= today; // Only keep today and future games
  });
  
  const followedUpcomingGames = futureUpcomingGames.filter(isGameFollowed);
  const otherUpcomingGames = futureUpcomingGames.filter(g => !isGameFollowed(g));

  // Filter games by search query
  const filterGamesBySearch = <T extends LiveGame | FinishedGame | UpcomingGame>(games: T[]): T[] => {
    if (!searchQuery.trim()) return games;
    
    const query = searchQuery.toLowerCase();
    return games.filter(game => 
      game.home_team_name.toLowerCase().includes(query) ||
      game.away_team_name.toLowerCase().includes(query) ||
      (game.home_team_mascot && game.home_team_mascot.toLowerCase().includes(query)) ||
      (game.away_team_mascot && game.away_team_mascot.toLowerCase().includes(query))
    );
  };

  // Apply search filter
  const filteredFollowedLiveGames = filterGamesBySearch(followedLiveGames);
  const filteredOtherLiveGames = filterGamesBySearch(otherLiveGames);
  const filteredFollowedFinishedGames = filterGamesBySearch(followedFinishedGames);
  const filteredOtherFinishedGames = filterGamesBySearch(otherFinishedGames);
  const filteredFollowedUpcomingGames = filterGamesBySearch(followedUpcomingGames);
  const filteredOtherUpcomingGames = filterGamesBySearch(otherUpcomingGames);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.SURGE} />
        }
      >
        {/* Hero Header */}
        <View style={[styles.heroHeader, { paddingTop: insets.top + 4 }]}>
          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroTitle}>{getPageTitle()}</Text>
            {getPageSubtitle() && (
              <Text style={styles.heroSubtitle}>{getPageSubtitle()}</Text>
            )}
          </View>
          
          {autoRefreshEnabled && viewMode === 'live' ? (
            <View style={styles.liveBadge}>
              <Animated.View
                style={[
                  styles.liveDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : viewMode === 'playoff' ? (
            <Pressable
              style={styles.bracketButton}
              onPress={() => router.push('/(fan)/playoff-bracket')}
              hitSlop={8}
            >
              <Image 
                source={require('@/assets/images/bracket-icon.png')}
                style={styles.bracketIcon}
                resizeMode="contain"
              />
            </Pressable>
          ) : null}
        </View>

        {/* Tab Bar - StatIQ Style */}
        <View style={styles.tabBar}>
          <Pressable style={styles.tabItem} onPress={() => setActiveTab('scores')}>
            <Text style={[styles.tab, activeTab === 'scores' && styles.activeTab]}>SCORES</Text>
            {activeTab === 'scores' && <View style={styles.activeTabUnderline} />}
          </Pressable>
          <Pressable style={styles.tabItem} onPress={() => setActiveTab('rankings')}>
            <Text style={[styles.tab, activeTab === 'rankings' && styles.activeTab]}>RANKINGS</Text>
            {activeTab === 'rankings' && <View style={styles.activeTabUnderline} />}
          </Pressable>
        </View>

        {/* DEV: LiveIQ Demo Button */}
        <Pressable
          style={styles.liveIQButton}
          onPress={() => router.push('/(fan)/game/live/demo-aledo')}
        >
          <View style={styles.liveIQButtonInner}>
            <View style={styles.liveIQDot} />
            <Text style={styles.liveIQButtonText}>LiveIQ Demo: Aledo vs Southlake Carroll</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.HALO} />
          </View>
        </Pressable>

        {/* Classification Filters - Only show on Scores tab */}
        {activeTab === 'scores' && (
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
            {(viewMode === 'playoff' ? PLAYOFF_CLASSIFICATIONS : CLASSIFICATIONS).map(classification => (
              <Pressable
                key={classification}
                style={[
                  styles.filterChip,
                  selectedClassification === classification && styles.filterChipActive,
                ]}
                onPress={() => handleClassificationFilter(classification)}
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
        )}

        {/* RANKINGS TAB */}
        {activeTab === 'rankings' && (
          <Rankings />
        )}

        {/* SCORES TAB CONTENT */}
        {activeTab === 'scores' && (
          <>
            {/* Error State */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={32} color={Colors.BLAZE} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={() => loadGames()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}

        {/* LIVE GAMES */}
        {(viewMode === 'live' || viewMode === 'weekend') && liveGames.length > 0 && (
          <View style={styles.section}>
            {filteredFollowedLiveGames.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={18} color={Colors.SURGE} />
                  <Text style={styles.sectionTitle}>Your Teams</Text>
                </View>
                {groupGamesByDate(filteredFollowedLiveGames).map(({ date, games }) => (
                  <DateSection key={date}>
                    <DateHeader date={date} />
                    {games.map((game) => (
                      <LiveGameCard
                        key={game.id}
                        game={game}
                        onPress={() => router.push(`/(fan)/game/${game.id}`)}
                        isFollowed={true}
                      />
                    ))}
                  </DateSection>
                ))}
              </>
            )}

            {filteredOtherLiveGames.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>All Live Games</Text>
                </View>
                {groupGamesByDate(filteredOtherLiveGames).map(({ date, games }) => (
                  <DateSection key={date}>
                    <DateHeader date={date} />
                    {games.map((game) => (
                      <LiveGameCard
                        key={game.id}
                        game={game}
                        onPress={() => router.push(`/(fan)/game/${game.id}`)}
                        isFollowed={false}
                      />
                    ))}
                  </DateSection>
                ))}
              </>
            )}
          </View>
        )}

        {/* WEEKDAY MODE */}
        {viewMode === 'weekday' && (
          <>
            {filteredFollowedFinishedGames.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={18} color={Colors.SURGE} />
                  <Text style={styles.sectionTitle}>Your Teams - Recent</Text>
                </View>
                {groupGamesByDate(filteredFollowedFinishedGames).map(({ date, games }) => (
                  <DateSection key={date}>
                    <DateHeader date={date} />
                    {games.map((game) => (
                      <FinishedGameCard
                        key={game.id}
                        game={game}
                        onPress={() => router.push(`/(fan)/game/${game.id}`)}
                        isFollowed={true}
                      />
                    ))}
                  </DateSection>
                ))}
              </View>
            )}

            {filteredFollowedUpcomingGames.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={18} color={Colors.SURGE} />
                  <Text style={styles.sectionTitle}>Your Teams - Upcoming</Text>
                </View>
                {groupGamesByDate(filteredFollowedUpcomingGames).map(({ date, games }) => (
                  <DateSection key={date}>
                    <DateHeader date={date} />
                    {games.map((game) => (
                      <UpcomingGameCard
                        key={game.id}
                        game={game}
                        onPress={(voteFor) => {
                          if (voteFor) {
                            router.push(`/(fan)/game/upcoming/${game.id}?voteFor=${voteFor}`);
                          } else {
                            router.push(`/(fan)/game/upcoming/${game.id}`);
                          }
                        }}
                        isFollowed={true}
                        refreshTrigger={refreshKey}
                      />
                    ))}
                  </DateSection>
                ))}
              </View>
            )}

            {filteredOtherFinishedGames.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Results</Text>
                </View>
                {groupGamesByDate(filteredOtherFinishedGames.slice(0, 10)).map(({ date, games }) => (
                  <DateSection key={date}>
                    <DateHeader date={date} />
                    {games.map((game) => (
                      <FinishedGameCard
                        key={game.id}
                        game={game}
                        onPress={() => router.push(`/(fan)/game/${game.id}`)}
                        isFollowed={false}
                      />
                    ))}
                  </DateSection>
                ))}
              </View>
            )}
          </>
        )}

        {/* PLAYOFF MODE */}
        {viewMode === 'playoff' && (
          <View style={styles.section}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={Colors.TEXT_SECONDARY} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search teams, players, games..."
                placeholderTextColor={Colors.TEXT_SECONDARY}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={Colors.TEXT_SECONDARY} />
                </Pressable>
              )}
            </View>

            {(filteredFollowedLiveGames.length > 0 || filteredOtherLiveGames.length > 0) && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Live Playoff Games</Text>
                </View>
                {groupGamesByDate([...filteredFollowedLiveGames, ...filteredOtherLiveGames]).map(({ date, games }) => (
                  <DateSection key={date}>
                    <DateHeader date={date} />
                    {games.map((game) => (
                      <LiveGameCard
                        key={game.id}
                        game={game}
                        onPress={() => router.push(`/(fan)/game/${game.id}`)}
                        isFollowed={isGameFollowed(game)}
                      />
                    ))}
                  </DateSection>
                ))}
              </>
            )}

            {(filteredFollowedUpcomingGames.length > 0 || filteredOtherUpcomingGames.length > 0) && (
              <>
                {groupGamesByDate([...filteredFollowedUpcomingGames, ...filteredOtherUpcomingGames]).map(({ date, games }, dateIndex) => (
                  <React.Fragment key={date}>
                    <DateSection>
                      <DateHeader date={date} />
                      {games.map((game, gameIndex) => (
                        <React.Fragment key={game.id}>
                          <UpcomingGameCard
                            game={game}
                            onPress={(voteFor) => {
                              if (voteFor) {
                                router.push(`/(fan)/game/upcoming/${game.id}?voteFor=${voteFor}`);
                              } else {
                                router.push(`/(fan)/game/upcoming/${game.id}`);
                              }
                            }}
                            isFollowed={isGameFollowed(game)}
                            refreshTrigger={refreshKey}
                          />
                          {/* Show large block ad after every 8th game */}
                          {(dateIndex * games.length + gameIndex + 1) % 8 === 0 && (
                            <LargeBlockAd />
                          )}
                        </React.Fragment>
                      ))}
                    </DateSection>
                    {/* Show small banner ad after every 2nd date section */}
                    {(dateIndex + 1) % 2 === 0 && dateIndex < groupGamesByDate([...filteredFollowedUpcomingGames, ...filteredOtherUpcomingGames]).length - 1 && (
                      <SmallBannerAd style={{ marginVertical: 12 }} />
                    )}
                  </React.Fragment>
                ))}
              </>
            )}

            {/* Finished Games - Show below upcoming */}
            {(filteredFollowedFinishedGames.length > 0 || filteredOtherFinishedGames.length > 0) && (
              <>
                {groupGamesByDate([...filteredFollowedFinishedGames, ...filteredOtherFinishedGames]).map(({ date, games }, dateIndex) => (
                  <React.Fragment key={date}>
                    <DateSection>
                      <DateHeader date={date} />
                      {games.map((game, gameIndex) => (
                        <React.Fragment key={game.id}>
                          <FinishedGameCard
                            game={game}
                            onPress={() => router.push(`/(fan)/game/${game.id}`)}
                            isFollowed={isGameFollowed(game)}
                          />
                          {/* Show large block ad after every 8th game */}
                          {(dateIndex * games.length + gameIndex + 1) % 8 === 0 && (
                            <LargeBlockAd />
                          )}
                        </React.Fragment>
                      ))}
                    </DateSection>
                    {/* Show small banner ad after every 2nd date section */}
                    {(dateIndex + 1) % 2 === 0 && dateIndex < groupGamesByDate([...filteredFollowedFinishedGames, ...filteredOtherFinishedGames]).length - 1 && (
                      <SmallBannerAd style={{ marginVertical: 12 }} />
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </View>
        )}

        {/* Empty State */}
        {filteredOtherLiveGames.length === 0 && 
         filteredFollowedLiveGames.length === 0 && 
         filteredOtherFinishedGames.length === 0 && 
         filteredFollowedFinishedGames.length === 0 && 
         filteredOtherUpcomingGames.length === 0 && 
         filteredFollowedUpcomingGames.length === 0 && 
         !error && (
          <View style={styles.emptyState}>
            <FootballIcon size={64} color={Colors.TEXT_TERTIARY} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No games found' : 'No games scheduled'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? `No games match "${searchQuery}"`
                : selectedClassification
                ? `No ${selectedClassification} games available`
                : 'Check back later for upcoming games'}
            </Text>
          </View>
        )}
          </>
        )}
      </ScrollView>

      {/* Top gradient overlay to prevent content clashing with status bar */}
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },

  // Hero Header
  heroHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
    marginLeft: 12,
  },
  bracketButton: {
    padding: 8,
    marginLeft: 12,
  },
  bracketIcon: {
    width: 36,
    height: 36,
    tintColor: Colors.SURGE,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 54, 54, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 54, 54, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BLAZE,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.BLAZE,
    letterSpacing: 0.5,
  },

  // Tab Bar - StatIQ Style
  tabBar: {
    flexDirection: 'row',
    gap: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.SHADOW,
  },
  tabItem: {
    alignItems: 'center',
  },
  activeTab: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tab: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeTabUnderline: {
    marginTop: 8,
    height: 3,
    width: '100%',
    backgroundColor: Colors.SURGE,
  },

  // Filters
  filterScroll: {
    marginBottom: 12,
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

  // Error
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 54, 54, 0.2)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.BLAZE,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.SURGE,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.BASALT,
  },

  // Sections
  section: {
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: -0.3,
  },

  // Playoff Banner (Clickable) - Full width
  playoffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(180, 216, 54, 0.3)',
  },
  playoffBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playoffBannerText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.SURGE,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.GRAPHITE,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_PRIMARY,
    padding: 0,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
    lineHeight: 20,
  },

  // LiveIQ Demo Button
  liveIQButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.SURGE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveIQButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  liveIQDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.BLAZE,
  },
  liveIQButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.BASALT,
  },
});
