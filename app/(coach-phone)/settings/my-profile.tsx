import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/src/constants/design';

const API_BASE_URL = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamColor, setTeamColor] = useState(Colors.SURGE);

  const maxBioLength = 160;
  const remainingChars = maxBioLength - bio.length;

  // Auto-fill from user context
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const email = user?.email || '';
  const role = 'Coach';

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

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Save bio to backend
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 500);
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
        <Text style={styles.title}>My Profile</Text>
        <Pressable 
          style={[styles.saveButton, { backgroundColor: teamColor }]} 
          onPress={handleSave} 
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>{isLoading ? '...' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Update your photo and personal details here.
        </Text>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={teamColor} />
          </View>
          <View style={styles.photoButtons}>
            <Pressable style={styles.uploadButton}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </Pressable>
            <Text style={styles.photoHint}>PNG, JPG, GIF (max 1200x800px)</Text>
          </View>
        </View>

        {/* Name - Read Only */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.nameRow}>
            <View style={[styles.inputReadOnly, { flex: 1 }]}>
              <Text style={styles.inputText}>{firstName || 'First name'}</Text>
            </View>
            <View style={[styles.inputReadOnly, { flex: 1 }]}>
              <Text style={styles.inputText}>{lastName || 'Last name'}</Text>
            </View>
          </View>
        </View>

        {/* Email - Read Only */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputReadOnly}>
            <Text style={styles.inputText}>{email || 'Email'}</Text>
          </View>
          <Text style={styles.inputHint}>Change email in the password settings</Text>
        </View>

        {/* Role - Read Only */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.inputReadOnly}>
            <Text style={styles.inputText}>{role}</Text>
          </View>
        </View>

        {/* Bio - Editable */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, maxBioLength))}
            placeholder="Tell us about yourself..."
            placeholderTextColor={Colors.TEXT_TERTIARY}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, remainingChars < 20 && styles.charCountWarning]}>
            {remainingChars} characters left
          </Text>
        </View>
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
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 24,
    lineHeight: 22,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtons: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3a3a3a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  photoHint: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_TERTIARY,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  inputReadOnly: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 14,
    opacity: 0.6,
  },
  inputText: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_TERTIARY,
    marginTop: 6,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_TERTIARY,
    marginTop: 6,
    textAlign: 'right',
  },
  charCountWarning: {
    color: Colors.BLAZE,
  },
});
