import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';

const API_BASE_URL = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

type Integration = {
  id: string;
  name: string;
  desc: string;
  category: 'essential' | 'recommended' | 'optional';
  color: string;
  enabled: boolean;
};

const integrations: Integration[] = [
  { 
    id: 'maxpreps', 
    name: 'MaxPreps', 
    desc: 'Auto-submit official game stats. No more manual entry.', 
    category: 'essential',
    color: '#0066CC',
    enabled: true 
  },
  { 
    id: 'hudl', 
    name: 'Hudl', 
    desc: 'Sync plays with film timestamps. Keep Hudl for film, StatIQ for stats.', 
    category: 'essential',
    color: '#FF6B00',
    enabled: true 
  },
  { 
    id: 'rankone', 
    name: 'RankOne', 
    desc: 'Import rosters and eligibility data automatically.', 
    category: 'recommended',
    color: '#1E3A5F',
    enabled: false 
  },
  { 
    id: 'thsca', 
    name: 'THSCA', 
    desc: 'Texas High School Coaches Association credential sync.', 
    category: 'recommended',
    color: '#8B0000',
    enabled: false 
  },
  { 
    id: 'gamechanger', 
    name: 'GameChanger', 
    desc: 'Cross-sport stat sharing for multi-sport programs.', 
    category: 'optional',
    color: '#00A651',
    enabled: false 
  },
  { 
    id: 'dragonfly', 
    name: 'DragonFly', 
    desc: 'Athletic department admin and scheduling sync.', 
    category: 'optional',
    color: '#6B4C9A',
    enabled: false 
  },
];

const categoryLabels = {
  essential: 'ESSENTIAL',
  recommended: 'RECOMMENDED', 
  optional: 'OTHER INTEGRATIONS',
};

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [teamColor, setTeamColor] = useState(Colors.SURGE);
  const [appStates, setAppStates] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(app => [app.id, app.enabled]))
  );

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

  const toggleApp = (appId: string) => {
    setAppStates(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  const filteredApps = integrations.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = {
    essential: filteredApps.filter(a => a.category === 'essential'),
    recommended: filteredApps.filter(a => a.category === 'recommended'),
    optional: filteredApps.filter(a => a.category === 'optional'),
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Integrations</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search integrations..."
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </Pressable>
          )}
        </View>

        <Text style={styles.description}>
          Connect your tools to automate stat reporting and save hours every week.
        </Text>

        {(['essential', 'recommended', 'optional'] as const).map(category => {
          const apps = grouped[category];
          if (apps.length === 0) return null;
          
          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{categoryLabels[category]}</Text>
              <View style={styles.sectionCard}>
                {apps.map((app, idx) => (
                  <View 
                    key={app.id} 
                    style={[
                      styles.appCard,
                      idx < apps.length - 1 && styles.appCardBorder
                    ]}
                  >
                    <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                      <Text style={styles.appIconText}>
                        {app.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={styles.appDesc} numberOfLines={2}>{app.desc}</Text>
                    </View>

                    <Switch
                      value={appStates[app.id]}
                      onValueChange={() => toggleApp(app.id)}
                      trackColor={{ false: '#333', true: teamColor }}
                      thumbColor={appStates[app.id] ? '#fff' : '#666'}
                      ios_backgroundColor="#333"
                    />
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {filteredApps.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="apps-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No integrations found</Text>
          </View>
        )}

        <View style={styles.comingSoon}>
          <Ionicons name="sparkles" size={16} color={teamColor} />
          <Text style={styles.comingSoonText}>
            More integrations coming soon. Request one at support@usestatiq.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  description: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Bold',
    color: '#666',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    overflow: 'hidden',
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  appCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  appInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 3,
  },
  appDesc: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    color: '#888',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#444',
    marginTop: 12,
  },
  comingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    marginTop: 8,
  },
  comingSoonText: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    color: '#666',
    flex: 1,
  },
});
