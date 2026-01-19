import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/src/constants/design';

export default function EditEmailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    
    // TODO: Save email to backend/storage and re-authenticate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSaving(false);
    Alert.alert('Success', 'Email updated successfully. Please check your inbox to verify your new email.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const hasChanged = email !== user?.email;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Email</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={Colors.TEXT_TERTIARY}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={20} color={Colors.WARNING} />
            <Text style={styles.warningText}>
              Changing your email will require verification. You'll receive a confirmation email at your new address.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
          <Pressable 
            style={[styles.saveButton, (!hasChanged || !isValidEmail(email)) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanged || !isValidEmail(email) || isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAPHITE,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.WARNING,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAPHITE,
  },
  saveButton: {
    backgroundColor: Colors.SURGE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.GRAPHITE,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.BASALT,
  },
});
