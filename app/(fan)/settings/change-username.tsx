import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';

const BACKEND_URL = 'https://catechismal-cyndy-teacherly.ngrok-free.dev';

export default function ChangeUsernameScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.username) {
      setCurrentUsername(user.username);
      setUsername(user.username);
      setIsLoading(false);
    } else {
      loadCurrentUsername();
    }
  }, [user]);

  const loadCurrentUsername = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUsername(userData.username || '');
        setUsername(userData.username || '');
      }
    } catch (err) {
      console.error('Error loading username:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      Alert.alert('Invalid Username', validationError);
      return;
    }
    if (username.toLowerCase() === currentUsername.toLowerCase()) {
      Alert.alert('No Changes', 'Username is the same as before');
      return;
    }
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/update-username`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update username');
      }
      // Refresh user data to update the profile screen
      if (refreshUser) await refreshUser();
      Alert.alert('Success', 'Username updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.SURGE} />
        </View>
      </SafeAreaView>
    );
  }

  const hasChanges = username.toLowerCase() !== currentUsername.toLowerCase();
  const isValid = !validateUsername(username);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
          </Pressable>
          <Text style={styles.headerTitle}>Change Username</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>USERNAME</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="username"
              placeholderTextColor={Colors.TEXT_TERTIARY}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
          <Text style={styles.hint}>
            Your username is how others will find and mention you in chat. It can only contain letters, numbers, and underscores.
          </Text>
          {currentUsername && <Text style={styles.currentUsername}>Current: @{currentUsername}</Text>}
          <View style={styles.noticeContainer}>
            <Ionicons name="information-circle" size={18} color={Colors.WARNING} />
            <Text style={styles.noticeText}>You can only change your username once every 30 days.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable 
            style={[styles.saveButton, (!hasChanges || !isValid) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || !isValid || isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.SHADOW },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.GRAPHITE },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.TEXT_PRIMARY },
  placeholder: { width: 36 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 32 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.TEXT_SECONDARY, marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.CHARCOAL, borderRadius: 12, borderWidth: 1, borderColor: Colors.GRAPHITE },
  atSymbol: { fontSize: 16, fontWeight: '500', color: Colors.TEXT_SECONDARY, paddingLeft: 16 },
  input: { flex: 1, padding: 16, paddingLeft: 4, fontSize: 16, fontWeight: '500', color: Colors.TEXT_PRIMARY },
  hint: { fontSize: 13, fontWeight: '500', color: Colors.TEXT_TERTIARY, marginTop: 8, lineHeight: 18 },
  currentUsername: { fontSize: 14, fontWeight: '500', color: Colors.TEXT_SECONDARY, marginTop: 16 },
  noticeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: 12, borderRadius: 8, marginTop: 24, gap: 8 },
  noticeText: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.WARNING, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.GRAPHITE },
  saveButton: { backgroundColor: Colors.SURGE, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: Colors.GRAPHITE, opacity: 0.5 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: Colors.BASALT },
});
