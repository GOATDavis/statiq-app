import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '@/src/constants/design';

type Role = 'fan' | 'coach' | 'player';

interface RoleOption {
  role: Role;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'fan',
    title: 'Fan',
    description: 'Follow teams, watch live stats, and never miss a play',
    icon: 'star',
    color: Colors.SURGE,
  },
  {
    role: 'coach',
    title: 'Coach',
    description: 'Track stats in real-time during games with your team',
    icon: 'clipboard',
    color: '#4A90E2',
  },
  {
    role: 'player',
    title: 'Player',
    description: 'View your personal stats and track your performance',
    icon: 'football',
    color: '#E94B3C',
  },
];

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  const { selectRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setIsLoading(true);
    try {
      await selectRole(selectedRole);
    } catch (error) {
      Alert.alert('Error', 'Failed to select role. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>StatIQ</Text>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use StatIQ
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.rolesContainer}>
          {ROLE_OPTIONS.map((option) => (
            <Pressable
              key={option.role}
              style={[
                styles.roleCard,
                selectedRole === option.role && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(option.role)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${option.color}20` },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={32}
                  color={selectedRole === option.role ? option.color : Colors.TEXT_SECONDARY}
                />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{option.title}</Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </View>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radio,
                    selectedRole === option.role && styles.radioSelected,
                    selectedRole === option.role && { borderColor: option.color },
                  ]}
                >
                  {selectedRole === option.role && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: option.color },
                      ]}
                    />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Continue Button */}
        <Pressable
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleSelectRole}
          disabled={!selectedRole || isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'LOADING...' : 'CONTINUE'}
          </Text>
          {!isLoading && (
            <Ionicons name="arrow-forward" size={20} color={Colors.BASALT} />
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.SURGE,
    marginBottom: 24,
    letterSpacing: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
  },

  // Roles
  rolesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.CHARCOAL,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.GRAPHITE,
  },
  roleCardSelected: {
    borderColor: Colors.SURGE,
    backgroundColor: 'rgba(180, 216, 54, 0.05)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
    marginRight: 12,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  radioContainer: {
    paddingLeft: 8,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.GRAPHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.SURGE,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.SURGE,
  },

  // Continue Button
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.SURGE,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.BASALT,
    letterSpacing: 0.5,
  },
});
