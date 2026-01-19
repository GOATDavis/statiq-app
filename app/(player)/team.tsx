import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Teammate {
  id: string;
  number: string;
  name: string;
  position: string;
  grade: string;
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  time: string;
  result?: 'W' | 'L';
  score?: string;
}

export default function TeamScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'roster' | 'schedule'>('schedule');

  const [roster, setRoster] = useState<Teammate[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setTimeout(() => {
      setRoster([
        { id: '1', number: '7', name: 'John Smith', position: 'QB', grade: '12' },
        { id: '2', number: '22', name: 'Marcus Johnson', position: 'RB', grade: '11' },
        { id: '3', number: '12', name: 'Tom Brown', position: 'WR', grade: '12' },
        { id: '4', number: '88', name: 'David Lee', position: 'TE', grade: '11' },
        { id: '5', number: '44', name: 'Mike Jones', position: 'LB', grade: '12' },
      ]);

      setSchedule([
        {
          id: '1',
          date: 'Nov 8',
          opponent: 'Parish Episcopal',
          homeAway: 'home',
          time: '7:00 PM',
        },
        {
          id: '2',
          date: 'Nov 1',
          opponent: 'Prestonwood Christian',
          homeAway: 'away',
          time: '7:00 PM',
          result: 'W',
          score: '35-28',
        },
        {
          id: '3',
          date: 'Oct 25',
          opponent: 'Bishop Lynch',
          homeAway: 'home',
          time: '7:00 PM',
          result: 'W',
          score: '42-21',
        },
        {
          id: '4',
          date: 'Oct 18',
          opponent: 'Parish Episcopal',
          homeAway: 'away',
          time: '7:00 PM',
          result: 'L',
          score: '28-31',
        },
      ]);

      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b4d836" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Team Header */}
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>Trinity Christian</Text>
          <Text style={styles.teamMascot}>Eagles</Text>
        </View>
        <View style={styles.recordBadge}>
          <Text style={styles.recordText}>8-1</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, selectedTab === 'schedule' && styles.tabActive]}
          onPress={() => setSelectedTab('schedule')}
        >
          <Text style={[styles.tabText, selectedTab === 'schedule' && styles.tabTextActive]}>
            Schedule
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === 'roster' && styles.tabActive]}
          onPress={() => setSelectedTab('roster')}
        >
          <Text style={[styles.tabText, selectedTab === 'roster' && styles.tabTextActive]}>
            Roster
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {selectedTab === 'schedule' && (
          <View>
            {schedule.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameHeader}>
                  <Text style={styles.gameDate}>{game.date}</Text>
                  {game.result && (
                    <View
                      style={[
                        styles.resultBadge,
                        game.result === 'W' ? styles.resultBadgeWin : styles.resultBadgeLoss,
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultText,
                          game.result === 'W' ? styles.resultTextWin : styles.resultTextLoss,
                        ]}
                      >
                        {game.result}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameOpponent}>
                    {game.homeAway === 'home' ? 'vs' : '@'} {game.opponent}
                  </Text>
                  {game.score ? (
                    <Text style={styles.gameScore}>{game.score}</Text>
                  ) : (
                    <Text style={styles.gameTime}>{game.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'roster' && (
          <View>
            {roster.map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerLeft}>
                  <Text style={styles.playerNumber}>#{player.number}</Text>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <View style={styles.playerMeta}>
                      <Text style={styles.playerPosition}>{player.position}</Text>
                      <Text style={styles.playerGrade}>Grade {player.grade}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#2a2a2a',
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamMascot: {
    fontSize: 16,
    color: '#b4d836',
    fontWeight: '600',
  },
  recordBadge: {
    alignItems: 'center',
  },
  recordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b4d836',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#b4d836',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gameCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  resultBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBadgeWin: {
    backgroundColor: '#b4d836',
  },
  resultBadgeLoss: {
    backgroundColor: '#3a3a3a',
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultTextWin: {
    color: '#000',
  },
  resultTextLoss: {
    color: '#666',
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  gameScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b4d836',
  },
  gameTime: {
    fontSize: 14,
    color: '#999',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  playerNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b4d836',
    width: 50,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  playerPosition: {
    fontSize: 13,
    color: '#999',
  },
  playerGrade: {
    fontSize: 13,
    color: '#666',
  },
});
