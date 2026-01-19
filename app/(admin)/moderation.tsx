/**
 * StatIQ Admin Moderation Dashboard
 * Phase 1 & 2: Fan account moderation with auto-flagging
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/design';

const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface FlaggedMessage {
  flag_id: number;
  message_id: number;
  message_text: string;
  room_id: number;
  message_author_id: number;
  message_author_username: string;
  flag_type: string;
  flag_reason: string | null;
  flagged_by_user_id: number | null;
  flagged_by_username: string;
  created_at: string;
}

interface UserSearchResult {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
  account_status: string;
  warning_count: number;
  total_flags: number;
  total_mod_actions: number;
}

interface ModerationStats {
  pending_flags: number;
  total_warnings_today: number;
  total_suspensions_today: number;
  active_suspensions: number;
  messages_deleted_today: number;
  top_flagged_users: Array<{
    user_id: number;
    username: string;
    flag_count: number;
  }>;
}

interface ChatMessage {
  id: number;
  room_id: number;
  user_id: number;
  user_name: string;
  message_text: string;
  was_censored: boolean;
  created_at: string;
}

interface FlagContext {
  flag_info: {
    flag_id: number;
    message_id: number;
    flag_type: string;
    flag_reason: string | null;
    flag_details: string | null;
    room_id: number;
    message_created_at: string;
  };
  context_messages: ChatMessage[];
  flagged_message_id: number;
}

type TabType = 'dashboard' | 'flags' | 'search';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  variant: 'default' | 'warning' | 'danger' | 'neutral';
  hasValue?: boolean;
}

const StatCard = ({ icon, value, label, variant, hasValue = false }: StatCardProps) => {
  const getColors = () => {
    if (hasValue && value > 0) {
      switch (variant) {
        case 'danger': return { icon: Colors.BLAZE, value: Colors.BLAZE, bg: 'rgba(255, 54, 54, 0.15)' };
        case 'warning': return { icon: Colors.WARNING, value: Colors.WARNING, bg: 'rgba(255, 176, 32, 0.15)' };
        default: return { icon: Colors.SURGE, value: Colors.SURGE, bg: Colors.SURGE_10 };
      }
    }
    switch (variant) {
      case 'danger': return { icon: Colors.BLAZE, value: Colors.BLAZE, bg: 'rgba(255, 54, 54, 0.1)' };
      case 'warning': return { icon: Colors.WARNING, value: Colors.WARNING, bg: 'rgba(255, 176, 32, 0.1)' };
      case 'neutral': return { icon: Colors.TEXT_TERTIARY, value: Colors.TEXT_PRIMARY, bg: Colors.GRAPHITE };
      default: return { icon: Colors.SURGE, value: Colors.SURGE, bg: Colors.SURGE_10 };
    }
  };
  
  const colors = getColors();
  
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={20} color={colors.icon} />
      </View>
      <Text style={[styles.statValue, { color: colors.value }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminModerationScreen() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [pendingFlags, setPendingFlags] = useState<FlaggedMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  
  const [selectedFlag, setSelectedFlag] = useState<FlaggedMessage | null>(null);
  const [flagContextModal, setFlagContextModal] = useState(false);
  const [flagContext, setFlagContext] = useState<FlagContext | null>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    loadAdminToken();
  }, []);

  useEffect(() => {
    if (adminToken) {
      loadDashboardData();
    }
  }, [adminToken]);

  const loadAdminToken = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            ...ngrokHeaders 
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.role === 'admin') {
            setAdminToken(userData.email);
          }
        }
      }
    } catch (error) {
      console.error('Error loading admin token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!adminToken) return;
    
    setIsLoading(true);
    try {
      const statsResp = await fetch(
        `${API_BASE}/moderation/dashboard?token=${encodeURIComponent(adminToken)}`, 
        { headers: ngrokHeaders }
      );
      
      if (statsResp.ok) {
        setStats(await statsResp.json());
      }
      
      const flagsResp = await fetch(
        `${API_BASE}/moderation/flags/pending?token=${encodeURIComponent(adminToken)}`, 
        { headers: ngrokHeaders }
      );
      
      if (flagsResp.ok) {
        setPendingFlags(await flagsResp.json());
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load moderation dashboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const searchUsers = async () => {
    if (!adminToken || !searchQuery || searchQuery.length < 2) {
      Alert.alert('Search', 'Please enter at least 2 characters');
      return;
    }
    
    setIsLoading(true);
    try {
      const resp = await fetch(
        `${API_BASE}/moderation/users/search?query=${encodeURIComponent(searchQuery)}&token=${encodeURIComponent(adminToken)}`,
        { headers: ngrokHeaders }
      );
      
      if (resp.ok) {
        const data = await resp.json();
        setSearchResults(data);
        if (data.length === 0) {
          Alert.alert('No Results', 'No users found matching your search');
        }
      } else {
        Alert.alert('Error', 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const viewFlagContext = async (flag: FlaggedMessage) => {
    if (!adminToken) return;
    
    setSelectedFlag(flag);
    setIsLoading(true);
    
    try {
      const resp = await fetch(
        `${API_BASE}/moderation/flags/${flag.flag_id}/context?token=${encodeURIComponent(adminToken)}`,
        { headers: ngrokHeaders }
      );
      
      if (resp.ok) {
        setFlagContext(await resp.json());
        setFlagContextModal(true);
      } else {
        Alert.alert('Error', 'Failed to load flag context');
      }
    } catch (error) {
      console.error('Error loading flag context:', error);
      Alert.alert('Error', 'Failed to load flag context');
    } finally {
      setIsLoading(false);
    }
  };

  const takeAction = async (
    actionType: 'warn' | 'suspend' | 'ban' | 'delete_message' | 'dismiss',
    userId?: number,
    messageId?: number,
    flagId?: number,
    reason: string = 'Admin action'
  ) => {
    if (!adminToken) return;
    
    const confirmMessages: Record<string, string> = {
      warn: 'Issue a warning to this user? (3 warnings = suspension)',
      suspend: 'Suspend this user for 7 days?',
      ban: 'Permanently BAN this user? This cannot be undone easily.',
      delete_message: 'Delete this message?',
      dismiss: 'Dismiss this flag as a false positive?',
    };
    
    Alert.alert(
      'Confirm Action',
      confirmMessages[actionType],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: actionType === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              let endpoint = '';
              let body: Record<string, unknown> = { reason };
              
              if (actionType === 'warn' && userId) {
                endpoint = `${API_BASE}/moderation/users/${userId}/warn?token=${encodeURIComponent(adminToken)}`;
              } else if (actionType === 'suspend' && userId) {
                endpoint = `${API_BASE}/moderation/users/${userId}/suspend?token=${encodeURIComponent(adminToken)}`;
                body.duration_days = 7;
              } else if (actionType === 'ban' && userId) {
                endpoint = `${API_BASE}/moderation/users/${userId}/ban?token=${encodeURIComponent(adminToken)}`;
              } else if (actionType === 'delete_message' && messageId) {
                endpoint = `${API_BASE}/moderation/messages/${messageId}/delete?token=${encodeURIComponent(adminToken)}`;
              } else if (actionType === 'dismiss' && flagId) {
                endpoint = `${API_BASE}/moderation/flags/${flagId}/dismiss?token=${encodeURIComponent(adminToken)}`;
                body.admin_notes = reason;
              }
              
              if (!endpoint) {
                Alert.alert('Error', 'Invalid action parameters');
                return;
              }
              
              const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { ...ngrokHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              
              if (resp.ok) {
                const data = await resp.json();
                Alert.alert('Success', data.message || 'Action completed');
                loadDashboardData();
                setFlagContextModal(false);
                setSelectedFlag(null);
              } else {
                const errorData = await resp.json().catch(() => ({}));
                Alert.alert('Error', errorData.detail || 'Failed to complete action');
              }
            } catch (error) {
              console.error('Error taking action:', error);
              Alert.alert('Error', 'Failed to complete action');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [adminToken]);

  // ============================================================================
  // RENDER - DASHBOARD TAB
  // ============================================================================

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.SURGE} />}
    >
      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <StatCard 
          icon="flag" 
          value={stats?.pending_flags || 0} 
          label="Pending" 
          variant="default"
          hasValue={true}
        />
        <StatCard 
          icon="warning" 
          value={stats?.total_warnings_today || 0} 
          label="Warnings" 
          variant="warning"
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard 
          icon="close-circle" 
          value={stats?.total_suspensions_today || 0} 
          label="Suspensions" 
          variant="danger"
        />
        <StatCard 
          icon="people" 
          value={stats?.active_suspensions || 0} 
          label="Active Bans" 
          variant="neutral"
        />
      </View>

      {/* Top Flagged Users */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="trending-up" size={14} color={Colors.SURGE} />
            </View>
            <Text style={styles.sectionTitle}>TOP FLAGGED</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Last 7 days</Text>
        </View>
        
        <View style={styles.card}>
          {stats?.top_flagged_users && stats.top_flagged_users.length > 0 ? (
            stats.top_flagged_users.map((user, index) => (
              <Pressable
                key={user.user_id}
                style={({ pressed }) => [
                  styles.userRow,
                  index === stats.top_flagged_users.length - 1 && styles.userRowLast,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => {
                  setSearchQuery(user.username);
                  setActiveTab('search');
                  setTimeout(searchUsers, 100);
                }}
              >
                <View style={styles.userRowLeft}>
                  <View style={[
                    styles.rankCircle,
                    index === 0 && styles.rankCircleFirst,
                    index === 1 && styles.rankCircleSecond,
                    index === 2 && styles.rankCircleThird,
                  ]}>
                    <Text style={[
                      styles.rankNumber,
                      index < 3 && styles.rankNumberTop,
                    ]}>{index + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.userRowName}>@{user.username}</Text>
                    <Text style={styles.userRowMeta}>Tap to view profile</Text>
                  </View>
                </View>
                <View style={styles.flagCount}>
                  <Ionicons name="flag" size={12} color={Colors.BLAZE} />
                  <Text style={styles.flagCountNumber}>{user.flag_count}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.SURGE} />
              </View>
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptySubtitle}>No flagged users in the last 7 days</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="flash" size={14} color={Colors.SURGE} />
            </View>
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          </View>
        </View>
        
        <View style={styles.quickActionsGrid}>
          <Pressable 
            style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
            onPress={() => setActiveTab('flags')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.SURGE_10 }]}>
              <Ionicons name="flag" size={20} color={Colors.SURGE} />
            </View>
            <Text style={styles.quickActionLabel}>Review Flags</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
            onPress={() => setActiveTab('search')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(74, 144, 226, 0.15)' }]}>
              <Ionicons name="search" size={20} color={Colors.INFO} />
            </View>
            <Text style={styles.quickActionLabel}>Find User</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
            onPress={onRefresh}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.GRAPHITE }]}>
              <Ionicons name="refresh" size={20} color={Colors.TEXT_SECONDARY} />
            </View>
            <Text style={styles.quickActionLabel}>Refresh</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  // ============================================================================
  // RENDER - FLAGS TAB
  // ============================================================================

  const renderFlags = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.SURGE} />}
    >
      {pendingFlags.length === 0 ? (
        <View style={styles.emptyFullScreen}>
          <View style={styles.emptyIconLarge}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.SURGE} />
          </View>
          <Text style={styles.emptyTitleLarge}>All Clear!</Text>
          <Text style={styles.emptySubtitleLarge}>No pending flags to review</Text>
          <Pressable style={styles.emptyButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color={Colors.BASALT} />
            <Text style={styles.emptyButtonText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.flagsHeader}>
            <Text style={styles.flagsCount}>{pendingFlags.length} Pending</Text>
            <Pressable style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color={Colors.SURGE} />
            </Pressable>
          </View>
          
          {pendingFlags.map((flag, index) => (
            <Pressable 
              key={flag.flag_id} 
              style={({ pressed }) => [
                styles.flagCard,
                pressed && styles.flagCardPressed,
              ]}
              onPress={() => viewFlagContext(flag)}
            >
              <View style={[
                styles.flagSeverity,
                { backgroundColor: flag.flag_type.includes('critical') ? Colors.BLAZE : Colors.WARNING }
              ]} />
              
              <View style={styles.flagContent}>
                <View style={styles.flagTopRow}>
                  <View style={styles.flagBadgeRow}>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: flag.flag_type.includes('critical') ? 'rgba(255, 54, 54, 0.15)' : 'rgba(255, 176, 32, 0.15)' }
                    ]}>
                      <Text style={[
                        styles.severityText,
                        { color: flag.flag_type.includes('critical') ? Colors.BLAZE : Colors.WARNING }
                      ]}>
                        {flag.flag_type.includes('critical') ? 'CRITICAL' : 'WARNING'}
                      </Text>
                    </View>
                    <Text style={styles.flagTimeAgo}>
                      {new Date(flag.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.flagUsername}>@{flag.message_author_username}</Text>
                <Text style={styles.flagMessageText} numberOfLines={2}>
                  {flag.message_text}
                </Text>
                
                <View style={styles.flagBottomRow}>
                  <View style={styles.flagMeta}>
                    <Ionicons name="eye-outline" size={12} color={Colors.TEXT_TERTIARY} />
                    <Text style={styles.flagMetaText}>{flag.flagged_by_username || 'Auto-detected'}</Text>
                  </View>
                  <View style={styles.reviewPrompt}>
                    <Text style={styles.reviewPromptText}>Review</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.SURGE} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );

  // ============================================================================
  // RENDER - SEARCH TAB
  // ============================================================================

  const renderSearch = () => (
    <View style={styles.content}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.TEXT_TERTIARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username, email, or ID"
            placeholderTextColor={Colors.TEXT_TERTIARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.TEXT_TERTIARY} />
            </Pressable>
          )}
        </View>
        <Pressable 
          style={({ pressed }) => [styles.searchSubmit, pressed && styles.searchSubmitPressed]}
          onPress={searchUsers}
        >
          <Text style={styles.searchSubmitText}>Search</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.searchResults} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {searchResults.length > 0 ? (
          searchResults.map((user) => (
            <View key={user.user_id} style={styles.userCard}>
              <View style={styles.userCardHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user.first_name?.charAt(0) || ''}{user.last_name?.charAt(0) || ''}
                  </Text>
                </View>
                <View style={styles.userCardInfo}>
                  <Text style={styles.userCardFullName}>{user.first_name} {user.last_name}</Text>
                  <Text style={styles.userCardName}>@{user.username}</Text>
                  <Text style={styles.userCardEmail}>{user.email}</Text>
                </View>
                <View style={[
                  styles.statusPill,
                  user.account_status === 'active' && styles.statusActive,
                  user.account_status === 'suspended' && styles.statusSuspended,
                  user.account_status === 'banned' && styles.statusBanned,
                ]}>
                  <Text style={[
                    styles.statusPillText,
                    user.account_status !== 'active' && styles.statusPillTextLight,
                  ]}>{user.account_status}</Text>
                </View>
              </View>
              
              <View style={styles.userCardStats}>
                <View style={styles.userCardStat}>
                  <Text style={styles.userCardStatValue}>{user.warning_count}</Text>
                  <Text style={styles.userCardStatLabel}>Warnings</Text>
                </View>
                <View style={styles.userCardStatDivider} />
                <View style={styles.userCardStat}>
                  <Text style={styles.userCardStatValue}>{user.total_flags}</Text>
                  <Text style={styles.userCardStatLabel}>Flags</Text>
                </View>
                <View style={styles.userCardStatDivider} />
                <View style={styles.userCardStat}>
                  <Text style={styles.userCardStatValue}>{user.total_mod_actions}</Text>
                  <Text style={styles.userCardStatLabel}>Actions</Text>
                </View>
              </View>
              
              <View style={styles.userCardActions}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.userActionBtn,
                    styles.userActionWarn,
                    pressed && { opacity: 0.8 },
                    user.account_status !== 'active' && styles.userActionDisabled,
                  ]}
                  onPress={() => takeAction('warn', user.user_id)}
                  disabled={user.account_status !== 'active'}
                >
                  <Ionicons name="warning" size={16} color="#000" />
                  <Text style={styles.userActionTextDark}>Warn</Text>
                </Pressable>
                
                <Pressable 
                  style={({ pressed }) => [
                    styles.userActionBtn,
                    styles.userActionSuspend,
                    pressed && { opacity: 0.8 },
                    user.account_status !== 'active' && styles.userActionDisabled,
                  ]}
                  onPress={() => takeAction('suspend', user.user_id)}
                  disabled={user.account_status !== 'active'}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <Text style={styles.userActionTextLight}>Suspend</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.searchEmpty}>
            <Ionicons name="person-circle-outline" size={64} color={Colors.GRAPHITE} />
            <Text style={styles.searchEmptyTitle}>Find a User</Text>
            <Text style={styles.searchEmptySubtitle}>
              Search by username, email address, or user ID
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // ============================================================================
  // RENDER - FLAG CONTEXT MODAL
  // ============================================================================

  const renderFlagContextModal = () => (
    <Modal 
      visible={flagContextModal} 
      animationType="slide" 
      presentationStyle="pageSheet" 
      onRequestClose={() => setFlagContextModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalClose} onPress={() => setFlagContextModal(false)}>
            <Ionicons name="close" size={24} color={Colors.TEXT_PRIMARY} />
          </Pressable>
          <Text style={styles.modalTitle}>Review Flag</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {flagContext && selectedFlag && (
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            {/* Flagged Message */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>FLAGGED MESSAGE</Text>
              <View style={styles.flaggedCard}>
                <View style={styles.flaggedCardHeader}>
                  <View style={styles.flaggedUserInfo}>
                    <View style={styles.flaggedAvatar}>
                      <Text style={styles.flaggedAvatarText}>
                        {selectedFlag.message_author_username.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.flaggedUsername}>@{selectedFlag.message_author_username}</Text>
                  </View>
                  <View style={[
                    styles.flaggedTypeBadge,
                    { backgroundColor: selectedFlag.flag_type.includes('critical') ? 'rgba(255, 54, 54, 0.15)' : 'rgba(255, 176, 32, 0.15)' }
                  ]}>
                    <Text style={[
                      styles.flaggedTypeText,
                      { color: selectedFlag.flag_type.includes('critical') ? Colors.BLAZE : Colors.WARNING }
                    ]}>
                      {selectedFlag.flag_type.replace('auto_', '').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.flaggedMessageContent}>{selectedFlag.message_text}</Text>
                {selectedFlag.flag_reason && (
                  <View style={styles.flaggedReason}>
                    <Ionicons name="information-circle" size={14} color={Colors.WARNING} />
                    <Text style={styles.flaggedReasonText}>{selectedFlag.flag_reason}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Context Messages */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>CONVERSATION CONTEXT</Text>
              <View style={styles.contextCard}>
                {flagContext.context_messages.map((msg, index) => (
                  <View 
                    key={msg.id} 
                    style={[
                      styles.contextMsg,
                      msg.id === flagContext.flagged_message_id && styles.contextMsgFlagged,
                      index === flagContext.context_messages.length - 1 && styles.contextMsgLast,
                    ]}
                  >
                    <View style={styles.contextMsgHeader}>
                      <Text style={styles.contextMsgAuthor}>@{msg.user_name}</Text>
                      <Text style={styles.contextMsgTime}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.contextMsgText}>{msg.message_text}</Text>
                    {msg.id === flagContext.flagged_message_id && (
                      <View style={styles.contextFlagBadge}>
                        <Ionicons name="flag" size={10} color={Colors.BLAZE} />
                        <Text style={styles.contextFlagText}>Flagged</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>TAKE ACTION</Text>
              <View style={styles.actionGrid}>
                <Pressable 
                  style={({ pressed }) => [styles.actionGridBtn, styles.actionDelete, pressed && { opacity: 0.8 }]}
                  onPress={() => takeAction('delete_message', undefined, selectedFlag.message_id, selectedFlag.flag_id)}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.actionGridTextLight}>Delete Message</Text>
                </Pressable>
                
                <Pressable 
                  style={({ pressed }) => [styles.actionGridBtn, styles.actionWarn, pressed && { opacity: 0.8 }]}
                  onPress={() => takeAction('warn', selectedFlag.message_author_id)}
                >
                  <Ionicons name="warning" size={20} color="#000" />
                  <Text style={styles.actionGridTextDark}>Warn User</Text>
                </Pressable>
                
                <Pressable 
                  style={({ pressed }) => [styles.actionGridBtn, styles.actionSuspend, pressed && { opacity: 0.8 }]}
                  onPress={() => takeAction('suspend', selectedFlag.message_author_id)}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.BLAZE} />
                  <Text style={[styles.actionGridTextDark, { color: Colors.BLAZE }]}>Suspend</Text>
                </Pressable>
                
                <Pressable 
                  style={({ pressed }) => [styles.actionGridBtn, styles.actionDismiss, pressed && { opacity: 0.8 }]}
                  onPress={() => takeAction('dismiss', undefined, undefined, selectedFlag.flag_id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <Text style={styles.actionGridTextDark}>Dismiss</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading && !stats) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.SURGE} />
        <Text style={styles.loadingText}>Loading moderation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.TEXT_PRIMARY} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.SURGE} />
          </View>
          <Text style={styles.headerTitle}>MODERATION</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.SURGE} style={{ width: 40 }} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['dashboard', 'flags', 'search'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={tab === 'dashboard' ? 'grid' : tab === 'flags' ? 'flag' : 'search'} 
              size={18} 
              color={activeTab === tab ? Colors.BASALT : Colors.TEXT_TERTIARY} 
            />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {tab === 'flags' && stats?.pending_flags ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {stats.pending_flags > 9 ? '9+' : stats.pending_flags}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'flags' && renderFlags()}
      {activeTab === 'search' && renderSearch()}

      {renderFlagContextModal()}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.TEXT_SECONDARY,
    marginTop: 12,
    fontSize: 14,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.SURGE_10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 1.5,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: Colors.SURGE,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
  },
  tabLabelActive: {
    color: Colors.BASALT,
  },
  tabBadge: {
    backgroundColor: Colors.BLAZE,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.SURGE_10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.TEXT_TERTIARY,
  },

  // Card
  card: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // User Rows
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  userRowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: Colors.GRAPHITE,
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.GRAPHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleFirst: {
    backgroundColor: '#FFD700',
  },
  rankCircleSecond: {
    backgroundColor: '#C0C0C0',
  },
  rankCircleThird: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
  },
  rankNumberTop: {
    color: Colors.BASALT,
  },
  userRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  userRowMeta: {
    fontSize: 12,
    color: Colors.TEXT_TERTIARY,
    marginTop: 1,
  },
  flagCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 54, 54, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  flagCountNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.BLAZE,
  },

  // Empty Card
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.SURGE_10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionPressed: {
    backgroundColor: Colors.GRAPHITE,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },

  // Flags Tab
  emptyFullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconLarge: {
    marginBottom: 16,
  },
  emptyTitleLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 6,
  },
  emptySubtitleLarge: {
    fontSize: 15,
    color: Colors.TEXT_SECONDARY,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.BASALT,
  },
  flagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 12,
  },
  flagsCount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.SURGE_10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagCard: {
    flexDirection: 'row',
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  flagCardPressed: {
    backgroundColor: Colors.GRAPHITE,
  },
  flagSeverity: {
    width: 4,
  },
  flagContent: {
    flex: 1,
    padding: 14,
  },
  flagTopRow: {
    marginBottom: 8,
  },
  flagBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flagTimeAgo: {
    fontSize: 12,
    color: Colors.TEXT_TERTIARY,
  },
  flagUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  flagMessageText: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  flagBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAPHITE,
  },
  flagMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flagMetaText: {
    fontSize: 12,
    color: Colors.TEXT_TERTIARY,
  },
  reviewPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewPromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.SURGE,
  },

  // Search Tab
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: Colors.TEXT_PRIMARY,
    fontSize: 15,
  },
  searchSubmit: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    height: 46,
  },
  searchSubmitPressed: {
    backgroundColor: '#9FC02E',
  },
  searchSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.BASALT,
  },
  searchResults: {
    flex: 1,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  searchEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 6,
  },
  searchEmptySubtitle: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // User Card
  userCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.SURGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.BASALT,
  },
  userCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userCardFullName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  userCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.SURGE,
  },
  userCardEmail: {
    fontSize: 13,
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: Colors.SURGE,
  },
  statusSuspended: {
    backgroundColor: Colors.WARNING,
  },
  statusBanned: {
    backgroundColor: Colors.BLAZE,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.BASALT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPillTextLight: {
    color: '#fff',
  },
  userCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.GRAPHITE,
    marginBottom: 14,
  },
  userCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  userCardStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.GRAPHITE,
  },
  userCardStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  userCardStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TEXT_TERTIARY,
    marginTop: 2,
  },
  userCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  userActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  userActionWarn: {
    backgroundColor: Colors.WARNING,
  },
  userActionSuspend: {
    backgroundColor: Colors.BLAZE,
  },
  userActionDisabled: {
    opacity: 0.4,
  },
  userActionTextDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  userActionTextLight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.TEXT_TERTIARY,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Flagged Card
  flaggedCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.BLAZE,
  },
  flaggedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flaggedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flaggedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.BLAZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flaggedAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  flaggedUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  flaggedTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flaggedTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flaggedMessageContent: {
    fontSize: 15,
    color: Colors.TEXT_PRIMARY,
    lineHeight: 22,
  },
  flaggedReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAPHITE,
  },
  flaggedReasonText: {
    fontSize: 13,
    color: Colors.WARNING,
  },

  // Context
  contextCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 14,
    overflow: 'hidden',
  },
  contextMsg: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  contextMsgLast: {
    borderBottomWidth: 0,
  },
  contextMsgFlagged: {
    backgroundColor: 'rgba(255, 54, 54, 0.08)',
  },
  contextMsgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contextMsgAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  contextMsgTime: {
    fontSize: 11,
    color: Colors.TEXT_TERTIARY,
  },
  contextMsgText: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  contextFlagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  contextFlagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.BLAZE,
    letterSpacing: 0.3,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionGridBtn: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionDelete: {
    backgroundColor: Colors.BLAZE,
  },
  actionWarn: {
    backgroundColor: Colors.WARNING,
  },
  actionSuspend: {
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 2,
    borderColor: Colors.BLAZE,
  },
  actionDismiss: {
    backgroundColor: Colors.SURGE,
  },
  actionGridTextLight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionGridTextDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
