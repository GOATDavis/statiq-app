import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/design';
import { clearDevRole } from '@/src/lib/storage';
import { clearAllVotesDebug, listAllVotesDebug } from '@/src/lib/votes-debug';

const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [notifScores, setNotifScores] = useState(true);
  const [notifBigPlays, setNotifBigPlays] = useState(true);
  const [notifGameStart, setNotifGameStart] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setIsAdmin(userData.role === 'admin');
          }
        }
      } catch (error) {
        console.log('Admin check failed:', error);
      }
    };
    checkAdminStatus();
  }, []);

  const isAdFree = user && 'adFree' in user && user.adFree;

  const handleUpgrade = () => {
    Alert.alert(
      'Go Ad-Free',
      'Remove all ads for just $2.99/month or $19.99/year',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => console.log('Navigate to subscription') },
      ]
    );
  };

  const handleChangeRole = () => {
    Alert.alert('Change Role', 'Return to role selector? (Dev Mode)', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change Role',
        onPress: async () => {
          await clearDevRole();
          router.replace('/role-selector');
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleTermsOfService = () => {
    const url = 'https://usestatiq.com/terms';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open Terms of Service');
    });
  };

  const handlePrivacyPolicy = () => {
    const url = 'https://usestatiq.com/privacy';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open Privacy Policy');
    });
  };

  const handleHelpSupport = () => {
    const email = 'support@usestatiq.com';
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (!user?.email) return '??';
    const email = user.email;
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const getMemberSince = () => {
    // TODO: Get actual user creation date
    return 'Member since Aug 2024';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <Pressable style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color={Colors.BASALT} />
            </Pressable>
          </View>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>{getMemberSince()}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <View style={styles.cardContainer}>
            <View style={[styles.row, styles.rowFirst]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Name</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : 'Not set'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={() => {
              router.push('/(fan)/settings/change-username');
            }}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="at-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Username</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue} numberOfLines={1}>@{user?.username || 'Not set'}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={() => {
              router.push('/(fan)/settings/edit-email');
            }}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Email</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue} numberOfLines={1}>{user?.email || 'Not set'}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={[styles.row, styles.rowLast]} onPress={() => {
              router.push('/(fan)/settings/change-password');
            }}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Password</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>••••••••</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADMIN</Text>
            <Pressable 
              style={styles.adminCard} 
              onPress={() => router.push('/(admin)/moderation')}
            >
              <View style={styles.adminIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#B4D836" />
              </View>
              <View style={styles.adminContent}>
                <Text style={styles.adminTitle}>Moderation Panel</Text>
                <Text style={styles.adminSubtitle}>
                  Manage flags, users, and chat moderation
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.TEXT_TERTIARY} />
            </Pressable>
          </View>
        )}

        {/* Subscription */}
        {!isAdFree && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
            <Pressable style={styles.upgradeCard} onPress={handleUpgrade}>
              <View style={styles.upgradeIconContainer}>
                <Ionicons name="star" size={24} color={Colors.SURGE} />
              </View>
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Go Ad-Free</Text>
                <Text style={styles.upgradeSubtitle}>
                  Remove all ads • $2.99/month or $19.99/year
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.TEXT_TERTIARY} />
            </Pressable>
          </View>
        )}

        {isAdFree && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={18} color={Colors.BASALT} />
              <Text style={styles.premiumText}>Ad-Free Premium</Text>
            </View>
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

          <View style={styles.cardContainer}>
            <View style={[styles.row, styles.rowFirst]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="trophy-outline" size={18} color={Colors.SURGE} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Score Updates</Text>
                  <Text style={styles.rowDescription}>Get notified when your favorite teams score</Text>
                </View>
              </View>
              <Switch
                value={notifScores}
                onValueChange={setNotifScores}
                trackColor={{ false: Colors.GRAPHITE, true: Colors.SURGE }}
                thumbColor={Colors.HALO}
                ios_backgroundColor={Colors.GRAPHITE}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="flash-outline" size={18} color={Colors.SURGE} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Big Plays</Text>
                  <Text style={styles.rowDescription}>TDs, turnovers, and 40+ yard plays</Text>
                </View>
              </View>
              <Switch
                value={notifBigPlays}
                onValueChange={setNotifBigPlays}
                trackColor={{ false: Colors.GRAPHITE, true: Colors.SURGE }}
                thumbColor={Colors.HALO}
                ios_backgroundColor={Colors.GRAPHITE}
              />
            </View>

            <View style={styles.divider} />

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="time-outline" size={18} color={Colors.SURGE} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Game Start</Text>
                  <Text style={styles.rowDescription}>1 hour before kickoff</Text>
                </View>
              </View>
              <Switch
                value={notifGameStart}
                onValueChange={setNotifGameStart}
                trackColor={{ false: Colors.GRAPHITE, true: Colors.SURGE }}
                thumbColor={Colors.HALO}
                ios_backgroundColor={Colors.GRAPHITE}
              />
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>

          <View style={styles.cardContainer}>
            <Pressable style={[styles.row, styles.rowFirst]} onPress={handleTermsOfService}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={handlePrivacyPolicy}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={handleHelpSupport}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="help-circle-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
            </Pressable>

            <View style={styles.divider} />

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.SURGE} />
                </View>
                <Text style={styles.rowLabel}>About</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>v1.0.0</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
              </View>
            </View>
          </View>
        </View>

        {/* Dev Mode - Change Role (Admin Only) */}
        {isAdmin && (
          <View style={styles.section}>
            <Pressable style={styles.devButton} onPress={handleChangeRole}>
              <Ionicons name="swap-horizontal-outline" size={18} color={Colors.WARNING} />
              <Text style={styles.devButtonText}>Change Role (Dev Mode)</Text>
            </Pressable>
          </View>
        )}

        {/* Dev Mode - Vote Debug (Admin Only) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VOTE DEBUG (DEV ONLY)</Text>
            
            <View style={styles.cardContainer}>
              <Pressable style={[styles.row, styles.rowFirst]} onPress={listAllVotesDebug}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="list-outline" size={18} color={Colors.SURGE} />
                  </View>
                  <Text style={styles.rowLabel}>List All Votes</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.TEXT_TERTIARY} />
              </Pressable>

              <View style={styles.divider} />
              
              <Pressable 
                style={[styles.row, styles.rowLast, styles.dangerRow]}
                onPress={() => {
                  Alert.alert(
                    'Clear All Votes',
                    'This will clear all stored votes. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: clearAllVotesDebug }
                    ]
                  );
                }}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 54, 54, 0.15)' }]}>
                    <Ionicons name="trash-outline" size={18} color={Colors.BLAZE} />
                  </View>
                  <Text style={[styles.rowLabel, { color: Colors.BLAZE }]}>Clear All Votes</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.BLAZE} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.BLAZE} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Made with 🏈 in Texas</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.SHADOW,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.SURGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.BASALT,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 2,
    borderColor: Colors.SHADOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.TEXT_TERTIARY,
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  manageLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.SURGE,
  },

  // Card Container - Full width
  cardContainer: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.CHARCOAL,
    padding: 16,
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.GRAPHITE,
    marginLeft: 60, // Align with text after icon
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowContent: {
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  rowDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '50%',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },

  // Upgrade Card
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.CHARCOAL,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.SURGE,
  },
  upgradeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.BASALT,
  },

  // Dev Button
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.CHARCOAL,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.WARNING,
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.WARNING,
  },
  dangerRow: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.BLAZE,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.CHARCOAL,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.BLAZE,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.BLAZE,
  },

  // Footer
  footer: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },

  // Admin Card
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.CHARCOAL,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#B4D836',
  },
  adminIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminContent: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  adminSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
  },
});
