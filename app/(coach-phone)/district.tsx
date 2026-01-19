import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/design';

type TabMode = 'standings' | 'games';

export default function DistrictScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabMode>('standings');

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

  // Last week's games
  const lastWeekGames = [
    { date: "10/17/25", home: "Highland Park", homeScore: 34, away: "Joshua", awayScore: 10, winner: "home" as const },
    { date: "10/17/25", home: "Cleburne", homeScore: 28, away: "Red Oak", awayScore: 38, winner: "away" as const },
    { date: "10/17/25", home: "Tyler", homeScore: 25, away: "Centennial", awayScore: 42, winner: "away" as const },
    { date: "10/24/25", home: "Highland Park", homeScore: 56, away: "Cleburne", awayScore: 14, winner: "home" as const },
    { date: "10/24/25", home: "Tyler", homeScore: 21, away: "Midlothian", awayScore: 24, winner: "away" as const },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your District</Text>
        <Text style={styles.subtitle}>District 7-5A Division I</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'standings' && styles.tabActive]}
          onPress={() => setActiveTab('standings')}
        >
          <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>
            Standings
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'games' && styles.tabActive]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>
            Recent Games
          </Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'standings' ? (
          /* Standings View */
          <View style={styles.card}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 3 }]}>TEAM</Text>
              <Text style={[styles.headerCell, { width: 40, textAlign: 'center' }]}>W-L</Text>
              <Text style={[styles.headerCell, { width: 36, textAlign: 'center' }]}>PF</Text>
              <Text style={[styles.headerCell, { width: 36, textAlign: 'center' }]}>PA</Text>
              <Text style={[styles.headerCell, { width: 45, textAlign: 'center' }]}>STK</Text>
            </View>

            {/* Standings Rows */}
            {standings.map((team, idx) => (
              <View key={team.team}>
                <Pressable
                  style={[
                    styles.standingRow,
                    team.team === "Joshua" && styles.standingRowHighlight
                  ]}
                >
                  <View style={styles.teamCell}>
                    <Text style={styles.rankNumber}>{idx + 1}</Text>
                    <View>
                      <Text style={[
                        styles.teamName,
                        team.team === "Joshua" && styles.teamNameHighlight
                      ]}>
                        {team.team}
                      </Text>
                      <Text style={styles.mascotName}>{team.mascot}</Text>
                    </View>
                  </View>
                  <Text style={styles.recordCell}>{team.wins}-{team.losses}</Text>
                  <Text style={styles.statCell}>{team.pf}</Text>
                  <Text style={styles.statCell}>{team.pa}</Text>
                  <Text style={[
                    styles.streakCell,
                    { color: team.streak.startsWith("W") ? "#34C759" : "#E74C3C" }
                  ]}>
                    {team.streak}
                  </Text>
                </Pressable>
                {idx === 3 && <View style={styles.playoffLine} />}
              </View>
            ))}

            <View style={styles.playoffNote}>
              <Text style={styles.playoffNoteText}>Top 4 teams qualify for playoffs</Text>
            </View>
          </View>
        ) : (
          /* Recent Games View */
          <View style={styles.gamesContainer}>
            {lastWeekGames.map((game, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.gameCard,
                  (game.home === "Joshua" || game.away === "Joshua") && styles.gameCardHighlight
                ]}
              >
                <Text style={styles.gameDate}>{game.date}</Text>
                
                {/* Away Team */}
                <View style={styles.gameTeamRow}>
                  <Text style={[
                    styles.gameTeamName,
                    game.winner === "away" && styles.gameTeamWinner
                  ]}>
                    {game.away}
                  </Text>
                  <Text style={[
                    styles.gameScore,
                    game.winner === "away" && styles.gameScoreWinner
                  ]}>
                    {game.awayScore}
                  </Text>
                </View>

                {/* Home Team */}
                <View style={styles.gameTeamRow}>
                  <Text style={[
                    styles.gameTeamName,
                    game.winner === "home" && styles.gameTeamWinner
                  ]}>
                    @ {game.home}
                  </Text>
                  <Text style={[
                    styles.gameScore,
                    game.winner === "home" && styles.gameScoreWinner
                  ]}>
                    {game.homeScore}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Spacer for Tab Bar */}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
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
    borderRadius: 10,
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
  card: {
    backgroundColor: '#3a3a3a',
    borderRadius: 16,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#555',
    marginBottom: 8,
  },
  headerCell: {
    color: '#999',
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    letterSpacing: 0.5,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  standingRowHighlight: {
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
  },
  teamCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankNumber: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    width: 18,
  },
  teamName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
  },
  teamNameHighlight: {
    fontFamily: 'NeueHaas-Bold',
  },
  mascotName: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'NeueHaas-Roman',
  },
  recordCell: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    width: 40,
    textAlign: 'center',
  },
  statCell: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    width: 36,
    textAlign: 'center',
  },
  streakCell: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    width: 45,
    textAlign: 'center',
  },
  playoffLine: {
    height: 2,
    backgroundColor: '#E74C3C',
    marginVertical: 8,
  },
  playoffNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  playoffNoteText: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
  },
  gamesContainer: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  gameCardHighlight: {
    borderLeftColor: '#0066cc',
  },
  gameDate: {
    color: '#999',
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gameTeamName: {
    color: '#999',
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
  },
  gameTeamWinner: {
    color: '#fff',
    fontFamily: 'NeueHaas-Bold',
  },
  gameScore: {
    color: '#999',
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    minWidth: 30,
    textAlign: 'right',
  },
  gameScoreWinner: {
    color: '#fff',
  },
});
