/**
 * StatIQ Admin Moderation Dashboard
 * Phase 1 & 2: Fan account moderation with auto-flagging
 * 
 * Features:
 * - Dashboard with stats overview
 * - Pending flags queue with context viewer
 * - User search with quick actions
 * - Warning system (3 strikes)
 * - Suspend/ban functionality
 * - Profanity filter management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

const COLORS = {
  bg: '#262626',
  card: '#1a1a1a',
  cardHover: '#333333',
  surge: '#B4D836',
  blaze: '#FF3636',
  halo: '#F3F3F7',
  textPrimary: '#F3F3F7',
  textSecondary: '#999999',
  warning: '#FFC107',
  border: '#404040',
};

// ============================================================================
// ICONS
// ============================================================================

const ShieldIcon = ({ color = COLORS.halo, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" 
      stroke={color} 
      strokeWidth={2} 
      fill="none"
    />
  </Svg>
);

const FlagIcon = ({ color = COLORS.blaze, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zm0 0v6" 
      stroke={color} 
      strokeWidth={2} 
      fill="none"
    />
  </Svg>
);

const SearchIcon = ({ color = COLORS.halo, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={2} />
  </Svg>
);

const WarningIcon = ({ color = COLORS.warning, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" 
      stroke={color} 
      strokeWidth={2} 
      fill="none"
    />
  </Svg>
);

const BanIcon = ({ color = COLORS.blaze, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Line x1={4.93} y1={4.93} x2={19.07} y2={19.07} stroke={color} strokeWidth={2} />
  </Svg>
);

const TrashIcon = ({ color = COLORS.blaze, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
);

const CheckIcon = ({ color = COLORS.surge, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
);

const UserIcon = ({ color = COLORS.halo, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={2} fill="none" />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={2} />
  </Svg>
);

const RefreshIcon = ({ color = COLORS.halo, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth={2} fill="none" />
    <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
);

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
// HELPER COMPONENTS
// ============================================================================

const StatCard = ({ 
  title, 
  value, 
  color = COLORS.halo,
  icon 
}: { 
  title: string; 
  value: number | string; 
  color?: string;
  icon?: React.ReactNode;
}) => (
  <View style={styles.statCard}>
    <View style={styles.statCardHeader}>
      {icon}
      <Text style={styles.statCardTitle}>{title}</Text>
    </View>
    <Text style={[styles.statCardValue, { color }]}>{value}</Text>
  </View>
);

const TabButton = ({ 
  label, 
  active, 
  onPress, 
  badge 
}: { 
  label: string; 
  active: boolean; 
  onPress: () => void;
  badge?: number;
}) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {label}
    </Text>
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const ActionButton = ({ 
  label, 
  onPress, 
  variant = 'default',
  icon,
  disabled = false,
}: { 
  label: string; 
  onPress: () => void; 
  variant?: 'default' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  disabled?: boolean;
}) => {
  const bgColors = {
    default: COLORS.card,
    warning: '#FFC107',
    danger: COLORS.blaze,
    success: COLORS.surge,
  };
  
  const textColors = {
    default: COLORS.halo,
    warning: '#000',
    danger: '#fff',
    success: '#000',
  };

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: bgColors[variant] },
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      <Text style={[styles.actionButtonText, { color: textColors[variant] }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminModerationScreen() {
  // Auth state
  const [adminToken, setAdminToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [pendingFlags, setPendingFlags] = useState<FlaggedMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  
  // Modal states
  const [selectedFlag, setSelectedFlag] = useState<FlaggedMessage | null>(null);
  const [flagContextModal, setFlagContextModal] = useState(false);
  const [flagContext, setFlagContext] = useState<FlagContext | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadAdminToken();
  }, []);

  useEffect(() => {
    if (adminToken) {
      loadDashboardData();
    }
  }, [adminToken]);

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

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
            setIsAdmin(true);
            setAdminToken(userData.email);
          } else {
            setIsAdmin(false);
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
        const statsData = await statsResp.json();
        setStats(statsData);
      } else if (statsResp.status === 403) {
        setIsAdmin(false);
        Alert.alert('Access Denied', 'Admin privileges required');
        return;
      }
      
      const flagsResp = await fetch(
        `${API_BASE}/moderation/flags/pending?token=${encodeURIComponent(adminToken)}`, 
        { headers: ngrokHeaders }
      );
      
      if (flagsResp.ok) {
        const flagsData = await flagsResp.json();
        setPendingFlags(flagsData);
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
        const data = await resp.json();
        setFlagContext(data);
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
    
    const confirmMessage: Record<string, string> = {
      warn: 'Issue a warning to this user? (3 warnings = suspension)',
      suspend: 'Suspend this user for 7 days?',
      ban: 'Permanently BAN this user? This cannot be undone easily.',
      delete_message: 'Delete this message?',
      dismiss: 'Dismiss this flag as a false positive?',
    };
    
    Alert.alert(
      'Confirm Action',
      confirmMessage[actionType],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: actionType === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              let endpoint = '';
              let body: any = { reason };
              
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
                headers: {
                  ...ngrokHeaders,
                  'Content-Type': 'application/json',
                },
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.surge} />
      }
    >
      <View style={styles.statsGrid}>
        <StatCard 
          title="Pending Flags" 
          value={stats?.pending_flags || 0}
          color={stats?.pending_flags ? COLORS.blaze : COLORS.surge}
          icon={<FlagIcon size={16} color={stats?.pending_flags ? COLORS.blaze : COLORS.surge} />}
        />
        <StatCard 
          title="Warnings Today" 
          value={stats?.total_warnings_today || 0}
          color={COLORS.warning}
          icon={<WarningIcon size={16} />}
        />
        <StatCard 
          title="Suspensions Today" 
          value={stats?.total_suspensions_today || 0}
          color={COLORS.blaze}
          icon={<BanIcon size={16} />}
        />
        <StatCard 
          title="Active Suspensions" 
          value={stats?.active_suspensions || 0}
          color={COLORS.textSecondary}
          icon={<UserIcon size={16} color={COLORS.textSecondary} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Flagged Users (Last 7 Days)</Text>
        {stats?.top_flagged_users && stats.top_flagged_users.length > 0 ? (
          stats.top_flagged_users.map((user, index) => (
            <TouchableOpacity
              key={user.user_id}
              style={styles.flaggedUserRow}
              onPress={() => {
                setSearchQuery(user.username);
                setActiveTab('search');
              }}
            >
              <View style={styles.flaggedUserInfo}>
                <Text style={styles.flaggedUserRank}>#{index + 1}</Text>
                <Text style={styles.flaggedUserName}>@{user.username}</Text>
              </View>
              <View style={styles.flagCountBadge}>
                <Text style={styles.flagCountText}>{user.flag_count} flags</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No flagged users in the last 7 days 🎉</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <ActionButton
            label="View Flags"
            onPress={() => setActiveTab('flags')}
            icon={<FlagIcon size={16} color={COLORS.halo} />}
          />
          <ActionButton
            label="Search Users"
            onPress={() => setActiveTab('search')}
            icon={<SearchIcon size={16} />}
          />
          <ActionButton
            label="Refresh"
            onPress={onRefresh}
            icon={<RefreshIcon size={16} />}
          />
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.surge} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Flags ({pendingFlags.length})</Text>
        
        {pendingFlags.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckIcon size={48} color={COLORS.surge} />
            <Text style={styles.emptyStateTitle}>All Clear!</Text>
            <Text style={styles.emptyStateText}>No pending flags to review</Text>
          </View>
        ) : (
          pendingFlags.map((flag) => (
            <TouchableOpacity
              key={flag.flag_id}
              style={styles.flagCard}
              onPress={() => viewFlagContext(flag)}
            >
              <View style={styles.flagCardHeader}>
                <View style={styles.flagTypeContainer}>
                  <FlagIcon size={14} color={
                    flag.flag_type.includes('critical') ? COLORS.blaze :
                    flag.flag_type.includes('high') ? COLORS.warning :
                    COLORS.textSecondary
                  } />
                  <Text style={[
                    styles.flagType,
                    { color: flag.flag_type.includes('critical') ? COLORS.blaze :
                             flag.flag_type.includes('high') ? COLORS.warning :
                             COLORS.textSecondary }
                  ]}>
                    {flag.flag_type.replace('auto_', '').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.flagTime}>
                  {new Date(flag.created_at).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.flagCardBody}>
                <Text style={styles.flagAuthor}>@{flag.message_author_username}</Text>
                <Text style={styles.flagMessage} numberOfLines={2}>
                  "{flag.message_text}"
                </Text>
              </View>
              
              <View style={styles.flagCardFooter}>
                <Text style={styles.flaggedBy}>
                  Flagged by: {flag.flagged_by_username || 'Auto-detection'}
                </Text>
                {flag.flag_reason && (
                  <Text style={styles.flagReason} numberOfLines={1}>
                    {flag.flag_reason}
                  </Text>
                )}
              </View>
              
              <Text style={styles.tapToView}>Tap to view context →</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  // ============================================================================
  // RENDER - SEARCH TAB
  // ============================================================================

  const renderSearch = () => (
    <View style={styles.content}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username, email, or ID..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchUsers}
          disabled={isLoading}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.searchResults}>
        {searchResults.length > 0 ? (
          searchResults.map((user) => (
            <View key={user.user_id} style={styles.userCard}>
              <View style={styles.userCardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>@{user.username}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: 
                    user.account_status === 'active' ? COLORS.surge :
                    user.account_status === 'suspended' ? COLORS.warning :
                    user.account_status === 'banned' ? COLORS.blaze :
                    COLORS.textSecondary
                  }
                ]}>
                  <Text style={styles.statusText}>{user.account_status}</Text>
                </View>
              </View>
              
              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <Text style={styles.userStatValue}>{user.warning_count}</Text>
                  <Text style={styles.userStatLabel}>Warnings</Text>
                </View>
                <View style={styles.userStat}>
                  <Text style={styles.userStatValue}>{user.total_flags}</Text>
                  <Text style={styles.userStatLabel}>Flags</Text>
                </View>
                <View style={styles.userStat}>
                  <Text style={styles.userStatValue}>{user.total_mod_actions}</Text>
                  <Text style={styles.userStatLabel}>Actions</Text>
                </View>
                <View style={styles.userStat}>
                  <Text style={styles.userStatValue}>{user.role}</Text>
                  <Text style={styles.userStatLabel}>Role</Text>
                </View>
              </View>
              
              <View style={styles.userQuickActions}>
                <ActionButton
                  label="Warn"
                  variant="warning"
                  onPress={() => takeAction('warn', user.user_id)}
                  disabled={user.account_status !== 'active'}
                />
                <ActionButton
                  label="Suspend"
                  variant="danger"
                  onPress={() => takeAction('suspend', user.user_id)}
                  disabled={user.account_status !== 'active'}
                />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <SearchIcon size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateTitle}>Search Users</Text>
            <Text style={styles.emptyStateText}>
              Enter a username, email, or user ID to search
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
          <Text style={styles.modalTitle}>Flag Context</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setFlagContextModal(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        {flagContext && selectedFlag && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.flagInfoSection}>
              <Text style={styles.flagInfoTitle}>Flagged Message</Text>
              <View style={styles.flagInfoCard}>
                <Text style={styles.flagInfoAuthor}>
                  @{selectedFlag.message_author_username}
                </Text>
                <Text style={styles.flagInfoMessage}>
                  "{selectedFlag.message_text}"
                </Text>
                <View style={styles.flagInfoMeta}>
                  <Text style={styles.flagInfoType}>
                    Type: {selectedFlag.flag_type}
                  </Text>
                  {selectedFlag.flag_reason && (
                    <Text style={styles.flagInfoReason}>
                      Reason: {selectedFlag.flag_reason}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.contextSection}>
              <Text style={styles.contextTitle}>Surrounding Messages</Text>
              {flagContext.context_messages.map((msg) => (
                <View 
                  key={msg.id}
                  style={[
                    styles.contextMessage,
                    msg.id === flagContext.flagged_message_id && styles.contextMessageFlagged
                  ]}
                >
                  <View style={styles.contextMessageHeader}>
                    <Text style={styles.contextMessageAuthor}>
                      @{msg.user_name}
                    </Text>
                    <Text style={styles.contextMessageTime}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.contextMessageText,
                    msg.was_censored && styles.contextMessageCensored
                  ]}>
                    {msg.message_text}
                  </Text>
                  {msg.id === flagContext.flagged_message_id && (
                    <Text style={styles.flaggedIndicator}>⚠️ FLAGGED</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Text style={styles.modalActionsTitle}>Take Action</Text>
              <View style={styles.modalActionsGrid}>
                <ActionButton
                  label="Delete Message"
                  variant="danger"
                  icon={<TrashIcon size={16} color="#fff" />}
                  onPress={() => takeAction(
                    'delete_message', 
                    undefined, 
                    selectedFlag.message_id,
                    selectedFlag.flag_id
                  )}
                />
                <ActionButton
                  label="Warn User"
                  variant="warning"
                  icon={<WarningIcon size={16} color="#000" />}
                  onPress={() => takeAction(
                    'warn', 
                    selectedFlag.message_author_id
                  )}
                />
                <ActionButton
                  label="Suspend User"
                  variant="danger"
                  icon={<BanIcon size={16} color="#fff" />}
                  onPress={() => takeAction(
                    'suspend', 
                    selectedFlag.message_author_id
                  )}
                />
                <ActionButton
                  label="Dismiss Flag"
                  variant="success"
                  icon={<CheckIcon size={16} color="#000" />}
                  onPress={() => takeAction(
                    'dismiss', 
                    undefined, 
                    undefined, 
                    selectedFlag.flag_id
                  )}
                />
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.surge} />
        <Text style={styles.loadingText}>Loading moderation dashboard...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <ShieldIcon size={64} color={COLORS.blaze} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            Admin privileges are required to access the moderation dashboard.
          </Text>
          <Text style={styles.accessDeniedHint}>
            Contact your administrator to request access.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <ShieldIcon size={28} color={COLORS.surge} />
          <Text style={styles.title}>Moderation</Text>
        </View>
        {isLoading && <ActivityIndicator size="small" color={COLORS.surge} />}
      </View>

      <View style={styles.tabs}>
        <TabButton
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
        />
        <TabButton
          label="Flags"
          active={activeTab === 'flags'}
          onPress={() => setActiveTab('flags')}
          badge={stats?.pending_flags}
        />
        <TabButton
          label="Search"
          active={activeTab === 'search'}
          onPress={() => setActiveTab('search')}
        />
      </View>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'flags' && renderFlags()}
      {activeTab === 'search' && renderSearch()}

      {renderFlagContextModal()}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textSecondary, marginTop: 16, fontSize: 16 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.halo },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    gap: 8,
  },
  tabButtonActive: { backgroundColor: COLORS.surge },
  tabButtonText: { fontSize: 14, color: COLORS.textSecondary },
  tabButtonTextActive: { color: '#000', fontWeight: 'bold' },
  badge: {
    backgroundColor: COLORS.blaze,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },

  content: { flex: 1, padding: 20 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statCardTitle: { fontSize: 12, color: COLORS.textSecondary },
  statCardValue: { fontSize: 32, fontWeight: 'bold' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.halo, marginBottom: 16 },

  flaggedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  flaggedUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flaggedUserRank: { fontSize: 14, color: COLORS.textSecondary, width: 24 },
  flaggedUserName: { fontSize: 16, color: COLORS.halo },
  flagCountBadge: { backgroundColor: COLORS.blaze, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  flagCountText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },

  quickActionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: { fontSize: 14 },
  actionButtonDisabled: { opacity: 0.5 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.halo, marginTop: 16 },
  emptyStateText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 },

  flagCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blaze,
  },
  flagCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  flagTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flagType: { fontSize: 12, fontWeight: 'bold' },
  flagTime: { fontSize: 12, color: COLORS.textSecondary },
  flagCardBody: { marginBottom: 12 },
  flagAuthor: { fontSize: 14, fontWeight: 'bold', color: COLORS.halo, marginBottom: 4 },
  flagMessage: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },
  flagCardFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  flaggedBy: { fontSize: 12, color: COLORS.textSecondary },
  flagReason: { fontSize: 12, color: COLORS.warning, marginTop: 4 },
  tapToView: { fontSize: 12, color: COLORS.surge, textAlign: 'right', marginTop: 8 },

  searchContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, height: 44, color: COLORS.halo, fontSize: 16 },
  searchButton: { backgroundColor: COLORS.surge, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  searchResults: { flex: 1 },

  userCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  userCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  userInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: 'bold', color: COLORS.halo },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#000', fontWeight: 'bold', textTransform: 'uppercase' },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  userStat: { alignItems: 'center' },
  userStatValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.halo },
  userStatLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  userQuickActions: { flexDirection: 'row', gap: 12 },

  modalContainer: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.halo },
  modalCloseButton: { padding: 8 },
  modalCloseText: { fontSize: 16, color: COLORS.surge },
  modalContent: { flex: 1, padding: 20 },

  flagInfoSection: { marginBottom: 24 },
  flagInfoTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.halo, marginBottom: 12 },
  flagInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blaze,
  },
  flagInfoAuthor: { fontSize: 16, fontWeight: 'bold', color: COLORS.halo, marginBottom: 8 },
  flagInfoMessage: { fontSize: 16, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 12 },
  flagInfoMeta: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  flagInfoType: { fontSize: 12, color: COLORS.textSecondary },
  flagInfoReason: { fontSize: 12, color: COLORS.warning, marginTop: 4 },

  contextSection: { marginBottom: 24 },
  contextTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.halo, marginBottom: 12 },
  contextMessage: { backgroundColor: COLORS.card, borderRadius: 8, padding: 12, marginBottom: 8 },
  contextMessageFlagged: { borderWidth: 2, borderColor: COLORS.blaze, backgroundColor: 'rgba(255, 54, 54, 0.1)' },
  contextMessageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  contextMessageAuthor: { fontSize: 14, fontWeight: 'bold', color: COLORS.halo },
  contextMessageTime: { fontSize: 12, color: COLORS.textSecondary },
  contextMessageText: { fontSize: 14, color: COLORS.textSecondary },
  contextMessageCensored: { color: COLORS.warning, fontStyle: 'italic' },
  flaggedIndicator: { fontSize: 12, color: COLORS.blaze, marginTop: 8, fontWeight: 'bold' },

  modalActions: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: COLORS.border },
  modalActionsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.halo, marginBottom: 16 },
  modalActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  accessDeniedTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.halo, marginTop: 24 },
  accessDeniedText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 },
  accessDeniedHint: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 24, fontStyle: 'italic' },
});
