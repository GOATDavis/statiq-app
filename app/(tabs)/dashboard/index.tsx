import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import ScreenLayout from "../../../components/ScreenLayout";

// TypeScript interfaces for API data
interface TeamData {
  id: string;
  name: string;
  mascot: string;
  city?: string;
  record?: string;
  logo_url?: string;
}

interface LastGameData {
  date: string;
  opponent: string;
  location: "Home" | "Away" | "Neutral";
  score: { [key: string]: number };
  result: "W" | "L" | "T";
  summary?: string;
}

interface UpcomingGameData {
  date: string;
  opponent: string;
  location: "Home" | "Away" | "Neutral";
  kickoff_time?: string;
  preview?: string;
  primary_color?: string;
  background_color?: string;
}

interface PlayerAvailabilityItem {
  number: number;
  name: string;
  position?: string;
  note?: string;
}

interface PlayerAvailabilityData {
  out: PlayerAvailabilityItem[];
  limited: PlayerAvailabilityItem[];
  cleared: PlayerAvailabilityItem[];
}

interface KeyPerformerData {
  player_id: string;
  name: string;
  position?: string;
  statline: string;
}

interface DashboardData {
  team: TeamData;
  last_game?: LastGameData;
  upcoming_game?: UpcomingGameData;
  player_availability?: PlayerAvailabilityData;
  key_performers?: KeyPerformerData[];
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://192.168.1.197:8000/api/v1/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
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
  }

  // Error state
  if (error || !data) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#FF5A5A", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>
            Error Loading Dashboard
          </Text>
          <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 20 }}>
            {error || "Failed to load data"}
          </Text>
          <Pressable 
            onPress={loadDashboardData}
            style={{ backgroundColor: "#0066cc", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  const { team, last_game, upcoming_game, player_availability, key_performers } = data;
  const wins = team.record?.split("-")[0] || "0";
  const losses = team.record?.split("-")[1] || "0";

  // Mock standings for now
  const standings = [
    { team: "Highland Park", wins: 5, losses: 0, inPlayoffs: true, movement: "neutral" as const },
    { team: "Red Oak", wins: 4, losses: 1, inPlayoffs: true, movement: "up" as const },
    { team: "Midlothian", wins: 3, losses: 1, inPlayoffs: true, movement: "down" as const },
    { team: "Tyler", wins: 2, losses: 3, inPlayoffs: true, movement: "up" as const },
    { team: "Joshua", wins: 1, losses: 4, inPlayoffs: false, movement: "down" as const },
    { team: "Centennial", wins: 2, losses: 3, inPlayoffs: false, movement: "neutral" as const },
    { team: "Cleburne", wins: 0, losses: 6, inPlayoffs: false, movement: "neutral" as const },
  ];

  return (
    <ScreenLayout scrollable={false}>
      {/* Welcome Header */}
      <Text style={{ color: "#fff", fontSize: 32, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
        Welcome back, Coach Davis.
      </Text>

      {/* Team Banner */}
      <View style={{ backgroundColor: "#0066cc", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold" }}>
          {team.name} {team.mascot}
        </Text>
        <Text style={{ color: "#fff", fontSize: 28, fontFamily: "NeueHaas-Bold" }}>
          {wins}-{losses}
        </Text>
      </View>

      {/* Two column layout */}
      <View style={{ flexDirection: "row", gap: 20, flex: 1 }}>
        
        {/* Left Column */}
        <View style={{ flex: 1, gap: 20 }}>
          
          {/* Last Game Recap - FIXED HEIGHT */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, height: 160 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
              Full Recap vs. {last_game?.opponent || "TBD"}
            </Text>
            <View style={{ borderTopWidth: 1, borderTopColor: "#555", paddingTop: 10, marginTop: 6 }}>
              {last_game ? (
                <>
                  <Text style={{ color: "#fff", fontSize: 15, marginBottom: 6, fontFamily: "NeueHaas-Roman" }}>
                    <Text style={{ fontFamily: "NeueHaas-Bold" }}>Result: </Text>
                    {last_game.result} - {last_game.summary}
                  </Text>
                  <Pressable style={{ backgroundColor: "#0066cc", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, alignSelf: "flex-start" }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>View Full Recap</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={{ color: "#666", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>No recent game</Text>
              )}
            </View>
          </View>

          {/* Upcoming Opponent - FIXED HEIGHT */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, height: 240 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold", marginBottom: 10 }}>
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
                  marginBottom: 10 
                }}>
                  <Text style={{ 
                    color: upcoming_game.primary_color || "#000", 
                    fontSize: 28, 
                    fontFamily: "NeueHaas-Bold" 
                  }}>
                    {upcoming_game.opponent}
                  </Text>
                  <Text style={{ 
                    color: upcoming_game.primary_color || "#000", 
                    fontSize: 24, 
                    fontFamily: "NeueHaas-Bold" 
                  }}>
                    {upcoming_game.location}
                  </Text>
                </View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold", marginBottom: 3 }}>Preview:</Text>
                  <Text style={{ color: "#ccc", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                    {upcoming_game.preview || "District rivalry"}
                  </Text>
                </View>
                <Pressable style={{ 
                  backgroundColor: upcoming_game.primary_color || "#8b0000", 
                  paddingVertical: 10, 
                  paddingHorizontal: 18, 
                  borderRadius: 10, 
                  alignSelf: "flex-start" 
                }}>
                  <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>View Full Scouting</Text>
                </Pressable>
              </>
            ) : (
              <Text style={{ color: "#666", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>No upcoming game</Text>
            )}
          </View>

          {/* Player Availability - FIXED HEIGHT */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>
              Player Availability
            </Text>

            <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
              {/* OUT Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FF5A5A", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>OUT:</Text>
                <ScrollView>
                  {player_availability?.out && player_availability.out.length > 0 ? (
                    player_availability.out.map((player, idx) => (
                      <Text key={idx} style={{ color: "#ccc", fontSize: 13, marginBottom: 4, fontFamily: "NeueHaas-Roman" }}>
                        #{player.number} {player.name} ({player.position})
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: "#666", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>None</Text>
                  )}
                </ScrollView>
              </View>

              {/* LIMITED Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFD700", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>LIMITED:</Text>
                <ScrollView>
                  {player_availability?.limited && player_availability.limited.length > 0 ? (
                    player_availability.limited.map((player, idx) => (
                      <Text key={idx} style={{ color: "#ccc", fontSize: 13, marginBottom: 4, fontFamily: "NeueHaas-Roman" }}>
                        #{player.number} {player.name} ({player.position})
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: "#666", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>None</Text>
                  )}
                </ScrollView>
              </View>

              {/* CLEARED Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#5FD35F", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>CLEARED:</Text>
                <ScrollView>
                  {player_availability?.cleared && player_availability.cleared.length > 0 ? (
                    player_availability.cleared.map((player, idx) => (
                      <Text key={idx} style={{ color: "#ccc", fontSize: 13, marginBottom: 4, fontFamily: "NeueHaas-Roman" }}>
                        #{player.number} {player.name} ({player.position})
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: "#666", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>None</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column */}
        <View style={{ flex: 1, gap: 20 }}>
          
          {/* Top Performers - FIXED HEIGHT */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16, height: 300 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>
              Top Performers
            </Text>
            
            {key_performers && key_performers.length > 0 ? (
              <ScrollView>
                {key_performers.map((performer, idx) => (
                  <View key={idx} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ width: 60, height: 60, backgroundColor: "#ddd", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 30 }}>👤</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#999", fontSize: 10, fontFamily: "NeueHaas-Roman" }}>{performer.position}</Text>
                        <Text style={{ color: "#000", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>{performer.name}</Text>
                        <Text style={{ color: "#666", fontSize: 11, marginTop: 2, fontFamily: "NeueHaas-Roman" }}>
                          {performer.statline}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#666", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                  Bye Week
                </Text>
                <Text style={{ color: "#888", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                  No stats available
                </Text>
              </View>
            )}
          </View>

          {/* Playoff Picture - FILLS REMAINING SPACE */}
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 17, flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold", marginBottom: 10 }}>
              Playoff Picture
            </Text>
            <View style={{ borderTopWidth: 1, borderTopColor: "#555", paddingTop: 9 }}>
              {standings.map((s, idx) => (
                <View key={s.team}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, backgroundColor: s.team === team.name ? "#0066cc33" : "transparent", paddingHorizontal: 8, borderRadius: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {s.movement === "up" && <Text style={{ color: "#5FD35F", fontSize: 16 }}>↑</Text>}
                      {s.movement === "down" && <Text style={{ color: "#E74C3C", fontSize: 16 }}>↓</Text>}
                      {s.movement === "neutral" && <Text style={{ color: "#888", fontSize: 16 }}>—</Text>}
                      <Text style={{ color: "#fff", fontSize: 15, fontFamily: s.team === team.name ? "NeueHaas-Bold" : "NeueHaas-Roman" }}>
                        {idx + 1}. {s.team}
                      </Text>
                    </View>
                    <Text style={{ color: "#fff", fontSize: 15, fontFamily: s.team === team.name ? "NeueHaas-Bold" : "NeueHaas-Roman" }}>
                      {s.wins}-{s.losses}
                    </Text>
                  </View>
                  {idx === 3 && (
                    <View style={{ height: 2, backgroundColor: "#E74C3C", marginVertical: 5 }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}