import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ScreenLayout from "../../../components/ScreenLayout";
import { getTeamColorByName } from "../../../src/constants/team-colors";

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = React.useState("overview");

  // In real app, fetch player data based on id
  // const playerData = await fetchPlayer(id);

  // Player data
  const player = {
    id,
    name: "Brayden Payne",
    number: "7",
    position: "QB",
    class: "Senior",
    height: "6'2\"",
    weight: "195 lbs",
    team: "Joshua Owls",
    teamColor: getTeamColorByName("Joshua"), // Get team color dynamically
    gpa: "3.8",
  };

  const stats = {
    passingYards: "2,847",
    touchdowns: "32",
    completionRate: "68.5%",
    qbRating: "142.3",
  };

  const recentGames = [
    { opponent: "vs Highland Park", date: "Oct 18, 2024", result: "W 35-28", passing: "287 yds, 3 TD", rushing: "45 yds, 1 TD" },
    { opponent: "@ Aledo", date: "Oct 11, 2024", result: "L 21-24", passing: "312 yds, 2 TD", rushing: "28 yds" },
    { opponent: "vs Denton Ryan", date: "Oct 4, 2024", result: "W 42-21", passing: "358 yds, 4 TD", rushing: "52 yds, 1 TD" },
    { opponent: "@ Mansfield", date: "Sep 27, 2024", result: "W 31-17", passing: "276 yds, 3 TD", rushing: "31 yds" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Stats" },
    { id: "games", label: "Games" },
    { id: "recruiting", label: "Recruiting" },
    { id: "highlights", label: "Highlights" },
  ];

  // 247 Sports recruiting data
  const recruiting = {
    rating: "4-star",
    nationalRank: 247,
    stateRank: 18,
    positionRank: 12,
    offers: [
      { school: "Texas A&M", date: "Oct 2024", status: "Offer" },
      { school: "Baylor", date: "Sep 2024", status: "Offer" },
      { school: "TCU", date: "Aug 2024", status: "Offer" },
      { school: "Texas Tech", date: "Aug 2024", status: "Offer" },
      { school: "SMU", date: "Jul 2024", status: "Offer" },
    ],
    commitment: null as { school: string; date: string } | null, // or { school: "Texas A&M", date: "Nov 2024" }
    profileUrl: "https://247sports.com/player/brayden-payne-123456"
  };

  return (
    <ScreenLayout 
      title={`${player.name} #${player.number}`}
      subtitle={`${player.position} • ${player.team}`}
      scrollable={false}
    >
      <View style={{ flex: 1 }}>
        {/* Player Header Card */}
        <View style={{ 
          backgroundColor: "#2a2a2a", 
          borderRadius: 16, 
          padding: 24,
          marginBottom: 24,
          flexDirection: "row",
          gap: 20
        }}>
          {/* Player Photo */}
          <View style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 12, 
            backgroundColor: "#3a3a3a",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>

          {/* Player Info */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <View style={{ 
                backgroundColor: player.teamColor,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}>
                <Text style={{ color: "#000", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                  #{player.number}
                </Text>
              </View>
              <View>
                <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold" }}>
                  {player.name}
                </Text>
                <Text style={{ color: "#999", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                  {player.position} • {player.class}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 20, marginTop: 8 }}>
              <View>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>Height</Text>
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>{player.height}</Text>
              </View>
              <View>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>Weight</Text>
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>{player.weight}</Text>
              </View>
              <View>
                <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Roman" }}>GPA</Text>
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "NeueHaas-Bold" }}>{player.gpa}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ justifyContent: "center", gap: 10 }}>
            <Pressable style={{ 
              backgroundColor: player.teamColor,
              paddingVertical: 10, 
              paddingHorizontal: 20, 
              borderRadius: 8,
              alignItems: "center"
            }}>
              <Text style={{ color: "#000", fontSize: 14, fontFamily: "NeueHaas-Bold" }}>Edit Profile</Text>
            </Pressable>
            <Pressable style={{ 
              backgroundColor: "#3a3a3a", 
              paddingVertical: 10, 
              paddingHorizontal: 20, 
              borderRadius: 8,
              alignItems: "center"
            }}>
              <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>Share</Text>
            </Pressable>
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
                borderBottomColor: activeTab === tab.id ? player.teamColor : "transparent",
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
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {[
                    { label: "Passing Yards", value: stats.passingYards },
                    { label: "Touchdowns", value: stats.touchdowns },
                    { label: "Completion %", value: stats.completionRate },
                    { label: "QB Rating", value: stats.qbRating },
                  ].map((stat, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        flex: 1, 
                        backgroundColor: "#2a2a2a", 
                        borderRadius: 12, 
                        padding: 20,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ color: player.teamColor, fontSize: 28, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
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
                  {recentGames.map((game, idx) => (
                    <Pressable 
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
                          {game.opponent}
                        </Text>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman", marginBottom: 8 }}>
                          {game.date}
                        </Text>
                        <Text style={{ color: "#d0d0d0", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          Passing: {game.passing}
                        </Text>
                        <Text style={{ color: "#d0d0d0", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          Rushing: {game.rushing}
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
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Bio Section */}
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  About
                </Text>
                <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20 }}>
                  <Text style={{ color: "#d0d0d0", fontSize: 15, fontFamily: "NeueHaas-Roman", lineHeight: 24 }}>
                    Three-year starting quarterback for the Joshua Owls. Team captain and district offensive MVP. 
                    Led team to district championship in 2023. Committed to continue academic and athletic career 
                    at the collegiate level. Passionate about leadership development and mentoring younger players.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === "stats" && (
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                Detailed Statistics
              </Text>
              
              {/* Passing Stats */}
              <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Passing
                </Text>
                <View style={{ gap: 12 }}>
                  {[
                    { label: "Completions", value: "245" },
                    { label: "Attempts", value: "358" },
                    { label: "Completion %", value: "68.5%" },
                    { label: "Yards", value: "2,847" },
                    { label: "Touchdowns", value: "32" },
                    { label: "Interceptions", value: "7" },
                    { label: "QB Rating", value: "142.3" },
                    { label: "Yards/Attempt", value: "7.95" },
                  ].map((stat, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        paddingVertical: 8,
                        borderBottomWidth: idx < 7 ? 1 : 0,
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

              {/* Rushing Stats */}
              <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Rushing
                </Text>
                <View style={{ gap: 12 }}>
                  {[
                    { label: "Carries", value: "89" },
                    { label: "Yards", value: "412" },
                    { label: "Touchdowns", value: "8" },
                    { label: "Yards/Carry", value: "4.6" },
                    { label: "Long", value: "45" },
                  ].map((stat, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        paddingVertical: 8,
                        borderBottomWidth: idx < 4 ? 1 : 0,
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

          {activeTab === "games" && (
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                Game Log - 2024 Season
              </Text>
              <View style={{ gap: 12 }}>
                {recentGames.map((game, idx) => (
                  <Pressable 
                    key={idx}
                    style={{ 
                      backgroundColor: "#2a2a2a", 
                      borderRadius: 12, 
                      padding: 18
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <View>
                        <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                          {game.opponent}
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
                          fontSize: 16, 
                          fontFamily: "NeueHaas-Bold" 
                        }}>
                          {game.result}
                        </Text>
                      </View>
                    </View>
                    <View style={{ 
                      backgroundColor: "#3a3a3a", 
                      borderRadius: 8, 
                      padding: 14,
                      gap: 8
                    }}>
                      <Text style={{ color: "#d0d0d0", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                        <Text style={{ color: "#999" }}>Passing:</Text> {game.passing}
                      </Text>
                      <Text style={{ color: "#d0d0d0", fontSize: 15, fontFamily: "NeueHaas-Roman" }}>
                        <Text style={{ color: "#999" }}>Rushing:</Text> {game.rushing}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === "recruiting" && (
            <View style={{ gap: 24 }}>
              {/* 247 Sports Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                  Recruiting Profile
                </Text>
                <Pressable 
                  onPress={() => {/* Open 247 profile */}}
                  style={{ 
                    backgroundColor: "#2a2a2a", 
                    paddingVertical: 8, 
                    paddingHorizontal: 16, 
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontFamily: "NeueHaas-Medium" }}>View on 247Sports</Text>
                  <Text style={{ color: "#999", fontSize: 14 }}>↗</Text>
                </Pressable>
              </View>

              {/* Rankings */}
              <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  247Sports Rankings
                </Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ 
                      backgroundColor: player.teamColor, 
                      paddingVertical: 8, 
                      paddingHorizontal: 16, 
                      borderRadius: 8,
                      alignItems: "center",
                      marginBottom: 8
                    }}>
                      <Text style={{ color: "#000", fontSize: 20, fontFamily: "NeueHaas-Bold" }}>
                        {recruiting.rating}
                      </Text>
                    </View>
                    <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                      Overall Rating
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      #{recruiting.nationalRank}
                    </Text>
                    <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                      National
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      #{recruiting.stateRank}
                    </Text>
                    <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                      State (TX)
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                      #{recruiting.positionRank}
                    </Text>
                    <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", textAlign: "center" }}>
                      QB Position
                    </Text>
                  </View>
                </View>
              </View>

              {/* Commitment Status */}
              {recruiting.commitment ? (
                <View style={{ backgroundColor: "#1a3a1a", borderRadius: 12, padding: 20, borderWidth: 2, borderColor: "#4ade80" }}>
                  <Text style={{ color: "#4ade80", fontSize: 16, fontFamily: "NeueHaas-Bold", marginBottom: 8 }}>
                    ✓ COMMITTED
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                    {recruiting.commitment.school}
                  </Text>
                  <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                    Committed {recruiting.commitment.date}
                  </Text>
                </View>
              ) : (
                <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 20 }}>
                  <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                    Uncommitted
                  </Text>
                  <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                    Evaluating {recruiting.offers.length} scholarship offers
                  </Text>
                </View>
              )}

              {/* Offers */}
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                  Scholarship Offers ({recruiting.offers.length})
                </Text>
                <View style={{ gap: 12 }}>
                  {recruiting.offers.map((offer, idx) => (
                    <View 
                      key={idx}
                      style={{ 
                        backgroundColor: "#2a2a2a", 
                        borderRadius: 12, 
                        padding: 16,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <View>
                        <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Bold", marginBottom: 4 }}>
                          {offer.school}
                        </Text>
                        <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Roman" }}>
                          Offered {offer.date}
                        </Text>
                      </View>
                      <View style={{ 
                        paddingVertical: 6, 
                        paddingHorizontal: 12, 
                        borderRadius: 6,
                        backgroundColor: "#3a3a3a"
                      }}>
                        <Text style={{ color: player.teamColor, fontSize: 14, fontFamily: "NeueHaas-Bold" }}>
                          {offer.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === "highlights" && (
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: "NeueHaas-Bold", marginBottom: 16 }}>
                Video Highlights
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Pressable 
                    key={item}
                    style={{ 
                      width: "31%",
                      aspectRatio: 16/9,
                      backgroundColor: "#2a2a2a",
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ fontSize: 48 }}>▶️</Text>
                    <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman", marginTop: 8 }}>
                      Highlight #{item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}