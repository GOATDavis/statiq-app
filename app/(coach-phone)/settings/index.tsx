import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

const API_BASE_URL = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

// Fallback colors
const SURGE = '#B4D836';
const BLAZE = '#FF3636';

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

type TeamData = {
  name: string;
  mascot: string;
  primary_color: string;
  secondary_color: string;
};

const settingsGroups = [
  {
    title: "ACCOUNT",
    items: [
      { id: "team-profile", label: "Team Profile", icon: "shield", route: "/(coach-phone)/settings/team-profile" },
      { id: "my-profile", label: "My Profile", icon: "person-circle", route: "/(coach-phone)/settings/my-profile" },
      { id: "password", label: "Password", icon: "lock-closed", route: "/(coach-phone)/settings/change-password" },
    ] as MenuItem[],
  },
  {
    title: "TEAM",
    items: [
      { id: "team", label: "Manage Members", icon: "people", route: "/(coach-phone)/settings/team-management" },
    ] as MenuItem[],
  },
  {
    title: "SUBSCRIPTION",
    items: [
      { id: "plan", label: "Plan & History", icon: "ribbon", route: "/(coach-phone)/settings/plan" },
      { id: "billing", label: "Payment", icon: "card", route: "/(coach-phone)/settings/billing" },
    ] as MenuItem[],
  },
  {
    title: "PREFERENCES",
    items: [
      { id: "notifications", label: "Notifications", icon: "notifications", route: "/(coach-phone)/settings/notifications-settings" },
      { id: "integrations", label: "Integrations", icon: "apps", route: "/(coach-phone)/settings/integrations" },
    ] as MenuItem[],
  },
];

// Helper to determine if color is light or dark
const isLightColor = (color: string): boolean => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Get version info
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const updateId = Updates.updateId || 'dev';
  const isEmbedded = !Updates.isEmbeddedLaunch;

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          // Use mock data for demo
          setTeamData({
            name: 'Highland Park',
            mascot: 'Scots',
            primary_color: '#003366', // Navy
            secondary_color: '#ffbc19', // Gold
          });
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.team) {
            setTeamData({
              name: userData.team.name || 'My Team',
              mascot: userData.team.mascot || '',
              primary_color: userData.team.primary_color || SURGE,
              secondary_color: userData.team.secondary_color || '#ffffff',
            });
          } else {
            // Use mock data if no team assigned
            setTeamData({
              name: 'Highland Park',
              mascot: 'Scots',
              primary_color: '#003366',
              secondary_color: '#ffbc19',
            });
          }
        } else {
          // Fallback to mock data
          setTeamData({
            name: 'Highland Park',
            mascot: 'Scots',
            primary_color: '#003366',
            secondary_color: '#ffbc19',
          });
        }
      } catch (error) {
        console.log('Failed to fetch team data:', error);
        // Use mock data on error
        setTeamData({
          name: 'Highland Park',
          mascot: 'Scots',
          primary_color: '#003366',
          secondary_color: '#ffbc19',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const checkForUpdates = async () => {
    if (__DEV__) {
      Alert.alert('Development Mode', 'Updates are disabled in development. Test in a production build.');
      return;
    }

    setCheckingUpdate(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version is available. Would you like to update now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    'Update Downloaded',
                    'The app will now restart to apply the update.',
                    [{ text: 'OK', onPress: () => Updates.reloadAsync() }]
                  );
                } catch (e) {
                  Alert.alert('Error', 'Failed to download update. Please try again.');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You have the latest version of StatIQ.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not check for updates. Please try again.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (!user?.email) return 'CO';
    return user.email.slice(0, 2).toUpperCase();
  };

  // Use team colors or fallback
  const primaryColor = teamData?.primary_color || SURGE;
  const secondaryColor = teamData?.secondary_color || '#ffffff';
  const textOnPrimary = isLightColor(primaryColor) ? '#000' : '#fff';

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card with Team Colors */}
        <View style={[styles.profileCard, { marginTop: insets.top + 16 }]}>
          <LinearGradient
            colors={[primaryColor, adjustColor(primaryColor, -30)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileLeft}>
              <View style={[styles.avatar, { backgroundColor: secondaryColor }]}>
                <Text style={[styles.avatarText, { color: isLightColor(secondaryColor) ? '#000' : '#fff' }]}>
                  {getInitials()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: textOnPrimary }]}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : 'Coach'}
                </Text>
                <Text style={[styles.teamName, { color: textOnPrimary, opacity: 0.85 }]}>
                  {teamData?.name ? `${teamData.name} ${teamData.mascot}`.trim() : 'My Team'}
                </Text>
                <Text style={[styles.profileRole, { color: textOnPrimary, opacity: 0.7 }]}>
                  Head Coach
                </Text>
              </View>
            </View>
            <View style={[styles.profileBadge, { backgroundColor: secondaryColor }]}>
              <Text style={[styles.badgeText, { color: isLightColor(secondaryColor) ? '#000' : '#fff' }]}>PRO</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.menuItem,
                    index < group.items.length - 1 && styles.menuItemBorder,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}20` }]}>
                    <Ionicons name={item.icon} size={18} color={primaryColor} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#444" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <Pressable 
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && { opacity: 0.7 },
          ]} 
          onPress={handleLogout}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        {/* Version & Update Check */}
        <Pressable 
          style={({ pressed }) => [
            styles.versionContainer,
            pressed && { opacity: 0.7 },
          ]}
          onPress={checkForUpdates}
          disabled={checkingUpdate}
        >
          {checkingUpdate ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <>
              <Text style={styles.version}>StatIQ v{appVersion}</Text>
              <Text style={styles.updateId}>{updateId === 'dev' ? 'Development Build' : `Build: ${updateId.slice(0, 8)}`}</Text>
              <Text style={styles.tapToUpdate}>Tap to check for updates</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

// Helper to darken/lighten a color
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'NeueHaas-Bold',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'NeueHaas-Bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  teamName: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Medium',
    marginTop: 3,
  },
  profileRole: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    marginTop: 2,
  },
  profileBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    letterSpacing: 1,
  },
  group: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  menuItemPressed: {
    backgroundColor: '#222',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 54, 54, 0.1)',
    borderRadius: 14,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: BLAZE,
  },
  version: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#666',
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  updateId: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Roman',
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
  tapToUpdate: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
  },
});
