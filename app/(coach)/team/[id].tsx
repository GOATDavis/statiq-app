import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../../components/ScreenLayout";
import { getTeam, getTeamSchedule, getTeamRoster, getTeamStats } from "../../../src/lib/api";
import { saveRecentSearch } from "../../../src/lib/recent-searches";
import type { TeamProfile, TeamGame, RosterPlayer, TeamSeasonStats } from "../../../src/lib/types/team";

// Color constants
const CARD_BG = "#3a3a3a";
const INNER_BG = "#2a2a2a";
const WIN = "#5FD35F";
const LOSS = "#FF3636";

// Helper to determine if color is light or dark
const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150;
};

export default function TeamProfileScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [teamInfo, setTeamInfo] = useState<TeamProfile | null>(null);
  const [schedule, setSchedule] = useState<TeamGame[]>([]);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [stats, setStats] = useState<TeamSeasonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeam();
  }, [id]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      const teamId = id as string;

      // Load team data
      const team = await getTeam(teamId);
      setTeamInfo(team);

      // Load schedule
      try {
        const scheduleData = await getTeamSchedule(teamId);
        setSchedule(scheduleData.games || []);
      } catch (err) {
        console.warn("Schedule not available:", err);
      }

      // Load roster
      try {
        const rosterData = await getTeamRoster(teamId);
        setRoster(rosterData.players || []);
      } catch (err) {
        console.warn("Roster not available:", err);
      }

      // Load stats
      try {
        const statsData = await getTeamStats(teamId);
        setStats(statsData);
      } catch (err) {
        console.warn("Stats not available:", err);
      }

      // Save to recent searches
      if (team) {
        await saveRecentSearch({
          type: 'team',
          id: teamId,
          name: team.name,
          mascot: team.mascot
        });
      }
    } catch (err) {
      console.error("Error loading team:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "roster", label: "Roster" },
    { id: "schedule", label: "Schedule" },
    { id: "stats", label: "Stats" },
  ];

  if (loading) {
    return (
      <ScreenLayout title="" subtitle="" scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#b4d836" />
          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Roman", marginTop: 12 }}>
            Loading team...
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !teamInfo) {
    return (
      <ScreenLayout title="" subtitle="" scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
            Team Not Found
          </Text>
          <Text style={{ color: "#666", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 24, textAlign: "center" }}>
            {error || "This team doesn't exist in the database."}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ backgroundColor: "#b4d836", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
          >
            <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  const teamColor = teamInfo.primary_color || "#b4d836";
  const headerTextColor = isLightColor(teamColor) ? "#1a1a1a" : "#ffffff";

  // Calculate record from schedule data
  const completedGames = schedule.filter(game => game.result);
  const wins = completedGames.filter(game => game.result === 'W').length;
  const losses = completedGames.filter(game => game.result === 'L').length;
  const upcomingGames = schedule.filter(game => !game.result);

  // Data handling logic
  const hasGames = (wins + losses) > 0;
  const hasLocation = teamInfo.city && teamInfo.city.trim() !== "";
  const hasStats = completedGames.length > 0;

  // Win rate calculation and color
  const winPct = hasGames ? (wins / (wins + losses)) * 100 : 0;
  const winRateColor = winPct >= 50 ? WIN : winPct > 0 ? "#FFB800" : "#999";

  // District record calculation
  const districtGames = completedGames.filter(game => game.is_district);
  const districtWins = districtGames.filter(game => game.result === 'W').length;
  const districtLosses = districtGames.filter(game => game.result === 'L').length;

  // Calculate PPG and Opponent PPG
  const totalPointsFor = completedGames.reduce((sum, game) => {
    if (game.score) {
      const scores = game.score.split('-');
      return sum + parseInt(scores[0] || '0');
    }
    return sum;
  }, 0);
  const totalPointsAgainst = completedGames.reduce((sum, game) => {
    if (game.score) {
      const scores = game.score.split('-');
      return sum + parseInt(scores[1] || '0');
    }
    return sum;
  }, 0);
  const ppg = completedGames.length > 0 ? totalPointsFor / completedGames.length : 0;
  const oppPpg = completedGames.length > 0 ? totalPointsAgainst / completedGames.length : 0;

  // Sort completed games by date descending (most recent first)
  const sortedCompletedGames = [...completedGames].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get last game and next game
  const lastGame = sortedCompletedGames[0]; // Most recent completed
  const nextGame = upcomingGames[0]; // Next upcoming

  // Current streak calculation (using sorted games)
  const last5Games = sortedCompletedGames.slice(0, 5); // Most recent 5, already sorted newest first
  let currentStreak = 0;
  let streakType = '';
  if (sortedCompletedGames.length > 0) {
    streakType = sortedCompletedGames[0].result || '';
    for (const game of sortedCompletedGames) {
      if (game.result === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Group roster by position
  const positionOrder = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "K", "P"];
  const groupedRoster = roster.reduce((acc, player) => {
    const pos = player.position || "Other";
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(player);
    return acc;
  }, {} as Record<string, RosterPlayer[]>);

  return (
    <ScreenLayout title="" subtitle="" scrollable={false}>
      {/* TEAM HEADER CARD - Team Color Background */}
      <View style={{
        backgroundColor: teamColor,
        borderRadius: 16,
        marginBottom: 20,
        padding: 20,
        overflow: 'hidden'
      }}>
        {/* Back button - positioned in header */}
        <Pressable
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}
        >
          <Ionicons name="chevron-back" size={24} color={headerTextColor} />
        </Pressable>

        {/* Team icon, name+mascot, and record on one row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, paddingLeft: 60 }}>
          {/* Team icon - 56x56 */}
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 2,
            borderColor: '#fff',
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Ionicons name="shield" size={32} color={headerTextColor} />
          </View>

          {/* Team name + mascot */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color: headerTextColor,
              fontSize: 28,
              fontFamily: "NeueHaas-Bold",
              lineHeight: 32
            }}>
              {teamInfo.name}
            </Text>
            <Text style={{
              color: headerTextColor,
              opacity: 0.8,
              fontSize: 18,
              fontFamily: "NeueHaas-Bold"
            }}>
              {teamInfo.mascot}
            </Text>
          </View>

          {/* Record badge - always show if games exist */}
          {hasGames && (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12
            }}>
              <Text style={{
                color: headerTextColor,
                fontSize: 24,
                fontFamily: "NeueHaas-Bold"
              }}>
                {wins}-{losses}
              </Text>
            </View>
          )}
        </View>

        {/* Info pills */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 60 }}>
          {teamInfo.classification && (
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6
            }}>
              <Text style={{ color: headerTextColor, fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                {teamInfo.classification}
              </Text>
            </View>
          )}
          {teamInfo.district && (
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6
            }}>
              <Text style={{ color: headerTextColor, fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                {teamInfo.district}
              </Text>
            </View>
          )}
          {hasLocation && (
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6
            }}>
              <Text style={{ color: headerTextColor, fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                {teamInfo.city}{teamInfo.state ? `, ${teamInfo.state}` : ''}
              </Text>
            </View>
          )}
          {teamInfo.stadium && (
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6
            }}>
              <Text style={{ color: headerTextColor, fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                {teamInfo.stadium}
              </Text>
            </View>
          )}
          {teamInfo.state_championships && teamInfo.state_championships > 0 && (
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6
            }}>
              <Text style={{ color: headerTextColor, fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                {teamInfo.state_championships} State Title{teamInfo.state_championships > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* TAB BAR */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              height: 48,
              backgroundColor: activeTab === tab.id ? teamColor : CARD_BG,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Text style={{
              color: activeTab === tab.id ? (isLightColor(teamColor) ? "#000" : "#fff") : "#999",
              fontSize: 14,
              fontFamily: activeTab === tab.id ? "NeueHaas-Bold" : "NeueHaas-Medium",
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* TAB CONTENT */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <View style={{ gap: 16 }}>
            {/* Quick Glance Card - Always 4 stats */}
            {hasGames && (
              <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {/* Overall Record */}
                  <View style={{
                    flex: 1,
                    backgroundColor: INNER_BG,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center"
                  }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {wins}-{losses}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 11, fontFamily: "NeueHaas-Roman" }}>
                      Overall
                    </Text>
                  </View>

                  {/* District Record - Always show */}
                  <View style={{
                    flex: 1,
                    backgroundColor: INNER_BG,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center"
                  }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {districtWins}-{districtLosses}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 11, fontFamily: "NeueHaas-Roman" }}>
                      District
                    </Text>
                  </View>

                  {/* PPG */}
                  <View style={{
                    flex: 1,
                    backgroundColor: INNER_BG,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center"
                  }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {ppg.toFixed(1)}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 11, fontFamily: "NeueHaas-Roman" }}>
                      PPG
                    </Text>
                  </View>

                  {/* Opp PPG */}
                  <View style={{
                    flex: 1,
                    backgroundColor: INNER_BG,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center"
                  }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {oppPpg.toFixed(1)}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 11, fontFamily: "NeueHaas-Roman" }}>
                      Opp PPG
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Current Streak */}
            {hasGames && currentStreak > 0 && (
              <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Last 5 games dots - chronological order (oldest to newest, left to right) */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {last5Games.slice().reverse().map((game, index) => (
                      <View
                        key={index}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: game.result === 'W' ? WIN : LOSS,
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
                          {game.result}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Streak text */}
                  <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>
                    {currentStreak} Game {streakType === 'W' ? 'Winning' : 'Losing'} Streak
                  </Text>
                </View>
              </View>
            )}

            {/* Last Game + Next Game */}
            {(lastGame || nextGame) && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Last Game - with colored left border */}
                {lastGame && (
                  <View style={{ 
                    flex: 1, 
                    backgroundColor: CARD_BG, 
                    borderRadius: 16, 
                    padding: 20,
                    borderLeftWidth: 4,
                    borderLeftColor: lastGame.result === 'W' ? WIN : LOSS
                  }}>
                    <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                      LAST GAME
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Text style={{
                        color: lastGame.result === 'W' ? WIN : LOSS,
                        fontSize: 18,
                        fontFamily: "NeueHaas-Bold"
                      }}>
                        {lastGame.result}
                      </Text>
                      {lastGame.score && (
                        <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                          {lastGame.score}
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {lastGame.is_home ? 'vs' : '@'} {lastGame.opponent_name} {lastGame.opponent_mascot}
                    </Text>
                    <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                      Week {lastGame.week} • {new Date(lastGame.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                )}

                {/* Next Game */}
                {nextGame && (
                  <View style={{ flex: 1, backgroundColor: CARD_BG, borderRadius: 16, padding: 20 }}>
                    <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                      NEXT GAME
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {nextGame.is_home ? 'vs' : '@'} {nextGame.opponent_name} {nextGame.opponent_mascot}
                    </Text>
                    <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      {new Date(nextGame.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {nextGame.time && ` • ${nextGame.time}`}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {nextGame.is_home && (
                        <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                          Home
                        </Text>
                      )}
                      {nextGame.is_district && (
                        <>
                          {nextGame.is_home && <Text style={{ color: "#666" }}>•</Text>}
                          <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                            District
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* District Standings Preview */}
            {teamInfo.district && (
              <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  {teamInfo.district}
                </Text>

                {/* District standings rows */}
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {[
                    { rank: 1, name: 'Highland Park Scots', record: '5-0', teamId: 'highland-park' },
                    { rank: 2, name: 'Red Oak Hawks', record: '4-1', teamId: 'red-oak' },
                    { rank: 3, name: 'Midlothian Panthers', record: '3-1', teamId: 'midlothian' },
                    { rank: 4, name: `${teamInfo.name} ${teamInfo.mascot}`, record: `${districtWins}-${districtLosses}`, teamId: id as string, isCurrentTeam: true },
                    { rank: 5, name: 'Burleson Centennial Spartans', record: '1-3', teamId: 'burleson' },
                    { rank: 6, name: 'Cleburne Yellow Jackets', record: '0-4', teamId: 'cleburne' },
                  ].map((team, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        if (!team.isCurrentTeam) {
                          router.push(`/(coach)/team/${team.teamId}`);
                        }
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: team.isCurrentTeam ? `${teamColor}33` : INNER_BG,
                        borderRadius: 12,
                        padding: 12,
                        borderLeftWidth: team.isCurrentTeam ? 2 : 0,
                        borderLeftColor: team.isCurrentTeam ? teamColor : 'transparent'
                      }}
                    >
                      <Text style={{
                        color: "#666",
                        fontSize: 24,
                        fontFamily: "NeueHaas-Bold",
                        width: 32,
                        marginRight: 12
                      }}>
                        {team.rank}
                      </Text>
                      <Text style={{
                        flex: 1,
                        color: "#fff",
                        fontSize: 15,
                        fontFamily: "NeueHaas-Bold"
                      }}>
                        {team.name}
                      </Text>
                      <Text style={{
                        color: "#fff",
                        fontSize: 15,
                        fontFamily: "NeueHaas-Bold"
                      }}>
                        {team.record}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* View Full Standings button */}
                <Pressable
                  onPress={() => router.push('/(coach)/district')}
                  style={{
                    backgroundColor: INNER_BG,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>
                    View Full Standings
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Team Leaders */}
            {roster.length > 0 && (
              <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                    Team Leaders
                  </Text>
                  <Pressable onPress={() => setActiveTab("roster")}>
                    <Text style={{ color: teamColor, fontSize: 14, fontFamily: "NeueHaas-Medium" }}>
                      View Roster →
                    </Text>
                  </Pressable>
                </View>

                {roster.slice(0, 3).map((player, index) => {
                  const positions = ['QB', 'RB', 'WR'];
                  const icons = ['🏈', '🏃', '🙌'];
                  const labels = ['PASSING', 'RUSHING', 'RECEIVING'];

                  return (
                    <Pressable
                      key={player.id}
                      onPress={() => router.push(`/(coach)/players/${player.id}`)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: index < 2 ? 1 : 0,
                        borderBottomColor: "#333"
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{icons[index]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#999", fontSize: 11, fontFamily: "NeueHaas-Bold", marginBottom: 2 }}>
                          {labels[index]}
                        </Text>
                        <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>
                          #{player.number} {player.name.split(' ').map((n, i) => i === 0 ? n[0] + '.' : n).join(' ')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Empty state if no data */}
            {!hasGames && roster.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 60 }}>
                <Text style={{ fontSize: 48, color: "#555", marginBottom: 16 }}>📊</Text>
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                  No games played yet
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ROSTER TAB */}
        {activeTab === "roster" && (
          <View>
            {roster.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 60 }}>
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                  No roster available
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: CARD_BG, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 }}>
                {/* Group players by position - Sleeper style */}
                {(() => {
                  const positionOrder = ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C', 'DL', 'DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'MLB', 'DB', 'CB', 'S', 'FS', 'SS', 'K', 'P', 'LS', 'ATH'];
                  
                  const grouped: Record<string, typeof roster> = {};
                  roster.forEach(player => {
                    const pos = player.position || 'ATH';
                    if (!grouped[pos]) grouped[pos] = [];
                    grouped[pos].push(player);
                  });
                  
                  const sortedPositions = Object.keys(grouped).sort((a, b) => {
                    const aIdx = positionOrder.indexOf(a);
                    const bIdx = positionOrder.indexOf(b);
                    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
                  });
                  
                  return sortedPositions.map((position, posIndex) => (
                    <View key={position} style={{ marginTop: posIndex > 0 ? 16 : 0 }}>
                      {/* Position Label Badge */}
                      <View style={{ 
                        backgroundColor: teamColor,
                        alignSelf: 'flex-start',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 4,
                        marginBottom: 6,
                      }}>
                        <Text style={{ 
                          color: isLightColor(teamColor) ? '#000' : '#fff', 
                          fontSize: 12, 
                          fontFamily: "NeueHaas-Bold", 
                          letterSpacing: 0.5,
                        }}>
                          {position}
                        </Text>
                      </View>
                      
                      {/* Players under this position */}
                      {grouped[position].map((player) => (
                        <Pressable
                          key={player.id}
                          onPress={() => router.push(`/(coach)/players/${player.id}`)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            paddingLeft: 20,
                            marginHorizontal: -16,
                            paddingHorizontal: 16,
                            backgroundColor: pressed ? '#4a4a4a' : 'transparent',
                          })}
                        >
                          <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'NeueHaas-Bold', flex: 1 }}>
                            {player.name}
                          </Text>
                          <Text style={{ color: '#777', fontSize: 13, fontFamily: 'NeueHaas-Roman' }}>
                            #{player.number}
                            {(player.height || player.weight) && (
                              <Text style={{ color: '#555' }}> · </Text>
                            )}
                            {player.height && (
                              <Text>{player.height.replace('"', "'")}</Text>
                            )}
                            {player.height && player.weight && (
                              <Text style={{ color: '#555' }}> · </Text>
                            )}
                            {player.weight && (
                              <Text>{player.weight.replace(' lbs', '')}</Text>
                            )}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ));
                })()}
              </View>
            )}
          </View>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <View style={{ paddingBottom: 40 }}>
            {schedule.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 60 }}>
                <Text style={{ fontSize: 48, color: "#555", marginBottom: 16 }}>📅</Text>
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                  No schedule available
                </Text>
              </View>
            ) : (
              <View style={{ gap: 24 }}>
                {/* Completed Games */}
                {completedGames.length > 0 && (
                  <View>
                    <Text style={{
                      color: "#999",
                      fontSize: 12,
                      fontFamily: "NeueHaas-Bold",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 12
                    }}>
                      COMPLETED ({completedGames.length})
                    </Text>
                    {completedGames.map((game) => (
                      <View key={game.id} style={{ marginBottom: 12 }}>
                        <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Medium", marginBottom: 8 }}>
                          Week {game.week} • {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={{
                          backgroundColor: CARD_BG,
                          borderRadius: 12,
                          padding: 16,
                          borderLeftWidth: 4,
                          borderLeftColor: game.result === 'W' ? WIN : LOSS
                        }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                              <Text style={{
                                color: game.result === 'W' ? WIN : LOSS,
                                fontSize: 16,
                                fontFamily: "NeueHaas-Bold",
                                width: 20
                              }}>
                                {game.result}
                              </Text>
                              <Text style={{ flex: 1, color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>
                                {game.is_home ? 'vs' : '@'} {game.opponent_name} {game.opponent_mascot}
                              </Text>
                            </View>
                            {game.score && (
                              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                                {game.score}
                              </Text>
                            )}
                          </View>
                          {game.location && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 28 }}>
                              <Text style={{ fontSize: 12 }}>📍</Text>
                              <Text style={{ color: "#666", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                                {game.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Upcoming Games */}
                {upcomingGames.length > 0 && (
                  <View>
                    <Text style={{
                      color: "#999",
                      fontSize: 12,
                      fontFamily: "NeueHaas-Bold",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 12
                    }}>
                      UPCOMING ({upcomingGames.length})
                    </Text>
                    {upcomingGames.map((game) => (
                      <View key={game.id} style={{ marginBottom: 12 }}>
                        <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Medium", marginBottom: 8 }}>
                          Week {game.week} • {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={{
                          backgroundColor: CARD_BG,
                          borderRadius: 12,
                          padding: 16
                        }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text style={{ flex: 1, color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>
                              {game.is_home ? 'vs' : '@'} {game.opponent_name} {game.opponent_mascot}
                            </Text>
                            {game.time && (
                              <Text style={{ color: teamColor, fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                                {game.time}
                              </Text>
                            )}
                          </View>
                          {game.location && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Text style={{ fontSize: 12 }}>📍</Text>
                              <Text style={{ color: "#666", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                                {game.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <View style={{ paddingBottom: 40 }}>
            {!stats ? (
              <View style={{ alignItems: "center", paddingVertical: 60 }}>
                <Text style={{ fontSize: 48, color: "#555", marginBottom: 16 }}>📊</Text>
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                  No stats available
                </Text>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {/* Team Statistics Card */}
                <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20 }}>
                  <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                    Team Statistics
                  </Text>

                  {/* OFFENSE Section */}
                  <Text style={{
                    color: "#999",
                    fontSize: 12,
                    fontFamily: "NeueHaas-Bold",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 12
                  }}>
                    OFFENSE
                  </Text>
                  <View style={{ backgroundColor: INNER_BG, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    {/* Points Per Game */}
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          Points Per Game
                        </Text>
                        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                          {stats.points_per_game?.toFixed(1) || "0"}
                        </Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: "#333", borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{
                          height: '100%',
                          width: `${Math.min((stats.points_per_game / 50) * 100, 100)}%`,
                          backgroundColor: teamColor,
                          borderRadius: 4
                        }} />
                      </View>
                    </View>

                    {/* Total Yards/Game */}
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          Total Yards/Game
                        </Text>
                        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                          {stats.yards_per_game?.toFixed(0) || "0"}
                        </Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: "#333", borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{
                          height: '100%',
                          width: `${Math.min((stats.yards_per_game / 500) * 100, 100)}%`,
                          backgroundColor: teamColor,
                          borderRadius: 4
                        }} />
                      </View>
                    </View>

                    {/* Passing Yards/Game */}
                    {stats.passing_yards !== undefined && stats.games_played > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                          <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                            Passing Yards/Game
                          </Text>
                          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                            {(stats.passing_yards / stats.games_played).toFixed(0)}
                          </Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: "#333", borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{
                            height: '100%',
                            width: `${Math.min(((stats.passing_yards / stats.games_played) / 350) * 100, 100)}%`,
                            backgroundColor: teamColor,
                            borderRadius: 4
                          }} />
                        </View>
                      </View>
                    )}

                    {/* Rushing Yards/Game */}
                    {stats.rushing_yards !== undefined && stats.games_played > 0 && (
                      <View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                          <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                            Rushing Yards/Game
                          </Text>
                          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                            {(stats.rushing_yards / stats.games_played).toFixed(0)}
                          </Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: "#333", borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{
                            height: '100%',
                            width: `${Math.min(((stats.rushing_yards / stats.games_played) / 300) * 100, 100)}%`,
                            backgroundColor: teamColor,
                            borderRadius: 4
                          }} />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* DEFENSE Section */}
                  <Text style={{
                    color: "#999",
                    fontSize: 12,
                    fontFamily: "NeueHaas-Bold",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 12
                  }}>
                    DEFENSE
                  </Text>
                  <View style={{ backgroundColor: INNER_BG, borderRadius: 12, padding: 16 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                      <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                        Points Allowed/Game
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                        {stats.points_allowed_per_game?.toFixed(1) || "N/A"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                      <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                        Turnovers Forced
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                        {stats.takeaways || "N/A"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                        Sacks
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                        {stats.sacks || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
