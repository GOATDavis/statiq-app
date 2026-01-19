import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';

const API_BASE_URL = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  
  // StatIQ notifications only
  const [statiqPush, setStatiqPush] = useState(true);
  const [statiqEmail, setStatiqEmail] = useState(true);
  const [statiqSms, setStatiqSms] = useState(false);
  const [teamColor, setTeamColor] = useState(Colors.SURGE);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.disclaimer}>
          We may still send you important notifications about your account outside of your notification settings.
        </Text>

        {/* StatIQ Notifications Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>StatIQ</Text>
          <Text style={styles.sectionDescription}>
            These are notifications from StatIQ.
          </Text>

          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.settingLabel}>Push</Text>
              </View>
              <Switch
                value={statiqPush}
                onValueChange={setStatiqPush}
                trackColor={{ false: '#3a3a3a', true: teamColor }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail-outline" size={20} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.settingLabel}>Email</Text>
              </View>
              <Switch
                value={statiqEmail}
                onValueChange={setStatiqEmail}
                trackColor={{ false: '#3a3a3a', true: teamColor }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowLast]}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.settingLabel}>SMS</Text>
              </View>
              <Switch
                value={statiqSms}
                onValueChange={setStatiqSms}
                trackColor={{ false: '#3a3a3a', true: teamColor }}
                thumbColor="#fff"
              />
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
    backgroundColor: Colors.BASALT,
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
    backgroundColor: '#3a3a3a',
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
    paddingHorizontal: 20,
  },
  disclaimer: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 32,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 16,
  },
  settingsList: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Roman',
    color: '#d0d0d0',
  },
});
