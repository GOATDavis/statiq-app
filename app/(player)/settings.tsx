import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarNumber}>22</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>Marcus Johnson</Text>
            <Text style={styles.userType}>Player • RB • Grade 11</Text>
          </View>
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <Pressable style={styles.menuItem}>
          <Ionicons name="person-outline" size={20} color="#b4d836" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#b4d836" />
          <Text style={styles.menuItemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <Pressable style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={20} color="#b4d836" />
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#b4d836" />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={20} color="#b4d836" />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>StatIQ v1.0.0 (Player)</Text>
          <Text style={styles.versionSubtext}>Data Always Wins</Text>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ff3636" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b4d836',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#4a4a4a',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff3636',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3636',
  },
  bottomSpacer: {
    height: 32,
  },
});
