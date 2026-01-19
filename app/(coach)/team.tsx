import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Player {
  id: string;
  number: string;
  name: string;
  position: string;
  grade: string;
  status: 'active' | 'limited' | 'out';
}

export default function TeamScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [filteredRoster, setFilteredRoster] = useState<Player[]>([]);

  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];

  useEffect(() => {
    loadRoster();
  }, []);

  useEffect(() => {
    filterRoster();
  }, [searchQuery, selectedPosition, roster]);

  const loadRoster = async () => {
    setTimeout(() => {
      const mockRoster: Player[] = [
        { id: '1', number: '7', name: 'John Smith', position: 'QB', grade: '12', status: 'out' },
        { id: '2', number: '22', name: 'Marcus Johnson', position: 'RB', grade: '11', status: 'active' },
        { id: '3', number: '12', name: 'Tom Brown', position: 'WR', grade: '12', status: 'limited' },
        { id: '4', number: '88', name: 'David Lee', position: 'TE', grade: '11', status: 'active' },
        { id: '5', number: '44', name: 'Mike Jones', position: 'LB', grade: '12', status: 'out' },
        { id: '6', number: '1', name: 'Chris Davis', position: 'DB', grade: '10', status: 'active' },
        { id: '7', number: '65', name: 'Tyler Moore', position: 'OL', grade: '12', status: 'active' },
        { id: '8', number: '99', name: 'Brandon White', position: 'DL', grade: '11', status: 'active' },
      ];
      setRoster(mockRoster);
      setFilteredRoster(mockRoster);
      setIsLoading(false);
    }, 500);
  };

  const filterRoster = () => {
    let filtered = roster;
    if (selectedPosition && selectedPosition !== 'ALL') {
      filtered = filtered.filter((player) => player.position === selectedPosition);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(query) ||
          player.number.includes(query) ||
          player.position.toLowerCase().includes(query)
      );
    }
    filtered = filtered.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    setFilteredRoster(filtered);
  };

  const handleAddPlayer = () => {
    Alert.alert('Add Player', 'This will open the add player form');
  };

  const handlePlayerPress = (player: Player) => {
    Alert.alert(
      player.name,
      `#${player.number} • ${player.position} • Grade ${player.grade}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => console.log('Edit player') },
        { text: 'View Stats', onPress: () => console.log('View stats') },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#b4d836';
      case 'limited': return '#ffa500';
      case 'out': return '#ff3636';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'limited': return 'warning';
      case 'out': return 'close-circle';
      default: return 'help-circle';
    }
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Roster</Text>
        <Text style={styles.headerSubtitle}>{roster.length} Players</Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
        {positions.map((position) => (
          <Pressable
            key={position}
            style={[styles.filterChip, ((position === 'ALL' && !selectedPosition) || selectedPosition === position) ? styles.filterChipActive : null]}
            onPress={() => setSelectedPosition(position === 'ALL' ? null : position)}
          >
            <Text style={[styles.filterChipText, ((position === 'ALL' && !selectedPosition) || selectedPosition === position) ? styles.filterChipTextActive : null]}>
              {position}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={styles.rosterList}>
        {filteredRoster.length > 0 ? (
          filteredRoster.map((player) => (
            <Pressable key={player.id} style={styles.playerCard} onPress={() => handlePlayerPress(player)}>
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
              <Ionicons name={getStatusIcon(player.status) as any} size={24} color={getStatusColor(player.status)} />
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No players found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.addButtonContainer}>
        <Pressable style={styles.addButton} onPress={handleAddPlayer}>
          <Ionicons name="add" size={24} color="#000" />
          <Text style={styles.addButtonText}>Add Player</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  loadingContainer: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#666' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#fff' },
  filterContainer: { marginBottom: 16 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#2a2a2a' },
  filterChipActive: { backgroundColor: '#b4d836', borderColor: '#b4d836' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#999' },
  filterChipTextActive: { color: '#000' },
  rosterList: { flex: 1, paddingHorizontal: 16 },
  playerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, marginBottom: 12 },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  playerNumber: { fontSize: 20, fontWeight: 'bold', color: '#b4d836', width: 50 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  playerMeta: { flexDirection: 'row', gap: 12 },
  playerPosition: { fontSize: 13, color: '#999' },
  playerGrade: { fontSize: 13, color: '#666' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 4 },
  addButtonContainer: { padding: 16, paddingBottom: 32 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#b4d836', padding: 16, borderRadius: 12 },
  addButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
