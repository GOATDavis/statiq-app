import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  ScrollView,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/design';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  onSettingsChange?: (anyEnabled: boolean) => void;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function NotificationSettingsModal({
  visible,
  onClose,
  gameName,
  onSettingsChange,
}: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'game_start',
      label: 'Game Start',
      description: 'When the game begins',
      enabled: true, // Auto-enabled
    },
    {
      id: 'scoring_play',
      label: 'Scoring Plays',
      description: 'Touchdowns, field goals, and safeties',
      enabled: true, // Auto-enabled
    },
    {
      id: 'quarter_end',
      label: 'Quarter Ends',
      description: 'End of each quarter',
      enabled: false,
    },
    {
      id: 'close_game',
      label: 'Close Game',
      description: 'When the score is within 7 points',
      enabled: false,
    },
    {
      id: 'final',
      label: 'Final Score',
      description: 'When the game ends',
      enabled: true, // Auto-enabled
    },
  ]);

  // Notify parent when modal opens that notifications are enabled (3 are on by default)
  useEffect(() => {
    if (visible) {
      const anyEnabled = settings.some((s) => s.enabled);
      onSettingsChange?.(anyEnabled);
    }
  }, [visible]);

  const toggleSetting = (id: string) => {
    const newSettings = settings.map((setting) =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    );
    setSettings(newSettings);
    const anyEnabled = newSettings.some((s) => s.enabled);
    onSettingsChange?.(anyEnabled);
  };

  const enableAll = () => {
    setSettings(settings.map((setting) => ({ ...setting, enabled: true })));
    onSettingsChange?.(true);
  };

  const disableAll = () => {
    setSettings(settings.map((setting) => ({ ...setting, enabled: false })));
    onSettingsChange?.(false);
  };

  const anyEnabled = settings.some((s) => s.enabled);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={40} style={styles.blurView}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications" size={24} color={Colors.SURGE} />
                </View>
                <View>
                  <Text style={styles.title}>Game Alerts</Text>
                  <Text style={styles.subtitle}>{gameName}</Text>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
                <Ionicons name="close" size={28} color={Colors.TEXT_SECONDARY} />
              </Pressable>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                Get real-time notifications on your lock screen to follow all the action
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Pressable
                style={[styles.quickButton, anyEnabled && styles.quickButtonActive]}
                onPress={enableAll}
              >
                <Text style={[styles.quickButtonText, anyEnabled && styles.quickButtonTextActive]}>
                  Enable All
                </Text>
              </Pressable>
              <Pressable
                style={[styles.quickButton, !anyEnabled && styles.quickButtonActive]}
                onPress={disableAll}
              >
                <Text style={[styles.quickButtonText, !anyEnabled && styles.quickButtonTextActive]}>
                  Disable All
                </Text>
              </Pressable>
            </View>

            {/* Settings List */}
            <ScrollView
              style={styles.settingsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.settingsContent}
            >
              {settings.map((setting, index) => (
                <Pressable
                  key={setting.id}
                  style={[
                    styles.settingItem,
                    index === settings.length - 1 && styles.settingItemLast,
                  ]}
                  onPress={() => toggleSetting(setting.id)}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.enabled}
                    onValueChange={() => toggleSetting(setting.id)}
                    trackColor={{ false: '#3A3A3A', true: Colors.SURGE }}
                    thumbColor={setting.enabled ? Colors.HALO : '#666'}
                    ios_backgroundColor="#3A3A3A"
                  />
                </Pressable>
              ))}
            </ScrollView>

            {/* Footer Note */}
            <View style={styles.footer}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.TEXT_TERTIARY} />
              <Text style={styles.footerText}>
                You can manage all notifications in Settings
              </Text>
            </View>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180, 216, 54, 0.2)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 216, 54, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Description
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    borderWidth: 1.5,
    borderColor: '#3A3A3A',
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: 'rgba(180, 216, 54, 0.15)',
    borderColor: Colors.SURGE,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  quickButtonTextActive: {
    color: Colors.SURGE,
    fontWeight: '700',
  },

  // Settings List
  settingsList: {
    maxHeight: 400,
  },
  settingsContent: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    lineHeight: 18,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    flex: 1,
  },
});
