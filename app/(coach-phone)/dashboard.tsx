import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';
import {
  getDashboard,
  type DashboardData,
  getTopPerformers,
  type TopPerformersResponse,
  getGameTopPerformers,
  type GameTopPerformersResponse
} from "../../src/lib/coach-api";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformersResponse | null>(null);
  const [gamePerformers, setGamePerformers] = useState<GameTopPerformersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState<Array<{team: string, wins: number, losses: number, in_playoffs: boolean}>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch district standings
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const resp = await fetch('https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1/district-standings/16', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (resp.ok) {
          const data = await resp.json();
          setStandings(data);
        }
      } catch (err) {
        console.error('Failed to fetch standings:', err);
      }
    };
    fetchStandings();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardResult = await getDashboard();
      setData(dashboardResult);

      const performersResult = await getTopPerformers();
      setTopPerformers(performersResult);

      if (dashboardResult.last_game?.game_id) {
        const gamePerformersResult = await getGameTopPerformers(dashboardResult.last_game.game_id);
        setGamePerformers(gamePerformersResult);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Error Loading Dashboard</Text>
          <Text style={styles.errorMessage}>{error || "Failed to load data"}</Text>
          <Pressable onPress={loadDashboardData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { team, last_game, upcoming_game, player_availability } = data;
  const wins = team.record?.split("-")[0] || "0";
  const losses = team.record?.split("-")[1] || "0";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <Text style={styles.welcomeText}>Welcome back, Coach {user?.lastName || user?.firstName || 'Coach'}.</Text>

        {/* Team Banner */}
        <View style={[styles.teamBanner, { backgroundColor: team.primary_color || "#0066cc" }]}>
          <Text style={styles.teamName}>{team.name} {team.mascot}</Text>
          <Text style={styles.teamRecord}>{wins}-{losses}</Text>
        </View>

        {/* Last Game Recap */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Full Recap vs. {last_game?.opponent || "TBD"}
          </Text>
          {last_game ? (
            <>
              <Text style={styles.scoreText}>
                <Text style={styles.boldText}>Final Score: </Text>
                {team.name} {last_game.score[team.name]} - {last_game.opponent} {last_game.score[last_game.opponent]}
              </Text>
              <Text style={styles.summaryText}>{last_game.summary}</Text>
              <Pressable 
                style={[styles.actionButton, { backgroundColor: team.primary_color || "#0066cc" }]}
                onPress={() => {
                  if (last_game?.game_id) {
                    router.push(`/(coach-phone)/game/${last_game.game_id}?status=finished`);
                  }
                }}
              >
                <Text style={styles.actionButtonText}>View Full Recap</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyText}>No recent game</Text>
          )}
        </View>

        {/* Upcoming Opponent */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Opponent</Text>
          {upcoming_game ? (
            <>
              <View style={[styles.opponentBanner, { backgroundColor: upcoming_game.background_color || "#f5f0e8" }]}>
                <Text style={[styles.opponentName, { color: upcoming_game.primary_color || "#8b0000" }]}>
                  {upcoming_game.opponent}
                </Text>
                <Text style={[styles.opponentRecord, { color: upcoming_game.primary_color || "#8b0000" }]}>
                  2-3
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Key Players:</Text>
                <Text style={styles.infoValue}>#5 WR Jones - 8 TDs last 3 games</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Defensive Trend:</Text>
                <Text style={styles.infoValue}>Allowing 27.4 PPG (worst in district)</Text>
              </View>

              <Pressable 
                style={[styles.actionButton, { backgroundColor: upcoming_game.primary_color || "#8b0000" }]}
                onPress={() => {
                  if (upcoming_game?.team_id) {
                    router.push(`/(coach-phone)/team/${upcoming_game.team_id}`);
                  } else {
                    // Fallback to team name slug
                    const teamSlug = upcoming_game.opponent.toLowerCase().replace(/\s+/g, '-');
                    router.push(`/(coach-phone)/team/${teamSlug}`);
                  }
                }}
              >
                <Text style={styles.actionButtonText}>View Full Scouting</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyText}>No upcoming game</Text>
          )}
        </View>

        {/* Top Performers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Top Performers vs. {last_game?.opponent || "TBD"}
          </Text>

          {gamePerformers && gamePerformers.top_rushers.length > 0 ? (
            <View style={styles.performersRow}>
              {/* Offensive Player */}
              <View style={styles.performerCard}>
                <Text style={styles.performerLabel}>OFFENSIVE</Text>
                <View style={[styles.performerContent, { borderLeftColor: team.primary_color || "#0066cc" }]}>
                  <Text style={[styles.performerName, { color: team.primary_color || "#0066cc" }]}>
                    {gamePerformers.top_rushers[0].player_name}
                  </Text>
                  <Text style={[styles.performerPosition, { color: team.primary_color || "#0066cc" }]}>
                    {gamePerformers.top_rushers[0].position} | #{gamePerformers.top_rushers[0].jersey}
                  </Text>

                  <View style={styles.statRow}>
                    <Text style={[styles.statValue, { color: team.primary_color || "#0066cc" }]}>
                      {gamePerformers.top_rushers[0].rushing_yards}
                    </Text>
                    <Text style={[styles.statLabel, { color: team.primary_color || "#0066cc" }]}>YDS</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={[styles.statValue, { color: team.primary_color || "#0066cc" }]}>
                      {gamePerformers.top_rushers[0].rushing_tds}
                    </Text>
                    <Text style={[styles.statLabel, { color: team.primary_color || "#0066cc" }]}>TD</Text>
                  </View>
                </View>
              </View>

              {/* Defensive Player */}
              <View style={styles.performerCard}>
                <Text style={styles.performerLabel}>DEFENSIVE</Text>
                <View style={[styles.performerContent, { borderLeftColor: team.primary_color || "#0066cc" }]}>
                  <Text style={[styles.performerName, { color: team.primary_color || "#0066cc" }]}>
                    Sergio Mata
                  </Text>
                  <Text style={[styles.performerPosition, { color: team.primary_color || "#0066cc" }]}>
                    S | #24
                  </Text>

                  <View style={styles.statRow}>
                    <Text style={[styles.statValue, { color: team.primary_color || "#0066cc" }]}>13</Text>
                    <Text style={[styles.statLabel, { color: team.primary_color || "#0066cc" }]}>TOT</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={[styles.statValue, { color: team.primary_color || "#0066cc" }]}>1</Text>
                    <Text style={[styles.statLabel, { color: team.primary_color || "#0066cc" }]}>INT</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyPerformers}>
              <Text style={styles.emptyTitle}>{last_game ? "Loading..." : "Bye Week"}</Text>
              <Text style={styles.emptySubtitle}>{last_game ? "" : "No stats available"}</Text>
            </View>
          )}
        </View>

        {/* Player Availability */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Player Availability</Text>

          <View style={styles.availabilityRow}>
            {/* OUT */}
            <View style={styles.availabilityColumn}>
              <Text style={[styles.availabilityLabel, { color: "#FF3636" }]}>OUT</Text>
              {player_availability?.out && player_availability.out.length > 0 ? (
                player_availability.out.map((player, idx) => (
                  <Text key={idx} style={styles.playerName}>
                    #{player.number} {player.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyText}>None</Text>
              )}
            </View>

            {/* LIMITED */}
            <View style={styles.availabilityColumn}>
              <Text style={[styles.availabilityLabel, { color: "#FF9500" }]}>LIMITED</Text>
              {player_availability?.limited && player_availability.limited.length > 0 ? (
                player_availability.limited.map((player, idx) => (
                  <Text key={idx} style={styles.playerName}>
                    #{player.number} {player.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyText}>None</Text>
              )}
            </View>

            {/* CLEARED */}
            <View style={styles.availabilityColumn}>
              <Text style={[styles.availabilityLabel, { color: "#34C759" }]}>CLEARED</Text>
              {player_availability?.cleared && player_availability.cleared.length > 0 ? (
                player_availability.cleared.map((player, idx) => (
                  <Text key={idx} style={styles.playerName}>
                    #{player.number} {player.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyText}>None</Text>
              )}
            </View>
          </View>
        </View>

        {/* Playoff Picture */}
        <View style={[styles.card, { marginBottom: 120 }]}>
          <Text style={styles.cardTitle}>Playoff Picture</Text>

          {standings.map((s, idx) => (
            <View key={s.team}>
              <View style={[
                styles.standingsRow,
                s.team === team.name && styles.standingsRowHighlight
              ]}>
                <View style={styles.standingsLeft}>
                  <Text style={styles.movementIcon}>—</Text>
                  <Text style={[
                    styles.standingsTeam,
                    s.team === team.name && styles.standingsTeamHighlight
                  ]}>
                    {idx + 1}. {s.team}
                  </Text>
                </View>
                <Text style={[
                  styles.standingsRecord,
                  s.team === team.name && styles.standingsRecordHighlight
                ]}>
                  {s.wins}-{s.losses}
                </Text>
              </View>
              {idx === 3 && <View style={styles.playoffLine} />}
            </View>
          ))}

          <View style={styles.playoffNote}>
            <Text style={styles.playoffNoteText}>Top 4 teams qualify for playoffs</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  errorTitle: {
    color: '#FF3636',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  welcomeText: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 16,
  },
  teamBanner: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    flex: 1,
  },
  teamRecord: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
  },
  card: {
    backgroundColor: '#3a3a3a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 12,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 6,
  },
  boldText: {
    fontFamily: 'NeueHaas-Bold',
  },
  summaryText: {
    color: '#ccc',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
  },
  opponentBanner: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  opponentName: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
  },
  opponentRecord: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 2,
  },
  infoValue: {
    color: '#d0d0d0',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    lineHeight: 18,
  },
  performersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  performerCard: {
    flex: 1,
  },
  performerLabel: {
    color: '#999',
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  performerContent: {
    backgroundColor: '#F3F3F7',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  performerName: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 2,
  },
  performerPosition: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    marginLeft: 4,
  },
  emptyPerformers: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#999',
    fontSize: 15,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 3,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityColumn: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  playerName: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    marginBottom: 4,
  },
  standingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 1,
  },
  standingsRowHighlight: {
    backgroundColor: 'rgba(0, 102, 204, 0.25)',
  },
  standingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  movementIcon: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    width: 18,
    textAlign: 'center',
  },
  standingsTeam: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
  },
  standingsTeamHighlight: {
    fontFamily: 'NeueHaas-Bold',
  },
  standingsRecord: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
  },
  standingsRecordHighlight: {
    fontFamily: 'NeueHaas-Bold',
  },
  playoffLine: {
    height: 2,
    backgroundColor: '#FF3636',
    marginVertical: 6,
  },
  playoffNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  playoffNoteText: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
  },
});
