import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../../components/ScreenLayout";
import { getPlayer, type PlayerData } from "../../../src/lib/coach-api";
import { saveRecentSearch } from "../../../src/lib/recent-searches";

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
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
      
      // Save to recent searches
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

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Stats" },
    { id: "games", label: "Games" },
    { id: "highlights", label: "Highlights" },
  ];

  if (loading) {
    return (
      <ScreenLayout title="" subtitle="" scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Roman", marginTop: 12 }}>
            Loading player...
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !player) {
    return (
      <ScreenLayout title="" subtitle="" scrollable={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#FF3636", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 12 }}>
            Error Loading Player
          </Text>
          <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 20, textAlign: "center", paddingHorizontal: 40 }}>
            {error || "Failed to load player data"}
          </Text>
          <Pressable 
            onPress={loadPlayer}
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

  // Helper to get position-specific overview stats
  const getOverviewStats = () => {
    if (!player.stats) return [];
    
    const stats = player.stats;
    
    // QB
    if (player.position === "QB") {
      return [
        { label: "Passing Yards", value: stats.passing_yards?.toLocaleString() || "0" },
        { label: "Pass TDs", value: stats.passing_tds?.toString() || "0" },
        { label: "Completion %", value: stats.passing_completion_pct ? `${stats.passing_completion_pct}%` : "0%" },
        { label: "QB Rating", value: stats.qb_rating?.toFixed(1) || "0.0" },
      ];
    }
    
    // RB
    if (player.position === "RB") {
      return [
        { label: "Rushing Yards", value: stats.rushing_yards?.toLocaleString() || "0" },
        { label: "Rush TDs", value: stats.rushing_tds?.toString() || "0" },
        { label: "Yards/Carry", value: stats.rushing_avg?.toFixed(1) || "0.0" },
        { label: "Long", value: stats.rushing_long?.toString() || "0" },
      ];
    }
    
    // WR/TE/Slot
    if (["WR", "TE", "Slot"].includes(player.position)) {
      return [
        { label: "Receptions", value: stats.receptions?.toString() || "0" },
        { label: "Receiving Yards", value: stats.receiving_yards?.toLocaleString() || "0" },
        { label: "Rec TDs", value: stats.receiving_tds?.toString() || "0" },
        { label: "Yards/Catch", value: stats.receiving_avg?.toFixed(1) || "0.0" },
      ];
    }
    
    // LB/DL
    if (["LB", "DL"].includes(player.position)) {
      return [
        { label: "Tackles", value: stats.tackles?.toString() || "0" },
        { label: "TFL", value: stats.tfl?.toString() || "0" },
        { label: "Sacks", value: stats.sacks?.toFixed(1) || "0.0" },
        { label: "Forced Fumbles", value: stats.forced_fumbles?.toString() || "0" },
      ];
    }
    
    // DB
    if (player.position === "DB") {
      return [
        { label: "Tackles", value: stats.tackles?.toString() || "0" },
        { label: "Interceptions", value: stats.interceptions?.toString() || "0" },
        { label: "Pass Breakups", value: stats.pass_breakups?.toString() || "0" },
        { label: "Forced Fumbles", value: stats.forced_fumbles?.toString() || "0" },
      ];
    }
    
    // K
    if (player.position === "K") {
      return [
        { label: "FG Made", value: stats.fg_made?.toString() || "0" },
        { label: "FG %", value: stats.fg_pct ? `${stats.fg_pct}%` : "0%" },
        { label: "XP Made", value: stats.xp_made?.toString() || "0" },
        { label: "Long FG", value: stats.fg_long?.toString() || "0" },
      ];
    }
    
    return [];
  };

  // Helper to get detailed stats for stats tab
  const getDetailedStats = () => {
    if (!player.stats) return [];
    
    const stats = player.stats;
    const sections = [];
    
    // Passing stats
    if (stats.passing_yards) {
      sections.push({
        title: "Passing",
        stats: [
          { label: "Completions", value: stats.passing_completions },
          { label: "Attempts", value: stats.passing_attempts },
          { label: "Completion %", value: stats.passing_completion_pct ? `${stats.passing_completion_pct}%` : undefined },
          { label: "Yards", value: stats.passing_yards?.toLocaleString() },
          { label: "Touchdowns", value: stats.passing_tds },
          { label: "Interceptions", value: stats.passing_ints },
          { label: "QB Rating", value: stats.qb_rating?.toFixed(1) },
        ].filter(s => s.value !== undefined)
      });
    }
    
    // Rushing stats
    if (stats.rushing_yards) {
      sections.push({
        title: "Rushing",
        stats: [
          { label: "Carries", value: stats.rushing_attempts },
          { label: "Yards", value: stats.rushing_yards?.toLocaleString() },
          { label: "Touchdowns", value: stats.rushing_tds },
          { label: "Yards/Carry", value: stats.rushing_avg?.toFixed(1) },
          { label: "Long", value: stats.rushing_long },
        ].filter(s => s.value !== undefined)
      });
    }
    
    // Receiving stats
    if (stats.receptions) {
      sections.push({
        title: "Receiving",
        stats: [
          { label: "Receptions", value: stats.receptions },
          { label: "Targets", value: stats.targets },
          { label: "Yards", value: stats.receiving_yards?.toLocaleString() },
          { label: "Touchdowns", value: stats.receiving_tds },
          { label: "Yards/Catch", value: stats.receiving_avg?.toFixed(1) },
          { label: "Long", value: stats.receiving_long },
        ].filter(s => s.value !== undefined)
      });
    }
    
    // Defense stats
    if (stats.tackles) {
      sections.push({
        title: "Defense",
        stats: [
          { label: "Tackles", value: stats.tackles },
          { label: "Tackles for Loss", value: stats.tfl },
          { label: "Sacks", value: stats.sacks?.toFixed(1) },
          { label: "QB Hurries", value: stats.qb_hurries },
          { label: "Interceptions", value: stats.interceptions },
          { label: "Pass Breakups", value: stats.pass_breakups },
          { label: "Forced Fumbles", value: stats.forced_fumbles },
        ].filter(s => s.value !== undefined)
      });
    }
    
    // Kicking stats
    if (stats.fg_made !== undefined) {
      sections.push({
        title: "Kicking",
        stats: [
          { label: "FG Made", value: stats.fg_made },
          { label: "FG Attempts", value: stats.fg_attempts },
          { label: "FG %", value: stats.fg_pct ? `${stats.fg_pct}%` : undefined },
          { label: "Long FG", value: stats.fg_long },
          { label: "XP Made", value: stats.xp_made },
          { label: "XP Attempts", value: stats.xp_attempts },
        ].filter(s => s.value !== undefined)
      });
    }
    
    return sections;
  };

  return (
    <ScreenLayout title="" subtitle="" scrollable={false}>
      {/* Compact Search Bar with Back Button */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Pressable 
          onPress={() => router.back()}
          style={{ 
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
        
        <Pressable
          onPress={() => router.push("/(coach)/search")}
          style={{ 
            flex: 1, 
            flexDirection: "row", 
            alignItems: "center", 
            backgroundColor: "#3a3a3a", 
            borderRadius: 12, 
            paddingHorizontal: 16, 
            paddingVertical: 10,
            gap: 10
          }}
        >
          <Ionicons name="search" size={20} color="#999" />
          <Text style={{ 
            flex: 1, 
            color: "#999", 
            fontSize: 16, 
            fontFamily: "NeueHaas-Roman" 
          }}>
            Search players...
          </Text>
        </Pressable>
      </View>

      {/* Player Header */}
      <View style={{ backgroundColor: "#3a3a3a", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: "#0066cc" }}>
            <Text style={{ fontSize: 28, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
              {player.number}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 4 }}>
              {player.name}
            </Text>
            <Text style={{ fontSize: 15, fontFamily: "NeueHaas-Roman", color: "#999" }}>
              {player.position} • {player.class} • {player.team_name} {player.team_mascot}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", backgroundColor: "#2a2a2a", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          {player.height && (
            <>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontFamily: "NeueHaas-Medium", color: "#666", marginBottom: 4 }}>
                  Height
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
                  {player.height}
                </Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: "#444" }} />
            </>
          )}
          {player.weight && (
            <>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontFamily: "NeueHaas-Medium", color: "#666", marginBottom: 4 }}>
                  Weight
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
                  {player.weight}
                </Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: "#444" }} />
            </>
          )}
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 12, fontFamily: "NeueHaas-Medium", color: "#666", marginBottom: 4 }}>
              GPA
            </Text>
            <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
              {player.gpa || "N/A"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable style={{ flex: 1, backgroundColor: "#0066cc", paddingVertical: 12, borderRadius: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
              Edit Profile
            </Text>
          </Pressable>
          <Pressable style={{ flex: 1, backgroundColor: "#2a2a2a", paddingVertical: 12, borderRadius: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontFamily: "NeueHaas-Medium", color: "#fff" }}>
              Share
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: activeTab === tab.id ? "#0066cc" : "#3a3a3a"
            }}
          >
            <Text style={{
              fontSize: 15,
              fontFamily: activeTab === tab.id ? "NeueHaas-Bold" : "NeueHaas-Medium",
              color: "#fff"
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && (
          <View>
            {player.stats && getOverviewStats().length > 0 ? (
              <>
                <Text style={{ fontSize: 18, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 16 }}>
                  2025 Season Stats
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                  {getOverviewStats().map((stat, idx) => (
                    <View key={idx} style={{ width: "48%", backgroundColor: "#3a3a3a", borderRadius: 12, padding: 16, alignItems: "center" }}>
                      <Text style={{ fontSize: 28, fontFamily: "NeueHaas-Bold", marginBottom: 4, color: "#0066cc" }}>
                        {stat.value}
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: "NeueHaas-Medium", color: "#999", textAlign: "center" }}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={{ backgroundColor: "#3a3a3a", borderRadius: 12, padding: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 8 }}>
                  #{player.number} {player.name}
                </Text>
                <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#999" }}>
                  {player.position} • {player.class}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "stats" && (
          <View>
            {getDetailedStats().length > 0 ? (
              getDetailedStats().map((section, sectionIdx) => (
                <View key={sectionIdx}>
                  <Text style={{ fontSize: 18, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 16, marginTop: sectionIdx > 0 ? 32 : 0 }}>
                    {section.title}
                  </Text>
                  <View style={{ backgroundColor: "#3a3a3a", borderRadius: 12, padding: 16 }}>
                    {section.stats.map((stat, idx) => (
                      <View key={idx} style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: 10,
                        borderBottomWidth: idx < section.stats.length - 1 ? 1 : 0,
                        borderBottomColor: "#2a2a2a"
                      }}>
                        <Text style={{ fontSize: 15, fontFamily: "NeueHaas-Roman", color: "#999" }}>
                          {stat.label}
                        </Text>
                        <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Bold", color: "#fff" }}>
                          {stat.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Roman", color: "#999", textAlign: "center", marginTop: 40 }}>
                No stats available
              </Text>
            )}
          </View>
        )}

        {activeTab === "games" && (
          <View>
            {player.games && player.games.length > 0 ? (
              <>
                <Text style={{ fontSize: 18, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 16 }}>
                  2025 Game Log
                </Text>
                <View style={{ gap: 12 }}>
                  {player.games.map((game, idx) => (
                    <Pressable key={idx} style={{ backgroundColor: "#3a3a3a", borderRadius: 12, padding: 16 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <View>
                          <Text style={{ fontSize: 17, fontFamily: "NeueHaas-Bold", color: "#fff", marginBottom: 2 }}>
                            {game.opponent}
                          </Text>
                          <Text style={{ fontSize: 13, fontFamily: "NeueHaas-Roman", color: "#666" }}>
                            {game.date}
                          </Text>
                        </View>
                        <View style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 6,
                          backgroundColor: game.result === "W" ? "rgba(52, 199, 89, 0.2)" : "rgba(255, 54, 54, 0.2)"
                        }}>
                          <Text style={{
                            fontSize: 14,
                            fontFamily: "NeueHaas-Bold",
                            color: game.result === "W" ? "#34C759" : "#FF3636"
                          }}>
                            {game.result} {game.team_score}-{game.opponent_score}
                          </Text>
                        </View>
                      </View>
                      <View style={{ gap: 4 }}>
                        {game.passing_yards && (
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#d0d0d0" }}>
                            Passing: {game.passing_completions}/{game.passing_attempts}, {game.passing_yards} yds, {game.passing_tds} TD
                          </Text>
                        )}
                        {game.rushing_yards && (
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#d0d0d0" }}>
                            Rushing: {game.rushing_yards} yds{game.rushing_tds ? `, ${game.rushing_tds} TD` : ""}
                          </Text>
                        )}
                        {game.receiving_yards && (
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#d0d0d0" }}>
                            Receiving: {game.receptions} rec, {game.receiving_yards} yds{game.receiving_tds ? `, ${game.receiving_tds} TD` : ""}
                          </Text>
                        )}
                        {game.tackles && (
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#d0d0d0" }}>
                            Defense: {game.tackles} tackles{game.tfl ? `, ${game.tfl} TFL` : ""}{game.sacks ? `, ${game.sacks} sacks` : ""}
                          </Text>
                        )}
                        {game.fg_made !== undefined && (
                          <Text style={{ fontSize: 14, fontFamily: "NeueHaas-Roman", color: "#d0d0d0" }}>
                            Kicking: {game.fg_made}/{game.fg_attempts} FG, {game.xp_made}/{game.xp_attempts} XP
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Roman", color: "#999", textAlign: "center", marginTop: 40 }}>
                No games available
              </Text>
            )}
          </View>
        )}

        {activeTab === "highlights" && (
          <View>
            <Text style={{ fontSize: 16, fontFamily: "NeueHaas-Roman", color: "#999", textAlign: "center", marginTop: 40 }}>
              Highlights coming soon
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
