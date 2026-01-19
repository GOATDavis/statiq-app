import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import { useRouter } from "expo-router";
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformersResponse | null>(null);
  const [gamePerformers, setGamePerformers] = useState<GameTopPerformersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get dashboard data
      const dashboardResult = await getDashboard();
      setData(dashboardResult);

      // Get season performers
      const performersResult = await getTopPerformers();
      setTopPerformers(performersResult);

      // If we have a last game, fetch its performers
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
      <ScreenLayout scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Roman", marginTop: 12 }}>
            Loading dashboard...
          </Text>
        </View>
      </ScreenLayout>
    );
  };

  // Error state
  if (error || !data) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#FF3636", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>
            Error Loading Dashboard
          </Text>
          <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 20, textAlign: "center", paddingHorizontal: 40 }}>
            {error || "Failed to load data"}
          </Text>
          <Pressable 
            onPress={loadDashboardData}
            style={{ backgroundColor: "#0066cc", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  const { team, last_game, upcoming_game, player_availability } = data;
  const wins = team.record?.split("-")[0] || "0";
  const losses = team.record?.split("-")[1] || "0";

  // Mock standings for now
  const standings = [
    { team: "Highland Park", wins: 5, losses: 0, inPlayoffs: true, movement: "neutral" as const },
    { team: "Red Oak", wins: 4, losses: 1, inPlayoffs: true, movement: "up" as const },
    { team: "Midlothian", wins: 3, losses: 1, inPlayoffs: true, movement: "down" as const },
    { team: "Tyler", wins: 2, losses: 3, inPlayoffs: true, movement: "neutral" as const },
    { team: "Joshua", wins: 1, losses: 4, inPlayoffs: false, movement: "down" as const },
    { team: "Centennial", wins: 2, losses: 3, inPlayoffs: false, movement: "down" as const },
    { team: "Cleburne", wins: 0, losses: 6, inPlayoffs: false, movement: "neutral" as const },
  ];

  return (
    <ScreenLayout scrollable={false}>
      {/* Welcome Header */}
      <Text style={{ color: "#fff", fontSize: 32, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
        Welcome back, Coach Davis.
      </Text>

      {/* Team Banner */}
      <View style={{ backgroundColor: "#0066cc", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold" }}>
          {team.name} {team.mascot}
        </Text>
        <Text style={{ color: "#fff", fontSize: 28, fontFamily: "NeueHaas-Bold" }}>
          {wins}-{losses}
        </Text>
      </View>

      {/* Two column layout */}
      <View style={{ flexDirection: "row", gap: 16, flex: 1 }}>
        
        {/* Left Column */}
        <View style={{ flex: 1, gap: 16 }}>
          
          {/* Last Game Recap */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, height: 150 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                Full Recap vs. {last_game?.opponent || "TBD"}
              </Text>
              {last_game ? (
                <>
                  <Text style={{ color: "#fff", fontSize: 14, marginBottom: 6, fontFamily: "NeueHaas-Roman", lineHeight: 20 }}>
                    <Text style={{ fontFamily: "NeueHaas-Bold" }}>Final Score: </Text>
                    {team.name} {last_game.score[team.name]} - {last_game.opponent} {last_game.score[last_game.opponent]}
                  </Text>
                  <Text style={{ color: "#ccc", fontSize: 13, fontFamily: "NeueHaas-Roman", lineHeight: 18 }}>
                    {last_game.summary}
                  </Text>
                </>
              ) : (
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>No recent game</Text>
              )}
            </View>
            {last_game && (
              <Pressable 
                onPress={() => router.push(`/(coach)/game/${last_game.game_id || 1}`)}
                style={{ backgroundColor: "#0066cc", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignSelf: "flex-start" }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>View Full Recap</Text>
              </Pressable>
            )}
          </View>

          {/* Upcoming Opponent */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, height: 250 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                Upcoming Opponent
              </Text>
              {upcoming_game ? (
                <>
                  <View style={{ 
                    backgroundColor: upcoming_game.background_color || "#f5f0e8", 
                    borderRadius: 12, 
                    padding: 14, 
                    flexDirection: "row", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: 12 
                  }}>
                    <Text style={{ 
                      color: upcoming_game.primary_color || "#8b0000", 
                      fontSize: 24, 
                      fontFamily: "NeueHaas-Bold" 
                    }}>
                      {upcoming_game.opponent}
                    </Text>
                    <Text style={{ 
                      color: upcoming_game.primary_color || "#8b0000", 
                      fontSize: 20, 
                      fontFamily: "NeueHaas-Bold" 
                    }}>
                      2-3
                    </Text>
                  </View>
                  
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold", marginBottom: 3, letterSpacing: 0.3 }}>
                      Key Players:
                    </Text>
                    <Text style={{ color: "#d0d0d0", fontSize: 13, fontFamily: "NeueHaas-Roman", lineHeight: 18 }}>
                      #5 WR Jones - 8 TDs last 3 games
                    </Text>
                  </View>

                  <View>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold", marginBottom: 3, letterSpacing: 0.3 }}>
                      Defensive Trend:
                    </Text>
                    <Text style={{ color: "#d0d0d0", fontSize: 13, fontFamily: "NeueHaas-Roman", lineHeight: 18 }}>
                      Allowing 27.4 PPG (worst in district)
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>No upcoming game</Text>
              )}
            </View>
            {upcoming_game && (
              <Pressable style={{
                backgroundColor: upcoming_game.primary_color || "#8b0000",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 10,
                alignSelf: "flex-start"
              }}>
                <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>View Full Scouting</Text>
              </Pressable>
            )}
          </View>

          {/* Player Availability */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, flex: 1, minHeight: 150 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 10 }}>
              Player Availability
            </Text>

            <View style={{ flexDirection: "row", gap: 14, flex: 1 }}>
              {/* OUT Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FF3636", fontSize: 12, fontFamily: "NeueHaas-Bold", marginBottom: 10, letterSpacing: 0.5 }}>
                  OUT
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {player_availability?.out && player_availability.out.length > 0 ? (
                    player_availability.out.map((player, idx) => (
                      <Text key={idx} style={{ color: "#ccc", fontSize: 12, marginBottom: 6, fontFamily: "NeueHaas-Roman", lineHeight: 17 }}>
                        #{player.number} {player.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>None</Text>
                  )}
                </ScrollView>
              </View>

              {/* LIMITED Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FF9500", fontSize: 12, fontFamily: "NeueHaas-Bold", marginBottom: 10, letterSpacing: 0.5 }}>
                  LIMITED
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {player_availability?.limited && player_availability.limited.length > 0 ? (
                    player_availability.limited.map((player, idx) => (
                      <Text key={idx} style={{ color: "#ccc", fontSize: 12, marginBottom: 6, fontFamily: "NeueHaas-Roman", lineHeight: 17 }}>
                        #{player.number} {player.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>None</Text>
                  )}
                </ScrollView>
              </View>

              {/* CLEARED Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#34C759", fontSize: 12, fontFamily: "NeueHaas-Bold", marginBottom: 10, letterSpacing: 0.5 }}>
                  CLEARED
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {player_availability?.cleared && player_availability.cleared.length > 0 ? (
                    player_availability.cleared.map((player, idx) => (
                      <Text key={idx} style={{ color: "#ccc", fontSize: 12, marginBottom: 6, fontFamily: "NeueHaas-Roman", lineHeight: 17 }}>
                        #{player.number} {player.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>None</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column */}
        <View style={{ flex: 1, gap: 16 }}>
          
          {/* Top Performers vs Last Game */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, height: 280 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>
              Top Performers vs. {last_game?.opponent || "TBD"}
            </Text>

            {gamePerformers && gamePerformers.top_rushers.length > 0 ? (
              <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
                {/* Offensive Player */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#999", fontSize: 10, fontFamily: "NeueHaas-Bold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                    Offensive
                  </Text>
                  <View style={{
                    backgroundColor: "#F3F3F7",
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: team.primary_color || "#0066cc",
                    flex: 1
                  }}>
                    <Text style={{ color: team.primary_color || "#0066cc", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 2 }}>
                      {gamePerformers.top_rushers[0].player_name}
                    </Text>
                    <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 12 }}>
                      {gamePerformers.top_rushers[0].position} | #{gamePerformers.top_rushers[0].jersey}
                    </Text>

                    <View style={{ gap: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          {gamePerformers.top_rushers[0].rushing_yards}
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          YDS
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          22
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          CAR
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          {gamePerformers.top_rushers[0].rushing_tds}
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          TD
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          8.3
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          YPC
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Defensive Player */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#999", fontSize: 10, fontFamily: "NeueHaas-Bold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                    Defensive
                  </Text>
                  <View style={{
                    backgroundColor: "#F3F3F7",
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: team.primary_color || "#0066cc",
                    flex: 1
                  }}>
                    <Text style={{ color: team.primary_color || "#0066cc", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 2 }}>
                      Sergio Mata
                    </Text>
                    <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 12 }}>
                      S | #24
                    </Text>

                    <View style={{ gap: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          13
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          TOT
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          7
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          SOLO
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          1
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          INT
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 32, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                          3
                        </Text>
                        <Text style={{ color: team.primary_color || "#0066cc", fontSize: 14, fontFamily: "NeueHaas-Roman", marginLeft: 6 }}>
                          PD
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Bold", marginBottom: 3 }}>
                  {last_game ? "Loading..." : "Bye Week"}
                </Text>
                <Text style={{ color: "#888", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>
                  {last_game ? "" : "No stats available"}
                </Text>
              </View>
            )}
          </View>

          {/* Playoff Picture */}
          <Pressable 
            onPress={() => router.push('/(coach)/district')}
            style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, flex: 1 }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 10 }}>
              Playoff Picture
            </Text>

            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                {standings.map((s, idx) => (
                <View key={s.team}>
                  <View style={{ 
                    flexDirection: "row", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    paddingVertical: 7, 
                    paddingHorizontal: 10,
                    backgroundColor: s.team === team.name ? "rgba(0, 102, 204, 0.25)" : "transparent", 
                    borderRadius: 8,
                    marginBottom: 1
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                      <Text style={{ 
                        color: s.movement === "up" ? "#34C759" : s.movement === "down" ? "#FF3636" : "#666",
                        fontSize: 16,
                        fontFamily: "NeueHaas-Bold",
                        width: 20,
                        textAlign: "center"
                      }}>
                        {s.movement === "up" ? "↑" : s.movement === "down" ? "↓" : "—"}
                      </Text>
                      <Text style={{ 
                        color: "#fff", 
                        fontSize: 15, 
                        fontFamily: s.team === team.name ? "NeueHaas-Bold" : "NeueHaas-Roman",
                        flex: 1
                      }}>
                        {idx + 1}. {s.team}
                      </Text>
                    </View>
                    <Text style={{ 
                      color: "#fff", 
                      fontSize: 15, 
                      fontFamily: s.team === team.name ? "NeueHaas-Bold" : "NeueHaas-Roman",
                      minWidth: 40,
                      textAlign: "right"
                    }}>
                      {s.wins}-{s.losses}
                    </Text>
                  </View>
                  {idx === 3 && (
                    <View style={{ height: 2, backgroundColor: "#FF3636", marginVertical: 5 }} />
                  )}
                </View>
                ))}
              </View>

              <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#555" }}>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>
                  Top 4 teams qualify for playoffs
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </ScreenLayout>
  );
}