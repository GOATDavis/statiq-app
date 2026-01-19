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
import { useRouter } from 'expo-router';
import { getRankings, getClassifications } from '@/src/lib/api';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';
import type { RankingTeam, ClassificationOption, Classification } from '@/src/lib/types/game';

// Use the same order as the scores screen
const PLAYOFF_CLASSIFICATIONS: Classification[] = ['6A-D1', '6A-D2', '5A-D1', '5A-D2', '4A-D1', '4A-D2', '3A-D1', '3A-D2', '2A-D1', '2A-D2', '1A-D1'];

interface RankingsProps {
  // Remove props - Rankings will manage its own state
}

export function Rankings({}: RankingsProps) {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingTeam[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[Rankings] Component mounted, selectedClassification:', selectedClassification);

  useEffect(() => {
    console.log('[Rankings] useEffect triggered - loading classifications');
    loadClassifications();
  }, []);

  useEffect(() => {
    console.log('[Rankings] Classifications changed:', classifications.length);
    if (classifications.length > 0) {
      console.log('[Rankings] Loading rankings for:', selectedClassification);
      loadRankings();
    }
  }, [selectedClassification, classifications]);

  const loadClassifications = async () => {
    try {
      const data = await getClassifications();
      const apiClassifications = data.map(c => c.classification);
      
      console.log('[Rankings] API classifications:', apiClassifications);
      
      // Always show ALL UIL classifications in order from largest to smallest
      // Note: 1A-D1 and 1A-D2 are six-man football
      const allPlayoffClassifications = [
        '6A',
        '5A-D1', '5A-D2',
        '4A-D1', '4A-D2',
        '3A-D1', '3A-D2',
        '2A-D1', '2A-D2',
        '1A-D1', '1A-D2',
        'Non-UIL',
      ];
      
      console.log('[Rankings] Showing all classifications:', allPlayoffClassifications);
      setClassifications(allPlayoffClassifications);
      
      // Set default to first classification that has data, or first classification
      if (!selectedClassification && allPlayoffClassifications.length > 0) {
        // Try to find a classification with data
        const classificationWithData = allPlayoffClassifications.find(cls => 
          apiClassifications.includes(cls)
        );
        const defaultClassification = classificationWithData || allPlayoffClassifications[0];
        console.log('[Rankings] Setting default classification:', defaultClassification);
        setSelectedClassification(defaultClassification);
      }
    } catch (err) {
      console.error('Error loading classifications:', err);
      setError('Failed to load classifications');
    }
  };

  const loadRankings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[Rankings] Fetching rankings for classification:', selectedClassification);
      const data = await getRankings(selectedClassification || undefined);
      console.log('[Rankings] Received', data.length, 'teams from API');
      
      // Filter to only show rankings for the selected classification
      const filteredData = selectedClassification 
        ? data.filter(team => team.classification === selectedClassification)
        : data;
      
      console.log('[Rankings] After filtering:', filteredData.length, 'teams for', selectedClassification);
      setRankings(filteredData.slice(0, 25)); // Top 25
    } catch (err) {
      console.error('Error loading rankings:', err);
      // Don't show error, just show empty state
      setRankings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankChangeIcon = (rankChange: number) => {
    if (rankChange < 0) {
      // Moved up (negative change means better rank)
      return <Ionicons name="arrow-up" size={14} color={Colors.SURGE} />;
    } else if (rankChange > 0) {
      // Moved down
      return <Ionicons name="arrow-down" size={14} color={Colors.BLAZE} />;
    }
    return <Text style={styles.rankChangeDash}>—</Text>;
  };

  const handleTeamPress = (team: RankingTeam) => {
    if (team.team_id) {
      router.push(`/(fan)/team/${team.team_id}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Classification Tabs - Always show */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScroll}
      >
        {classifications.map((classification) => (
          <Pressable
            key={classification}
            style={[
              styles.tab,
              selectedClassification === classification && styles.tabActive,
            ]}
            onPress={() => setSelectedClassification(classification)}
          >
            <Text
              style={[
                styles.tabText,
                selectedClassification === classification && styles.tabTextActive,
              ]}
            >
              {classification}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Loading State */}
      {isLoading && rankings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : error && rankings.length === 0 ? (
        /* Error State */
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={Colors.BLAZE} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadRankings}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : rankings.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Ionicons name="podium-outline" size={48} color={Colors.TEXT_TERTIARY} />
          <Text style={styles.emptyTitle}>No Rankings Available</Text>
          <Text style={styles.emptySubtext}>
            Rankings will be available once games are played
          </Text>
        </View>
      ) : (
        /* Rankings List */
        <ScrollView
          style={styles.rankingsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.rankingsContent}
        >
          {rankings.map((team) => (
            <Pressable
              key={team.school_id}
              style={styles.rankingRow}
              onPress={() => handleTeamPress(team)}
            >
              {/* Rank */}
              <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>{team.rank}</Text>
              </View>

              {/* Team Info */}
              <View style={styles.teamInfo}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {team.school_name}
                </Text>
                <View style={styles.teamSubInfo}>
                  <Text style={styles.teamRecord}>{team.record}</Text>
                  <Text style={styles.teamDivider}>•</Text>
                  <Text style={styles.teamClassification}>{team.classification}</Text>
                </View>
              </View>

              {/* Rank Change */}
              <View style={styles.rankChange}>
                {getRankChangeIcon(team.rank_change)}
                {team.rank_change !== 0 && team.previous_rank && (
                  <Text
                    style={[
                      styles.rankChangeText,
                      team.rank_change < 0 && styles.rankChangeTextUp,
                      team.rank_change > 0 && styles.rankChangeTextDown,
                    ]}
                  >
                    {Math.abs(team.rank_change)}
                  </Text>
                )}
              </View>

              {/* Chevron */}
              <Ionicons name="chevron-forward" size={20} color={Colors.TEXT_TERTIARY} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.BLAZE,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.SURGE,
    borderRadius: 24,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.BASALT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
  },

  // Tabs
  tabsScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingRight: 40, // Extra padding on the right to ensure last tab is visible
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 1.5,
    borderColor: Colors.GRAPHITE,
  },
  tabActive: {
    backgroundColor: Colors.SURGE,
    borderColor: Colors.SURGE,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: Colors.BASALT,
    fontWeight: '700',
  },

  // Rankings List
  rankingsList: {
    flex: 1,
  },
  rankingsContent: {
    paddingBottom: 20,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
  },

  // Rank
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },

  // Team Info
  teamInfo: {
    flex: 1,
    marginRight: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  teamSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamRecord: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },
  teamDivider: {
    fontSize: 13,
    color: Colors.TEXT_TERTIARY,
  },
  teamClassification: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },

  // Rank Change
  rankChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 40,
    marginRight: 8,
  },
  rankChangeDash: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
  },
  rankChangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rankChangeTextUp: {
    color: Colors.SURGE,
  },
  rankChangeTextDown: {
    color: Colors.BLAZE,
  },
});
