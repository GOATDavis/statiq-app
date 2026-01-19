import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/src/constants/design';
import { API_BASE_URL } from '@/src/lib/api';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPassword = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const isDifferentFromCurrent = newPassword !== currentPassword;
  const canSubmit = currentPassword && newPassword && confirmPassword && 
                   isValidPassword && passwordsMatch && isDifferentFromCurrent;

  const handleSave = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Password changed successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to change password.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={Colors.TEXT_TERTIARY}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons 
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={22} 
                color={Colors.TEXT_SECONDARY} 
              />
            </Pressable>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={Colors.TEXT_TERTIARY}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons 
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={22} 
                color={Colors.TEXT_SECONDARY} 
              />
            </Pressable>
          </View>
          {newPassword.length > 0 && !isValidPassword && (
            <Text style={styles.errorText}>Password must be at least 8 characters</Text>
          )}
          {newPassword.length > 0 && currentPassword && !isDifferentFromCurrent && (
            <Text style={styles.errorText}>New password must be different from current</Text>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={Colors.TEXT_TERTIARY}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={22} 
                color={Colors.TEXT_SECONDARY} 
              />
            </Pressable>
          </View>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        {/* Security Tip */}
        <View style={styles.tipContainer}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.SURGE} />
          <Text style={styles.tipText}>
            Use a strong password with a mix of letters, numbers, and special characters.
          </Text>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSubmit || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.BASALT} />
          ) : (
            <Text style={[styles.saveButtonText, !canSubmit && styles.saveButtonTextDisabled]}>
              Update Password
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.BLAZE,
    marginTop: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(180, 216, 54, 0.2)',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.SURGE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#3a3a3a',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BASALT,
  },
  saveButtonTextDisabled: {
    color: Colors.TEXT_TERTIARY,
  },
});
