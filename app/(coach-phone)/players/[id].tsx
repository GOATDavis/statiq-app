import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from '@/src/constants/design';
import { getPlayer, type PlayerData } from "../../../src/lib/coach-api";
import { saveRecentSearch } from "../../../src/lib/recent-searches";
import { getTeamColorByName } from "../../../src/constants/team-colors";

type TabType = "overview" | "stats" | "games";

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayer();
  }, [id]);

  const loadPlayer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let playerNumber = id as string;
      if (playerNumber.startsWith("player_")) {
        playerNumber = playerNumber.replace("player_", "");
      }
      
      const data = await getPlayer(playerNumber);
      setPlayer(data);
      
      if (data) {
        await saveRecentSearch({
          type: 'player',
          id: data.id,
          name: data.name,
          number: data.number,
          position: data.position,
          team: `${data.team_name} ${data.team_mascot}`
        });
      }
    } catch (err) {
      console.error("Error loading player:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const teamColor = player?.team_name ? getTeamColorByName(player.team_name) : "#0066cc";

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading player...</Text>
        </View>
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Error Loading Player</Text>
          <Text style={styles.errorSubtext}>{error || "Player not found"}</Text>
          <Pressable onPress={loadPlayer} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Get overview stats based on position
  const getOverviewStats = () => {
    if (!player.stats) return [];
    const stats = player.stats;
    
    const overview = [];
    
    // Passing stats
    if (stats.passing_yards) {
      overview.push(
        { label: "PASS YDS", value: stats.passing_yards },
        { label: "PASS TD", value: stats.passing_tds || 0 },
        { label: "COMP %", value: stats.completion_pct ? `${stats.completion_pct}%` : "0%" }
      );
    }
    
    // Rushing stats
    if (stats.rushing_yards) {
      overview.push(
        { label: "RUSH YDS", value: stats.rushing_yards },
        { label: "RUSH TD", value: stats.rushing_tds || 0 },
        { label: "YPC", value: stats.yards_per_carry || 0 }
      );
    }
    
    // Receiving stats
    if (stats.receiving_yards) {
      overview.push(
        { label: "REC YDS", value: stats.receiving_yards },
        { label: "REC TD", value: stats.receiving_tds || 0 },
        { label: "REC", value: stats.receptions || 0 }
      );
    }
    
    // Defense stats
    if (stats.tackles) {
      overview.push(
        { label: "TACKLES", value: stats.tackles },
        { label: "SACKS", value: stats.sacks || 0 },
        { label: "INT", value: stats.interceptions || 0 }
      );
    }
    
    return overview.slice(0, 6);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Player Profile</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Player Card */}
      <View style={styles.playerCard}>
        <View style={[styles.playerNumber, { backgroundColor: teamColor }]}>
          <Text style={styles.playerNumberText}>{player.number}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerDetails}>
            {player.position} • {player.height} • {player.weight} lbs
          </Text>
          <Text style={styles.playerTeam}>
            {player.team_name} {player.team_mascot}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["overview", "stats", "games"] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && (
          <View style={styles.section}>
            {/* Season Stats Overview */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Season Stats</Text>
              <View style={styles.statsGrid}>
                {getOverviewStats().map((stat, idx) => (
                  <View key={idx} style={styles.statItem}>
                    <Text style={[styles.statValue, { color: teamColor }]}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Player Bio */}
            {player.bio && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bio</Text>
                <Text style={styles.bioText}>{player.bio}</Text>
              </View>
            )}

            {/* Class & Eligibility */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Class</Text>
                <Text style={styles.infoValue}>{player.class || "Senior"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position</Text>
                <Text style={styles.infoValue}>{player.position}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jersey</Text>
                <Text style={styles.infoValue}>#{player.number}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "stats" && (
          <View style={styles.section}>
            {player.stats ? (
              <>
                {/* Passing */}
                {player.stats.passing_yards && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Passing</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.passing_yards}</Text>
                        <Text style={styles.statLabel}>YARDS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.passing_tds || 0}</Text>
                        <Text style={styles.statLabel}>TDS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.interceptions_thrown || 0}</Text>
                        <Text style={styles.statLabel}>INT</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.completion_pct || 0}%</Text>
                        <Text style={styles.statLabel}>COMP %</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Rushing */}
                {player.stats.rushing_yards && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Rushing</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.rushing_yards}</Text>
                        <Text style={styles.statLabel}>YARDS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.rushing_tds || 0}</Text>
                        <Text style={styles.statLabel}>TDS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.carries || 0}</Text>
                        <Text style={styles.statLabel}>CAR</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.yards_per_carry || 0}</Text>
                        <Text style={styles.statLabel}>YPC</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Receiving */}
                {player.stats.receiving_yards && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Receiving</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.receiving_yards}</Text>
                        <Text style={styles.statLabel}>YARDS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.receiving_tds || 0}</Text>
                        <Text style={styles.statLabel}>TDS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.receptions || 0}</Text>
                        <Text style={styles.statLabel}>REC</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.targets || 0}</Text>
                        <Text style={styles.statLabel}>TGT</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Defense */}
                {player.stats.tackles && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Defense</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.tackles}</Text>
                        <Text style={styles.statLabel}>TACKLES</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.sacks || 0}</Text>
                        <Text style={styles.statLabel}>SACKS</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.interceptions || 0}</Text>
                        <Text style={styles.statLabel}>INT</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: teamColor }]}>{player.stats.forced_fumbles || 0}</Text>
                        <Text style={styles.statLabel}>FF</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No stats available</Text>
            )}
          </View>
        )}

        {activeTab === "games" && (
          <View style={styles.section}>
            {player.game_log && player.game_log.length > 0 ? (
              player.game_log.map((game, idx) => (
                <View key={idx} style={styles.gameCard}>
                  <View style={styles.gameHeader}>
                    <Text style={styles.gameDate}>{game.date}</Text>
                    <Text style={styles.gameOpponent}>vs {game.opponent}</Text>
                  </View>
                  <View style={styles.gameStats}>
                    {game.stats.map((stat, statIdx) => (
                      <View key={statIdx} style={styles.gameStatItem}>
                        <Text style={[styles.gameStatValue, { color: teamColor }]}>{stat.value}</Text>
                        <Text style={styles.gameStatLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No game log available</Text>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BASALT,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
    marginTop: 12,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backIcon: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
  },
  playerCard: {
    marginHorizontal: 16,
    backgroundColor: '#3a3a3a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  playerNumber: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumberText: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'NeueHaas-Bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 4,
  },
  playerDetails: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 2,
  },
  playerTeam: {
    color: '#0066cc',
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.SURGE,
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
  },
  tabTextActive: {
    color: Colors.BASALT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    gap: 12,
  },
  card: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    width: '30%',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'NeueHaas-Bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    marginTop: 4,
  },
  bioText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a4a',
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
  },
  gameCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 14,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameDate: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
  },
  gameOpponent: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
  },
  gameStats: {
    flexDirection: 'row',
    gap: 8,
  },
  gameStatItem: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  gameStatValue: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
  },
  gameStatLabel: {
    color: '#999',
    fontSize: 9,
    fontFamily: 'NeueHaas-Bold',
    marginTop: 2,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
