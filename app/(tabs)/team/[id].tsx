import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import ScreenLayout from "../../../components/ScreenLayout";
import { getTeamColors } from "../../../src/constants/team-colors";

export default function TeamProfileScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = React.useState("overview");

  // Get team colors dynamically
  const teamColors = getTeamColors(typeof id === 'string' ? id : 'joshua');

  // Team data
  const team = {
    id,
    name: teamColors.name,
    mascot: teamColors.mascot,
    colors: {
      primary: teamColors.primary,
      secondary: teamColors.secondary || "#FFFFFF"
    },
    location: "Joshua, TX",
    conference: "District 5A-1",
    classification: "5A Division I",
    headCoach: "Danny DeArman",
    record: "8-2",
    district: "5-1",
    ranking: {
      state: 12,
      district: 2
    }
  };

  const seasonStats = {
    pointsFor: 412,
    pointsAgainst: 238,
    totalYards: 4247,
    passingYards: 2847,
    rushingYards: 1400,
    turnovers: 12
  };

  const schedule = [
    { week: 1, opponent: "Cleburne", result: "W 42-21", date: "Aug 30" },
    { week: 2, opponent: "@ Burleson", result: "W 35-28", date: "Sep 6" },
    { week: 3, opponent: "Waxahachie", result: "L 28-31", date: "Sep 13" },
    { week: 4, opponent: "@ Mansfield", result: "W 31-17", date: "Sep 20" },
    { week: 5, opponent: "Midlothian", result: "W 38-24", date: "Sep 27" },
    { week: 6, opponent: "@ Red Oak", result: "W 45-14", date: "Oct 4" },
    { week: 7, opponent: "Ennis", result: "W 28-21", date: "Oct 11" },
    { week: 8, opponent: "@ Corsicana", result: "W 35-17", date: "Oct 18" },
    { week: 9, opponent: "Aledo", result: "L 21-35", date: "Oct 25" },
    { week: 10, opponent: "Highland Park", result: "W 42-28", date: "Nov 1" },
  ];

  const roster = [
    { number: "7", name: "Brayden Payne", position: "QB", class: "Senior", stats: "2,847 yds, 32 TD" },
    { number: "22", name: "Esteban Salas", position: "RB", class: "Junior", stats: "1,124 yds, 14 TD" },
    { number: "8", name: "Joe Strother", position: "WR", class: "Senior", stats: "847 yds, 12 TD" },
    { number: "44", name: "Taji Matthews", position: "LB", class: "Senior", stats: "94 tackles, 8 sacks" },
    { number: "3", name: "Marcus Wilson", position: "DB", class: "Junior", stats: "5 INT, 42 tackles" },
    { number: "55", name: "Jake Thompson", position: "OL", class: "Senior", stats: "All-District" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "roster", label: "Roster" },
    { id: "schedule", label: "Schedule" },
    { id: "stats", label: "Stats" },
  ];

  return (
    <ScreenLayout 
      title={`${team.name} ${team.mascot}`}
      subtitle={`${team.record} • ${team.conference}`}
      scrollable={false}
    >
      <View style={{ flex: 1 }}>
        {/* Team Header Card */}
        <View style={{ 
          backgroundColor: "#2a2a2a", 
          borderRadius: 16, 
          padding: 24,
          marginBottom: 24,
          flexDirection: "row",
          gap: 20
        }}>
          {/* Team Logo */}
          <View style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 12, 
            backgroundColor: team.colors.primary,
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Text style={{ fontSize: 48 }}>🦉</Text>
          </View>

          {/* Team Info */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold" }}>
                {team.name} {team.mascot}
              </Text>
              <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                {team.classification} • {team.location}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 20 }}>
              <View>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>Head Coach</Text>
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>{team.headCoach}</Text>
              </View>
              <View>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>Conference</Text>
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>{team.conference}</Text>
              </View>
              <View>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>State Rank</Text>
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>#{team.ranking.state}</Text>
              </View>
            </View>
          </View>

          {/* Record Display */}
          <View style={{ justifyContent: "center", alignItems: "center", gap: 8 }}>
            <View style={{ 
              backgroundColor: team.colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              alignItems: "center"
            }}>
              <Text style={{ color: "#000", fontSize: 28, fontFamily: "NeueHaas-Bold", lineHeight: 32 }}>
                {team.record}
              </Text>
              <Text style={{ color: "#000", fontSize: 12, fontFamily: "NeueHaas-Medium" }}>
                Overall
              </Text>
            </View>
            <View style={{ 
              backgroundColor: "#3a3a3a",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: "center"
            }}>
              <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                {team.district}
              </Text>
              <Text style={{ color: "#999", fontSize: 11, fontFamily: "NeueHaas-Roman" }}>
                District
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ 
          flexDirection: "row", 
          gap: 8, 
          marginBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: "#2a2a2a"
        }}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.id ? team.colors.primary : "transparent",
              }}
            >
              <Text style={{ 
                color: activeTab === tab.id ? "#fff" : "#999", 
                fontSize: 16, 
                fontFamily: activeTab === tab.id ? "NeueHaas-Bold" : "NeueHaas-Roman"
              }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {activeTab === "overview" && (
            <View style={{ gap: 24 }}>
              {/* Season Stats Cards */}
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  2024 Season Stats
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  {[
                    { label: "Points For", value: seasonStats.pointsFor.toString() },
                    { label: "Points Against", value: seasonStats.pointsAgainst.toString() },
                    { label: "Total Yards", value: seasonStats.totalYards.toLocaleString() },
                    { label: "Passing Yards", value: seasonStats.passingYards.toLocaleString() },
                    { label: "Rushing Yards", value: seasonStats.rushingYards.toLocaleString() },
                    { label: "Turnovers", value: seasonStats.turnovers.toString() },
                  ].map((stat, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        width: "31%",
                        backgroundColor: "#2a2a2a", 
                        borderRadius: 12, 
                        padding: 20,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ color: team.colors.primary, fontSize: 28, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                        {stat.value}
                      </Text>
                      <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Games */}
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Recent Games
                </Text>
                <View style={{ gap: 12 }}>
                  {schedule.slice(-4).reverse().map((game, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        backgroundColor: "#2a2a2a", 
                        borderRadius: 12, 
                        padding: 18,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                          Week {game.week} • {game.opponent}
                        </Text>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          {game.date}
                        </Text>
                      </View>
                      <View style={{ 
                        paddingVertical: 6, 
                        paddingHorizontal: 16, 
                        borderRadius: 6,
                        backgroundColor: game.result.startsWith("W") ? "#1a3a1a" : "#3a1a1a"
                      }}>
                        <Text style={{ 
                          color: game.result.startsWith("W") ? "#4ade80" : "#f87171", 
                          fontSize: 15, 
                          fontFamily: "NeueHaas-Bold" 
                        }}>
                          {game.result}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Top Players */}
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Top Players
                </Text>
                <View style={{ gap: 12 }}>
                  {roster.slice(0, 4).map((player, idx) => (
                    <Pressable 
                      key={idx}
                      onPress={() => router.push(`/player/${player.number}`)}
                      style={{ 
                        backgroundColor: "#2a2a2a", 
                        borderRadius: 12, 
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16
                      }}
                    >
                      <View style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 24, 
                        backgroundColor: team.colors.primary,
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Text style={{ color: "#000", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>
                          #{player.number}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 2 }}>
                          {player.name}
                        </Text>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          {player.position} • {player.class}
                        </Text>
                      </View>
                      <Text style={{ color: team.colors.primary, fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
                        {player.stats}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === "roster" && (
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                  Full Roster
                </Text>
                <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                  {roster.length} Players
                </Text>
              </View>
              
              <View style={{ gap: 12 }}>
                {roster.map((player, idx) => (
                  <Pressable 
                    key={idx}
                    onPress={() => router.push(`/player/${player.number}`)}
                    style={{ 
                      backgroundColor: "#2a2a2a", 
                      borderRadius: 12, 
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16
                    }}
                  >
                    <View style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 24, 
                      backgroundColor: team.colors.primary,
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Text style={{ color: "#000", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>
                        #{player.number}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 2 }}>
                        {player.name}
                      </Text>
                      <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                        {player.position} • {player.class}
                      </Text>
                    </View>
                    <Text style={{ color: team.colors.primary, fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
                      {player.stats}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === "schedule" && (
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                2024 Schedule
              </Text>
              <View style={{ gap: 12 }}>
                {schedule.map((game, idx) => (
                  <View 
                    key={idx}
                    style={{ 
                      backgroundColor: "#2a2a2a", 
                      borderRadius: 12, 
                      padding: 18
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
                          <View style={{ 
                            backgroundColor: "#3a3a3a",
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Bold" }}>
                              WK {game.week}
                            </Text>
                          </View>
                          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold" }}>
                            {game.opponent}
                          </Text>
                        </View>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          {game.date}
                        </Text>
                      </View>
                      <View style={{ 
                        paddingVertical: 8, 
                        paddingHorizontal: 16, 
                        borderRadius: 8,
                        backgroundColor: game.result.startsWith("W") ? "#1a3a1a" : "#3a1a1a",
                        minWidth: 80,
                        alignItems: "center"
                      }}>
                        <Text style={{ 
                          color: game.result.startsWith("W") ? "#4ade80" : "#f87171", 
                          fontSize: 16, 
                          fontFamily: "NeueHaas-Bold" 
                        }}>
                          {game.result}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === "stats" && (
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                Team Statistics
              </Text>
              
              {/* Offense */}
              <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Offense
                </Text>
                <View style={{ gap: 12 }}>
                  {[
                    { label: "Points Per Game", value: "41.2" },
                    { label: "Total Yards Per Game", value: "424.7" },
                    { label: "Passing Yards Per Game", value: "284.7" },
                    { label: "Rushing Yards Per Game", value: "140.0" },
                    { label: "3rd Down Conversion %", value: "48.2%" },
                    { label: "Red Zone Efficiency", value: "87.5%" },
                  ].map((stat, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        paddingVertical: 8,
                        borderBottomWidth: idx < 5 ? 1 : 0,
                        borderBottomColor: "#3a3a3a"
                      }}
                    >
                      <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                        {stat.label}
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                        {stat.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Defense */}
              <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Defense
                </Text>
                <View style={{ gap: 12 }}>
                  {[
                    { label: "Points Allowed Per Game", value: "23.8" },
                    { label: "Total Yards Allowed", value: "312.4" },
                    { label: "Sacks", value: "28" },
                    { label: "Interceptions", value: "14" },
                    { label: "Forced Fumbles", value: "9" },
                    { label: "3rd Down Defense %", value: "35.7%" },
                  ].map((stat, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        paddingVertical: 8,
                        borderBottomWidth: idx < 5 ? 1 : 0,
                        borderBottomColor: "#3a3a3a"
                      }}
                    >
                      <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                        {stat.label}
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
                        {stat.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}