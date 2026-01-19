import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';

const API_BASE_URL = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function TeamManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Player');
  const [teamColor, setTeamColor] = useState(Colors.SURGE);

  // Show only the current logged-in user
  const teamMembers: TeamMember[] = user ? [{
    id: 1,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Coach',
    email: user.email || '',
    role: 'Coach',
  }] : [];

  // Fetch team color
  useEffect(() => {
    const fetchTeamColor = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.team?.primary_color) {
            setTeamColor(data.team.primary_color);
          }
        }
      } catch (error) {
        console.log('Failed to fetch team color');
      }
    };
    
    if (token) {
      fetchTeamColor();
    }
  }, [token]);

  const handleSendInvite = () => {
    if (!inviteEmail) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }
    Alert.alert('Coming Soon', 'Team invites will be available soon.');
    setInviteEmail('');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return teamColor;
      case 'coach': return teamColor;
      default: return Colors.TEXT_SECONDARY;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Team Management</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Team Members</Text>
          <Text style={styles.sectionDescription}>
            Get your players & coaches up and running faster by inviting them to your team.
          </Text>

          <TextInput
            style={styles.emailInput}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="example@email.com"
            placeholderTextColor={Colors.TEXT_TERTIARY}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Pressable 
            style={styles.roleDropdown}
            onPress={() => Alert.alert('Select Role', '', [
              { text: 'Player', onPress: () => setSelectedRole('Player') },
              { text: 'Coach', onPress: () => setSelectedRole('Coach') },
              { text: 'Cancel', style: 'cancel' },
            ])}
          >
            <Text style={styles.roleText}>{selectedRole}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.TEXT_SECONDARY} />
          </Pressable>

          <Pressable style={[styles.sendButton, { backgroundColor: teamColor }]} onPress={handleSendInvite}>
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={styles.sendButtonText}>Send Invite</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          <Text style={styles.sectionDescription}>
            Manage your current team members and their roles.
          </Text>

          <View style={styles.membersList}>
            {teamMembers.map((member, idx) => (
              <View key={idx} style={[styles.memberCard, idx === teamMembers.length - 1 && styles.memberCardLast]}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitials}>
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleColor(member.role) }]}>
                    {member.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BASALT },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontFamily: 'NeueHaas-Bold', color: '#fff', marginBottom: 4 },
  sectionDescription: { fontSize: 14, fontFamily: 'NeueHaas-Roman', color: Colors.TEXT_SECONDARY, marginBottom: 16, lineHeight: 20 },
  emailInput: { backgroundColor: '#3a3a3a', borderRadius: 8, padding: 14, fontSize: 15, fontFamily: 'NeueHaas-Roman', color: '#fff', marginBottom: 12 },
  roleDropdown: { backgroundColor: '#3a3a3a', borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  roleText: { fontSize: 15, fontFamily: 'NeueHaas-Roman', color: '#fff' },
  sendButton: { borderRadius: 8, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendButtonText: { fontSize: 15, fontFamily: 'NeueHaas-Bold', color: '#fff' },
  membersList: { backgroundColor: '#2a2a2a', borderRadius: 12, overflow: 'hidden' },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  memberCardLast: { borderBottomWidth: 0 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4a4a4a', alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 16, fontFamily: 'NeueHaas-Bold', color: Colors.TEXT_SECONDARY },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontFamily: 'NeueHaas-Medium', color: '#fff' },
  memberEmail: { fontSize: 13, fontFamily: 'NeueHaas-Roman', color: Colors.TEXT_SECONDARY, marginTop: 2 },
  roleBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  roleBadgeText: { fontSize: 12, fontFamily: 'NeueHaas-Bold' },
});
