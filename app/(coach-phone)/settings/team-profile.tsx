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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';
import { useAuth } from '@/src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

export default function TeamProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { } = useAuth();
  
  const [schoolName, setSchoolName] = useState('');
  const [mascot, setMascot] = useState('');
  const [conference, setConference] = useState('District 5A-1');
  const [region, setRegion] = useState('Region 2');
  const [district, setDistrict] = useState('District 7');
  const [isLoading, setIsLoading] = useState(false);
  const [teamColor, setTeamColor] = useState(Colors.SURGE);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.team) {
            setSchoolName(data.team.name || '');
            setMascot(data.team.mascot || '');
            setConference(data.team.conference || 'District 5A-1');
            setRegion(data.team.region || 'Region 2');
            setDistrict(data.team.district || 'District 7');
            if (data.team.primary_color) {
              setTeamColor(data.team.primary_color);
            }
          }
        }
      } catch (error) {
        console.log('Failed to fetch team data');
      }
    };
    fetchTeamData();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Save to backend
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Team profile updated successfully.', [
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
        <Text style={styles.title}>Team Profile</Text>
        <Pressable style={[styles.saveButton, { backgroundColor: teamColor }]} onPress={handleSave} disabled={isLoading}>
          <Text style={styles.saveButtonText}>{isLoading ? '...' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Update your team details here. This information will be displayed on your public profile.
        </Text>

        {/* School */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>School</Text>
          <TextInput
            style={styles.input}
            value={schoolName}
            onChangeText={setSchoolName}
            placeholder="Enter school name"
            placeholderTextColor={Colors.TEXT_TERTIARY}
          />
        </View>

        {/* Mascot */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mascot</Text>
          <TextInput
            style={styles.input}
            value={mascot}
            onChangeText={setMascot}
            placeholder="Enter mascot"
            placeholderTextColor={Colors.TEXT_TERTIARY}
          />
        </View>

        {/* Conference */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Conference</Text>
          <Pressable style={styles.dropdown}>
            <Text style={styles.dropdownText}>{conference}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.TEXT_SECONDARY} />
          </Pressable>
        </View>

        {/* Region */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Region</Text>
          <Pressable style={styles.dropdown}>
            <Text style={styles.dropdownText}>{region}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.TEXT_SECONDARY} />
          </Pressable>
        </View>

        {/* District */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>District</Text>
          <Pressable style={styles.dropdown}>
            <Text style={styles.dropdownText}>{district}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.TEXT_SECONDARY} />
          </Pressable>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  dropdown: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
});
