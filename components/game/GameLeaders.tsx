import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/design';
import type { GameLeader, GameLeadersResponse } from '@/src/lib/types/game';
import { getGameLeaders } from '@/src/lib/api';

interface GameLeadersProps {
  gameId: string;
}

export default function GameLeaders({ gameId }: GameLeadersProps) {
  const [leaders, setLeaders] = useState<GameLeadersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaders();
  }, [gameId]);

  const loadLeaders = async () => {
    // Skip API call for demo games
    if (gameId.startsWith('demo-')) {
      setIsLoading(false);
      setError('Demo game');
      return;
    }

    try {
      setIsLoading(true);
      const data = await getGameLeaders(gameId);
      setLeaders(data);
    } catch (err) {
      console.error('Error loading game leaders:', err);
      setError('Failed to load game leaders');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Game Leaders</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.SURGE} />
        </View>
      </View>
    );
  }

  if (error || !leaders) {
    return null; // Silently fail for now
  }

  const { home_team, away_team } = leaders;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Game Leaders</Text>
      </View>

      {/* Team Headers */}
      <View style={styles.teamHeaders}>
        <View style={[styles.teamHeader, { borderColor: away_team.team_color || Colors.TEXT_TERTIARY }]}>
          <Text style={styles.teamName} numberOfLines={1}>{away_team.team_name}</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={[styles.teamHeader, { borderColor: home_team.team_color || Colors.TEXT_TERTIARY }]}>
          <Text style={styles.teamName} numberOfLines={1}>{home_team.team_name}</Text>
        </View>
      </View>

      {/* Stat Categories */}
      <View style={styles.statCategories}>
        {/* Passing */}
        {(away_team.passing || home_team.passing) && (
          <StatComparison
            category="Passing"
            awayLeader={away_team.passing}
            homeLeader={home_team.passing}
            awayColor={away_team.team_color || Colors.TEXT_TERTIARY}
            homeColor={home_team.team_color || Colors.TEXT_TERTIARY}
            formatStats={(leader) =>
              leader
                ? `${leader.passing_yards} YDS, ${leader.passing_completions}/${leader.passing_attempts}, ${leader.passing_tds} TD`
                : '-'
            }
          />
        )}

        {/* Rushing */}
        {(away_team.rushing || home_team.rushing) && (
          <StatComparison
            category="Rushing"
            awayLeader={away_team.rushing}
            homeLeader={home_team.rushing}
            awayColor={away_team.team_color || Colors.TEXT_TERTIARY}
            homeColor={home_team.team_color || Colors.TEXT_TERTIARY}
            formatStats={(leader) =>
              leader
                ? `${leader.rushing_yards} YDS, ${leader.rushing_carries} CAR, ${leader.rushing_tds} TD`
                : '-'
            }
          />
        )}

        {/* Receiving */}
        {(away_team.receiving || home_team.receiving) && (
          <StatComparison
            category="Receiving"
            awayLeader={away_team.receiving}
            homeLeader={home_team.receiving}
            awayColor={away_team.team_color || Colors.TEXT_TERTIARY}
            homeColor={home_team.team_color || Colors.TEXT_TERTIARY}
            formatStats={(leader) =>
              leader
                ? `${leader.receiving_yards} YDS, ${leader.receptions} REC, ${leader.receiving_tds} TD`
                : '-'
            }
          />
        )}

        {/* Tackles */}
        {(away_team.tackles || home_team.tackles) && (
          <StatComparison
            category="Tackles"
            awayLeader={away_team.tackles}
            homeLeader={home_team.tackles}
            awayColor={away_team.team_color || Colors.TEXT_TERTIARY}
            homeColor={home_team.team_color || Colors.TEXT_TERTIARY}
            formatStats={(leader) =>
              leader ? `${leader.tackles} Total` : '-'
            }
          />
        )}

        {/* Sacks */}
        {(away_team.sacks || home_team.sacks) && (
          <StatComparison
            category="Sacks"
            awayLeader={away_team.sacks}
            homeLeader={home_team.sacks}
            awayColor={away_team.team_color || Colors.TEXT_TERTIARY}
            homeColor={home_team.team_color || Colors.TEXT_TERTIARY}
            formatStats={(leader) =>
              leader ? `${leader.sacks} Sacks` : '-'
            }
          />
        )}
      </View>
    </View>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatComparisonProps {
  category: string;
  awayLeader: GameLeader | null;
  homeLeader: GameLeader | null;
  awayColor: string;
  homeColor: string;
  formatStats: (leader: GameLeader) => string;
}

function StatComparison({
  category,
  awayLeader,
  homeLeader,
  awayColor,
  homeColor,
  formatStats,
}: StatComparisonProps) {
  return (
    <View style={styles.statRow}>
      {/* Away Team Leader */}
      <View style={styles.statSide}>
        {awayLeader ? (
          <>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {awayLeader.player_name}
              </Text>
              <Text style={styles.playerPosition}>
                {awayLeader.position}
                {awayLeader.jersey_number && ` #${awayLeader.jersey_number}`}
              </Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatStats(awayLeader)}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>-</Text>
        )}
      </View>

      {/* Category Label */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>{category}</Text>
      </View>

      {/* Home Team Leader */}
      <View style={styles.statSide}>
        {homeLeader ? (
          <>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {homeLeader.player_name}
              </Text>
              <Text style={styles.playerPosition}>
                {homeLeader.position}
                {homeLeader.jersey_number && ` #${homeLeader.jersey_number}`}
              </Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatStats(homeLeader)}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>-</Text>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
    marginHorizontal: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  header: {
    marginBottom: Spacing.MD,
  },
  title: {
    ...Typography.H3,
    color: Colors.TEXT_PRIMARY,
  },
  loadingContainer: {
    paddingVertical: Spacing.XL,
    alignItems: 'center',
  },

  // Team Headers
  teamHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
    paddingBottom: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  teamHeader: {
    flex: 1,
    paddingBottom: Spacing.XS,
    borderBottomWidth: 2,
  },
  teamName: {
    ...Typography.LABEL,
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerDivider: {
    width: Spacing.MD,
  },

  // Stat Categories
  statCategories: {
    gap: Spacing.MD,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  statSide: {
    flex: 1,
    gap: 4,
  },
  playerInfo: {
    gap: 2,
  },
  playerName: {
    ...Typography.BODY_MEDIUM,
    color: Colors.TEXT_PRIMARY,
    fontWeight: '600',
  },
  playerPosition: {
    ...Typography.LABEL_SMALL,
    color: Colors.TEXT_TERTIARY,
    textTransform: 'uppercase',
  },
  statValue: {
    ...Typography.BODY_SMALL,
    color: Colors.TEXT_SECONDARY,
  },
  noData: {
    ...Typography.BODY_SMALL,
    color: Colors.TEXT_DISABLED,
    textAlign: 'center',
  },

  // Category Label
  categoryContainer: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: Spacing.XXS,
    backgroundColor: Colors.GRAPHITE,
    borderRadius: BorderRadius.XS,
    minWidth: 70,
  },
  categoryLabel: {
    ...Typography.LABEL_SMALL,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
