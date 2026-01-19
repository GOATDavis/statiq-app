import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import ScreenLayout from "../../../components/ScreenLayout";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getGameRecap, type GameRecapData } from "../../../src/lib/coach-api";



export default function GameRecapScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<GameRecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"team" | "passing" | "rushing" | "receiving" | "defense">("team");

  useEffect(() => {
    loadGameRecap();
  }, [id]);

  const loadGameRecap = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGameRecap(Number(id));
      setData(result);
    } catch (err) {
      setError((err as Error).message);
      console.error("Game recap load error:", err);
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
            Loading game recap...
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
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#3a3a3a",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          
          <Ionicons name="american-football-outline" size={64} color="#555" style={{ marginBottom: 16 }} />
          <Text style={{ color: "#fff", fontSize: 22, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
            Game Recap Coming Soon
          </Text>
          <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 24, textAlign: "center", paddingHorizontal: 40 }}>
            Full game recaps will be available when the season begins.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ backgroundColor: "#b4d836", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
          >
            <Text style={{ color: "#1a1a1a", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  const { home_team, away_team, quarter_scores, team_stats, scoring_plays, passing, rushing, receiving, defense } = data;
  const isHomeWin = home_team.score > away_team.score;
  const gameDate = new Date(data.game_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Stat comparison row component
  const StatRow = ({ label, home, away, highlight = false }: { label: string; home: string | number; away: string | number; highlight?: boolean }) => (
    <View style={{ 
      flexDirection: "row", 
      alignItems: "center", 
      paddingVertical: 10, 
      borderBottomWidth: 1, 
      borderBottomColor: "#444",
      backgroundColor: highlight ? "rgba(0, 102, 204, 0.1)" : "transparent",
      paddingHorizontal: 12,
      marginHorizontal: -12,
    }}>
      <Text style={{ flex: 1, color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{home}</Text>
      <Text style={{ flex: 2, color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ flex: 1, color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{away}</Text>
    </View>
  );

  // Player stat table component
  const PlayerStatTable = ({ 
    title, 
    headers, 
    homePlayers, 
    awayPlayers, 
    renderRow 
  }: { 
    title: string; 
    headers: string[]; 
    homePlayers: any[]; 
    awayPlayers: any[]; 
    renderRow: (player: any, isHome: boolean) => React.ReactNode;
  }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>{title}</Text>
      
      {/* Home team section */}
      <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
        <View style={{ 
          backgroundColor: home_team.primary_color, 
          paddingVertical: 8, 
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8
        }}>
          <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>{home_team.name}</Text>
        </View>
        
        {/* Header row */}
        <View style={{ flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#444" }}>
          <Text style={{ flex: 2, color: "#888", fontSize: 11, fontFamily: "NeueHaas-Bold", textTransform: "uppercase" }}>Player</Text>
          {headers.map((h, i) => (
            <Text key={i} style={{ width: 40, color: "#888", fontSize: 11, fontFamily: "NeueHaas-Bold", textAlign: "center", textTransform: "uppercase" }}>{h}</Text>
          ))}
        </View>
        
        {homePlayers.map((player, idx) => (
          <View key={idx} style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: idx < homePlayers.length - 1 ? 1 : 0, borderBottomColor: "#3a3a3a" }}>
            {renderRow(player, true)}
          </View>
        ))}
      </View>
      
      {/* Away team section */}
      <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, overflow: "hidden" }}>
        <View style={{ 
          backgroundColor: away_team.primary_color, 
          paddingVertical: 8, 
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8
        }}>
          <Text style={{ color: away_team.primary_color === "#FFD700" ? "#333" : "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>{away_team.name}</Text>
        </View>
        
        {/* Header row */}
        <View style={{ flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#444" }}>
          <Text style={{ flex: 2, color: "#888", fontSize: 11, fontFamily: "NeueHaas-Bold", textTransform: "uppercase" }}>Player</Text>
          {headers.map((h, i) => (
            <Text key={i} style={{ width: 40, color: "#888", fontSize: 11, fontFamily: "NeueHaas-Bold", textAlign: "center", textTransform: "uppercase" }}>{h}</Text>
          ))}
        </View>
        
        {awayPlayers.map((player, idx) => (
          <View key={idx} style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: idx < awayPlayers.length - 1 ? 1 : 0, borderBottomColor: "#3a3a3a" }}>
            {renderRow(player, false)}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenLayout scrollable={false}>
      {/* Back Button */}
      <Pressable 
        onPress={() => router.back()} 
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <Ionicons name="chevron-back" size={24} color="#0066cc" />
        <Text style={{ color: "#0066cc", fontSize: 16, fontFamily: "NeueHaas-Bold", marginLeft: 4 }}>Dashboard</Text>
      </Pressable>

      {/* Game Header - Final Score */}
      <View style={{ backgroundColor: "#262626", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: "#888", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
          Final
        </Text>
        <Text style={{ color: "#666", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center", marginBottom: 16 }}>
          {gameDate} • {data.location}
        </Text>
        
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          {/* Away Team */}
          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: away_team.background_color,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 8,
              borderWidth: 2,
              borderColor: away_team.primary_color
            }}>
              <Text style={{ color: away_team.primary_color, fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                {away_team.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>{away_team.name}</Text>
            <Text style={{ 
              color: !isHomeWin ? "#B4D836" : "#fff", 
              fontSize: 42, 
              fontFamily: "NeueHaas-Bold",
              lineHeight: 48
            }}>
              {away_team.score}
            </Text>
          </View>
          
          {/* VS Divider */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: "#555", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>@</Text>
          </View>
          
          {/* Home Team */}
          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: home_team.background_color,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 8,
              borderWidth: 2,
              borderColor: home_team.primary_color
            }}>
              <Text style={{ color: home_team.primary_color, fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                {home_team.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>{home_team.name}</Text>
            <Text style={{ 
              color: isHomeWin ? "#B4D836" : "#fff", 
              fontSize: 42, 
              fontFamily: "NeueHaas-Bold",
              lineHeight: 48
            }}>
              {home_team.score}
            </Text>
          </View>
        </View>

        {/* Quarter Scores */}
        <View style={{ flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#444" }}>
          <View style={{ flex: 1 }} />
          {["1ST", "2ND", "3RD", "4TH", "T"].map((q, i) => (
            <View key={q} style={{ width: 40, alignItems: "center" }}>
              <Text style={{ color: "#666", fontSize: 10, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>{q}</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Roman", marginBottom: 4 }}>
                {i < 4 ? quarter_scores.away[i] : away_team.score}
              </Text>
              <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                {i < 4 ? quarter_scores.home[i] : home_team.score}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={{ flexDirection: "row", marginBottom: 16, backgroundColor: "#2a2a2a", borderRadius: 12, padding: 4 }}>
        {[
          { key: "team", label: "Team Stats" },
          { key: "passing", label: "Passing" },
          { key: "rushing", label: "Rushing" },
          { key: "receiving", label: "Receiving" },
          { key: "defense", label: "Defense" },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setSelectedTab(tab.key as any)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: selectedTab === tab.key ? "#0066cc" : "transparent",
            }}
          >
            <Text style={{ 
              color: selectedTab === tab.key ? "#fff" : "#888", 
              fontSize: 12, 
              fontFamily: "NeueHaas-Bold", 
              textAlign: "center" 
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Team Stats Tab */}
        {selectedTab === "team" && (
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 16 }}>
            {/* Team Headers */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#555" }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ 
                  backgroundColor: home_team.primary_color, 
                  paddingVertical: 6, 
                  paddingHorizontal: 14, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>{home_team.name}</Text>
                </View>
              </View>
              <View style={{ flex: 2 }} />
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ 
                  backgroundColor: away_team.primary_color, 
                  paddingVertical: 6, 
                  paddingHorizontal: 14, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: away_team.primary_color === "#FFD700" ? "#333" : "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>{away_team.name}</Text>
                </View>
              </View>
            </View>

            <StatRow label="Total Yards" home={team_stats.home.total_yards} away={team_stats.away.total_yards} highlight />
            <StatRow label="Passing Yards" home={team_stats.home.passing_yards} away={team_stats.away.passing_yards} />
            <StatRow label="Rushing Yards" home={team_stats.home.rushing_yards} away={team_stats.away.rushing_yards} />
            <StatRow label="First Downs" home={team_stats.home.first_downs} away={team_stats.away.first_downs} />
            <StatRow label="3rd Down" home={team_stats.home.third_down_conv} away={team_stats.away.third_down_conv} />
            <StatRow label="4th Down" home={team_stats.home.fourth_down_conv} away={team_stats.away.fourth_down_conv} />
            <StatRow label="Turnovers" home={team_stats.home.turnovers} away={team_stats.away.turnovers} />
            <StatRow label="Penalties" home={team_stats.home.penalties} away={team_stats.away.penalties} />
            <StatRow label="Time of Possession" home={team_stats.home.time_of_possession} away={team_stats.away.time_of_possession} />

            {/* Scoring Summary */}
            <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold", marginTop: 24, marginBottom: 12 }}>Scoring Summary</Text>
            
            {[1, 2, 3, 4].map((quarter) => {
              const quarterPlays = scoring_plays.filter(p => p.quarter === quarter);
              if (quarterPlays.length === 0) return null;
              
              return (
                <View key={quarter} style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 11, fontFamily: "NeueHaas-Bold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                    {quarter === 1 ? "1st" : quarter === 2 ? "2nd" : quarter === 3 ? "3rd" : "4th"} Quarter
                  </Text>
                  {quarterPlays.map((play, idx) => (
                    <View key={idx} style={{ 
                      backgroundColor: "#2a2a2a", 
                      borderRadius: 10, 
                      padding: 12, 
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: play.team === home_team.name ? home_team.primary_color : away_team.primary_color
                    }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>{play.team}</Text>
                        <Text style={{ color: "#888", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>{play.time}</Text>
                      </View>
                      <Text style={{ color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", marginBottom: 6 }}>{play.description}</Text>
                      <Text style={{ color: "#666", fontSize: 11, fontFamily: "NeueHaas-Bold" }}>
                        {away_team.name} {play.away_score} - {home_team.name} {play.home_score}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Passing Tab */}
        {selectedTab === "passing" && (
          <View style={{ paddingBottom: 20 }}>
            <PlayerStatTable
              title="Passing"
              headers={["C/A", "YDS", "TD", "INT"]}
              homePlayers={passing.home}
              awayPlayers={passing.away}
              renderRow={(player) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>#{player.jersey} {player.name}</Text>
                  </View>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.completions}/{player.attempts}</Text>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.yards}</Text>
                  <Text style={{ width: 40, color: player.tds > 0 ? "#B4D836" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.tds}</Text>
                  <Text style={{ width: 40, color: player.ints > 0 ? "#FF3636" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.ints}</Text>
                </>
              )}
            />
          </View>
        )}

        {/* Rushing Tab */}
        {selectedTab === "rushing" && (
          <View style={{ paddingBottom: 20 }}>
            <PlayerStatTable
              title="Rushing"
              headers={["CAR", "YDS", "TD", "AVG"]}
              homePlayers={rushing.home}
              awayPlayers={rushing.away}
              renderRow={(player) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>#{player.jersey} {player.name}</Text>
                  </View>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.carries}</Text>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.yards}</Text>
                  <Text style={{ width: 40, color: player.tds > 0 ? "#B4D836" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.tds}</Text>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.avg.toFixed(1)}</Text>
                </>
              )}
            />
          </View>
        )}

        {/* Receiving Tab */}
        {selectedTab === "receiving" && (
          <View style={{ paddingBottom: 20 }}>
            <PlayerStatTable
              title="Receiving"
              headers={["REC", "YDS", "TD", "AVG"]}
              homePlayers={receiving.home}
              awayPlayers={receiving.away}
              renderRow={(player) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>#{player.jersey} {player.name}</Text>
                  </View>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.receptions}</Text>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.yards}</Text>
                  <Text style={{ width: 40, color: player.tds > 0 ? "#B4D836" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.tds}</Text>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.avg.toFixed(1)}</Text>
                </>
              )}
            />
          </View>
        )}

        {/* Defense Tab */}
        {selectedTab === "defense" && (
          <View style={{ paddingBottom: 20 }}>
            <PlayerStatTable
              title="Defense"
              headers={["TOT", "TFL", "SCK", "INT"]}
              homePlayers={defense.home}
              awayPlayers={defense.away}
              renderRow={(player) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontFamily: "NeueHaas-Bold" }}>#{player.jersey} {player.name}</Text>
                  </View>
                  <Text style={{ width: 40, color: "#ccc", fontSize: 12, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>{player.tackles}</Text>
                  <Text style={{ width: 40, color: player.tfl > 0 ? "#B4D836" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.tfl}</Text>
                  <Text style={{ width: 40, color: player.sacks > 0 ? "#B4D836" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.sacks}</Text>
                  <Text style={{ width: 40, color: player.ints > 0 ? "#B4D836" : "#ccc", fontSize: 12, fontFamily: "NeueHaas-Bold", textAlign: "center" }}>{player.ints}</Text>
                </>
              )}
            />
          </View>
        )}

      </ScrollView>
    </ScreenLayout>
  );
}
