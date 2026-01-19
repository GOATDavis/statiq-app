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

export default function EditEmailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadCurrentEmail();
  }, []);

  const loadCurrentEmail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmail(data.email || '');
        setOriginalEmail(data.email || '');
      }
    } catch (error) {
      console.error('Error loading email:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasChanged = email !== originalEmail && isValidEmail(email);

  const handleSave = async () => {
    if (!hasChanged) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Email updated successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to update email.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update email. Please try again.');
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
        <Text style={styles.title}>Edit Email</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {isFetching ? (
          <ActivityIndicator size="large" color={Colors.SURGE} />
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.TEXT_TERTIARY}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {email && !isValidEmail(email) && (
                <Text style={styles.errorText}>Please enter a valid email address</Text>
              )}
            </View>

            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.TEXT_SECONDARY} />
              <Text style={styles.noteText}>
                You may need to verify your new email address before changes take effect.
              </Text>
            </View>

            <Pressable
              style={[styles.saveButton, !hasChanged && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!hasChanged || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.BASALT} />
              ) : (
                <Text style={[styles.saveButtonText, !hasChanged && styles.saveButtonTextDisabled]}>
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
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Medium',
    color: Colors.BLAZE,
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
