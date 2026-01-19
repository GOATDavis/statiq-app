import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getDashboard } from "../../../src/lib/coach-api";

// StatIQ Brand Colors
const SURGE = '#B4D836';
const BLAZE = '#FF3636';
const BASALT = '#262626';
const GRAPHITE = '#1a1a1a';

export default function ScoutingReportScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [opponentData, setOpponentData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const dashboard = await getDashboard();
      if (dashboard.upcoming_game) {
        setOpponentData(dashboard.upcoming_game);
      }
    } catch (e) {
      console.log('Error loading scouting data');
    } finally {
      setLoading(false);
    }
  };

  const opponent = {
    name: opponentData?.opponent || 'Centennial',
    record: '2-3',
    color: opponentData?.primary_color || '#8B0000',
    districtRecord: '1-2',
  };

  // Mock Hudl film data
  const hudlFilm = [
    { id: 1, title: 'vs Highland Park', date: 'Oct 25', result: 'L 14-35', type: 'Full Game' },
    { id: 2, title: 'vs Red Oak', date: 'Oct 18', result: 'L 21-28', type: 'Full Game' },
    { id: 3, title: 'vs Cleburne', date: 'Oct 11', result: 'W 42-7', type: 'Full Game' },
    { id: 4, title: 'vs Tyler', date: 'Oct 4', result: 'L 17-24', type: 'Full Game' },
    { id: 5, title: 'vs Midlothian', date: 'Sep 27', result: 'W 28-21', type: 'Full Game' },
  ];

  const openHudl = (gameId?: number) => {
    // This would link to the actual Hudl page for the opponent
    Linking.openURL('https://www.hudl.com');
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SURGE} />
          <Text style={styles.loadingText}>Loading scouting report...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[opponent.color, opponent.color, BASALT]}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />
      
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Scouting Report</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Opponent Info */}
        <View style={styles.opponentSection}>
          <Text style={styles.opponentLabel}>NEXT OPPONENT</Text>
          <Text style={styles.opponentName}>{opponent.name}</Text>
          <Text style={styles.opponentRecord}>{opponent.record} ({opponent.districtRecord} district)</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Quick Look</Text>
          
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>19.6</Text>
              <Text style={styles.quickStatLabel}>PPG</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: BLAZE }]}>27.4</Text>
              <Text style={styles.quickStatLabel}>PPG Allowed</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>2-3</Text>
              <Text style={styles.quickStatLabel}>Last 5</Text>
            </View>
          </View>

          {/* Key insight */}
          <View style={styles.insightBox}>
            <Ionicons name="bulb" size={18} color={SURGE} />
            <Text style={styles.insightText}>
              Defense is vulnerable — allowing 27.4 PPG (worst in district). Their #5 WR is the offense.
            </Text>
          </View>
        </View>

        {/* Hudl Film Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Film</Text>

          <View style={styles.filmList}>
            {hudlFilm.map((game) => (
              <Pressable 
                key={game.id} 
                style={styles.filmItem}
                onPress={() => openHudl(game.id)}
              >
                <View style={styles.filmInfo}>
                  <Text style={styles.filmTitle}>{game.title}</Text>
                  <Text style={styles.filmMeta}>{game.date} • {game.type}</Text>
                </View>
                <View style={styles.filmRight}>
                  <Text style={[
                    styles.filmResult,
                    { color: game.result.startsWith('W') ? SURGE : BLAZE }
                  ]}>
                    {game.result}
                  </Text>
                  <View style={styles.watchButton}>
                    <Ionicons name="play" size={14} color="#fff" />
                    <Text style={styles.watchButtonText}>Watch</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Hudl attribution */}
          <View style={styles.hudlAttribution}>
            <Text style={styles.hudlAttributionText}>Film provided by</Text>
            <Text style={styles.hudlLogo}>hudl</Text>
          </View>
        </View>

        {/* Players to Watch */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Players to Watch</Text>

          <View style={styles.playersList}>
            <View style={styles.playerItem}>
              <View style={[styles.playerBadge, { backgroundColor: opponent.color }]}>
                <Text style={styles.playerBadgeText}>#5</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>Marcus Jones</Text>
                <Text style={styles.playerPosition}>WR</Text>
              </View>
              <Text style={styles.playerStat}>8 TDs (last 3)</Text>
            </View>

            <View style={styles.playerItem}>
              <View style={[styles.playerBadge, { backgroundColor: opponent.color }]}>
                <Text style={styles.playerBadgeText}>#12</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>Jake Martinez</Text>
                <Text style={styles.playerPosition}>QB</Text>
              </View>
              <Text style={styles.playerStat}>67% / 6 INT</Text>
            </View>

            <View style={styles.playerItem}>
              <View style={[styles.playerBadge, { backgroundColor: opponent.color }]}>
                <Text style={styles.playerBadgeText}>#34</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>DeShawn Harris</Text>
                <Text style={styles.playerPosition}>RB</Text>
              </View>
              <Text style={styles.playerStat}>5.2 YPC</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASALT,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
    fontFamily: 'NeueHaas-Medium',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },

  // Opponent
  opponentSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  opponentLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Bold',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  opponentName: {
    fontSize: 32,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  opponentRecord: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  statiqBadge: {
    backgroundColor: SURGE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statiqBadgeText: {
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
    color: BASALT,
    letterSpacing: 0.5,
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: GRAPHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Medium',
    color: '#888',
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#333',
    marginVertical: 4,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GRAPHITE,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#ccc',
    lineHeight: 20,
  },

  // Hudl
  hudlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hudlButtonText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#FF6B00',
  },
  filmList: {
    backgroundColor: GRAPHITE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  filmInfo: {
    flex: 1,
  },
  filmTitle: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  filmMeta: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
    marginTop: 2,
  },
  filmRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filmResult: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  watchButtonText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  hudlAttribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  hudlAttributionText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
  },
  hudlLogo: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#FF6B00',
  },

  // Players
  playersList: {
    backgroundColor: GRAPHITE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  playerBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBadgeText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  playerPosition: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
  },
  playerStat: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Medium',
    color: SURGE,
  },
});
