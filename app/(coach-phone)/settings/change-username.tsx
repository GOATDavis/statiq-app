import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/src/constants/design';
import { API_BASE_URL } from '@/src/lib/api';

export default function ChangeUsernameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadCurrentUsername();
  }, []);

  useEffect(() => {
    // Check username availability when it changes
    if (username && username !== originalUsername && username.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameAvailability();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsAvailable(null);
    }
  }, [username]);

  const loadCurrentUsername = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || '');
        setOriginalUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error loading username:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const checkUsernameAvailability = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.available);
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const isValidUsername = (name: string) => {
    // Username must be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(name);
  };

  const hasChanged = username !== originalUsername && isValidUsername(username);
  const canSubmit = hasChanged && isAvailable === true;

  const handleSave = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-username`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Username updated successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to update username.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityIcon = () => {
    if (!username || username === originalUsername || username.length < 3) return null;
    if (isChecking) return <ActivityIndicator size="small" color={Colors.TEXT_SECONDARY} />;
    if (isAvailable === true) return <Ionicons name="checkmark-circle" size={22} color={Colors.SURGE} />;
    if (isAvailable === false) return <Ionicons name="close-circle" size={22} color={Colors.BLAZE} />;
    return null;
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
        <Text style={styles.title}>Change Username</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {isFetching ? (
          <ActivityIndicator size="large" color={Colors.SURGE} />
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  placeholderTextColor={Colors.TEXT_TERTIARY}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  maxLength={20}
                />
                <View style={styles.availabilityIcon}>
                  {getAvailabilityIcon()}
                </View>
              </View>
              
              {/* Validation Messages */}
              {username && !isValidUsername(username) && (
                <Text style={styles.errorText}>
                  Username must be 3-20 characters (letters, numbers, underscores)
                </Text>
              )}
              {username && username !== originalUsername && isAvailable === false && (
                <Text style={styles.errorText}>This username is already taken</Text>
              )}
              {username && username !== originalUsername && isAvailable === true && (
                <Text style={styles.successText}>Username is available!</Text>
              )}
            </View>

            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.TEXT_SECONDARY} />
              <Text style={styles.noteText}>
                Your username is visible to other users. Choose something memorable but appropriate.
              </Text>
            </View>

            <Pressable
              style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.BASALT} />
              ) : (
                <Text style={[styles.saveButtonText, !canSubmit && styles.saveButtonTextDisabled]}>
                  Save Changes
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
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
    paddingHorizontal: 16,
  },
  atSymbol: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.SURGE,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  availabilityIcon: {
    width: 30,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.BLAZE,
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.SURGE,
    marginTop: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  noteText: {
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
