import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import ScreenLayout from "../../../components/ScreenLayout";

export default function YourDistrictScreen() {
  // District standings
  const standings = [
    { team: "Highland Park", mascot: "Scots", wins: 5, losses: 0, pf: 275, pa: 180, streak: "W5" },
    { team: "Red Oak", mascot: "Hawks", wins: 4, losses: 1, pf: 210, pa: 195, streak: "W2" },
    { team: "Midlothian", mascot: "Panthers", wins: 3, losses: 1, pf: 198, pa: 165, streak: "L1" },
    { team: "Tyler", mascot: "Lions", wins: 2, losses: 3, pf: 185, pa: 220, streak: "W1" },
    { team: "Joshua", mascot: "Owls", wins: 1, losses: 4, pf: 155, pa: 215, streak: "L3" },
    { team: "Centennial", mascot: "Spartans", wins: 2, losses: 3, pf: 170, pa: 205, streak: "L1" },
    { team: "Cleburne", mascot: "Yellow Jackets", wins: 0, losses: 6, pf: 120, pa: 280, streak: "L6" },
  ];

  // Upcoming district games
  const upcomingGames = [
    { date: "10/31/25", home: "Centennial", away: "Highland Park", time: "7:00 PM" },
    { date: "10/31/25", home: "Joshua", away: "Cleburne", time: "7:30 PM" },
    { date: "10/31/25", home: "Midlothian", away: "Red Oak", time: "7:00 PM" },
    { date: "11/7/25", home: "Highland Park", away: "Midlothian", time: "7:30 PM" },
    { date: "11/7/25", home: "Centennial", away: "Joshua", time: "7:00 PM" },
    { date: "11/7/25", home: "Red Oak", away: "Tyler", time: "7:30 PM" },
  ];

  return (
    <ScreenLayout 
      title="Your District" 
      subtitle="District 7-5A Division I"
      scrollable={false}
    >
      <View style={{ flexDirection: "row", gap: 20, flex: 1 }}>
        
        {/* Left Column - Standings */}
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 24, height: "100%" }}>
            <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 20 }}>
              District Standings
            </Text>

            {/* Standings Table Header */}
            <View style={{ flexDirection: "row", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#555", marginBottom: 12 }}>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Bold", flex: 4 }}>TEAM</Text>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Bold", width: 45, textAlign: "center" }}>W-L</Text>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Bold", width: 45, textAlign: "center" }}>PF</Text>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Bold", width: 45, textAlign: "center" }}>PA</Text>
              <Text style={{ color: "#999", fontSize: 14, fontFamily: "NeueHaas-Bold", width: 55, textAlign: "center" }}>STREAK</Text>
            </View>

            {/* Standings Rows */}
            {standings.map((team, idx) => (
              <View key={team.team}>
                <Pressable
                  style={{
                    flexDirection: "row",
                    paddingVertical: 14,
                    backgroundColor: team.team === "Joshua" ? "#0066cc22" : "transparent",
                    paddingHorizontal: 10,
                    borderRadius: 8,
                  }}
                >
                  <View style={{ flex: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#999", fontSize: 16, fontFamily: "NeueHaas-Bold", width: 24 }}>
                      {idx + 1}
                    </Text>
                    <View>
                      <Text style={{ color: "#fff", fontSize: 17, fontFamily: team.team === "Joshua" ? "NeueHaas-Bold" : "NeueHaas-Roman" }}>
                        {team.team}
                      </Text>
                      <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                        {team.mascot}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Roman", width: 45, textAlign: "center" }}>
                    {team.wins}-{team.losses}
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Roman", width: 45, textAlign: "center" }}>
                    {team.pf}
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Roman", width: 45, textAlign: "center" }}>
                    {team.pa}
                  </Text>
                  <Text style={{ 
                    color: team.streak.startsWith("W") ? "#5FD35F" : "#E74C3C", 
                    fontSize: 15, 
                    fontFamily: "NeueHaas-Bold", 
                    width: 55, 
                    textAlign: "center" 
                  }}>
                    {team.streak}
                  </Text>
                </Pressable>
                {/* Playoff line after 4th place */}
                {idx === 3 && (
                  <View style={{ height: 2, backgroundColor: "#E74C3C", marginVertical: 10 }} />
                )}
              </View>
            ))}

            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#555" }}>
              <Text style={{ color: "#999", fontSize: 13, fontFamily: "NeueHaas-Roman" }}>
                Top 4 teams qualify for playoffs
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column - Last Week's Games */}
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: "#3a3a3a", borderRadius: 16, padding: 24, height: "100%" }}>
            <Text style={{ color: "#fff", fontSize: 24, fontFamily: "NeueHaas-Bold", marginBottom: 20 }}>
              Last Week's Games
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { date: "10/17/25", home: "Highland Park", homeScore: 34, away: "Joshua", awayScore: 10, winner: "home" },
                { date: "10/17/25", home: "Cleburne", homeScore: 28, away: "Red Oak", awayScore: 38, winner: "away" },
                { date: "10/17/25", home: "Tyler", homeScore: 25, away: "Centennial", awayScore: 42, winner: "away" },
                { date: "10/24/25", home: "Highland Park", homeScore: 56, away: "Cleburne", awayScore: 14, winner: "home" },
                { date: "10/24/25", home: "Tyler", homeScore: 21, away: "Midlothian", awayScore: 24, winner: "away" },
              ].map((game, idx) => (
                <View 
                  key={idx} 
                  style={{ 
                    backgroundColor: "#2a2a2a", 
                    borderRadius: 12, 
                    padding: 16, 
                    marginBottom: 14,
                    borderLeftWidth: 4,
                    borderLeftColor: (game.home === "Joshua" || game.away === "Joshua") ? "#0066cc" : "transparent"
                  }}
                >
                  <Text style={{ color: "#999", fontSize: 12, fontFamily: "NeueHaas-Bold", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {game.date}
                  </Text>
                  
                  {/* Away Team */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ 
                      color: game.winner === "away" ? "#fff" : "#999", 
                      fontSize: 16, 
                      fontFamily: game.winner === "away" ? "NeueHaas-Bold" : "NeueHaas-Roman" 
                    }}>
                      {game.away}
                    </Text>
                    <Text style={{ 
                      color: game.winner === "away" ? "#fff" : "#999", 
                      fontSize: 20, 
                      fontFamily: "NeueHaas-Bold",
                      minWidth: 35,
                      textAlign: "right"
                    }}>
                      {game.awayScore}
                    </Text>
                  </View>

                  {/* Home Team */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ 
                      color: game.winner === "home" ? "#fff" : "#999", 
                      fontSize: 16, 
                      fontFamily: game.winner === "home" ? "NeueHaas-Bold" : "NeueHaas-Roman" 
                    }}>
                      {game.home}
                    </Text>
                    <Text style={{ 
                      color: game.winner === "home" ? "#fff" : "#999", 
                      fontSize: 20, 
                      fontFamily: "NeueHaas-Bold",
                      minWidth: 35,
                      textAlign: "right"
                    }}>
                      {game.homeScore}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
