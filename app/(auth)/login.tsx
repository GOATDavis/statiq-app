import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'FaceID' | 'TouchID' | 'Biometric'>('Biometric');

  // Check if biometrics are available on device
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('[Biometric Check]', {
        compatible,
        enrolled,
        types,
        hasHardware: compatible,
        isEnrolled: enrolled,
      });
      
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        
        // Determine biometric type
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('FaceID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('TouchID');
        } else {
          setBiometricType('Biometric');
        }
      } else {
        console.log('[Biometric] Not available - compatible:', compatible, 'enrolled:', enrolled);
      }
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      // Check if user has saved credentials
      const savedEmail = await AsyncStorage.getItem('saved_email');
      const savedPassword = await AsyncStorage.getItem('saved_password');
      
      if (!savedEmail || !savedPassword) {
        Alert.alert(
          'No Saved Credentials',
          'Please log in with email and password first to enable biometric authentication.'
        );
        return;
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Log in with ${biometricType}`,
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setIsLoading(true);
        try {
          await login(savedEmail, savedPassword);
        } catch (error) {
          Alert.alert('Login Failed', 'Invalid saved credentials. Please log in again.');
          // Clear invalid saved credentials
          await AsyncStorage.removeItem('saved_email');
          await AsyncStorage.removeItem('saved_password');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Authentication Error', 'Could not authenticate with biometrics');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      
      // Save credentials for biometric auth (only after successful login)
      if (biometricAvailable) {
        await AsyncStorage.setItem('saved_email', email);
        await AsyncStorage.setItem('saved_password', password);
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/statiq-stacked.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email address or username"
              placeholderTextColor="#aaaaad"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#aaaaad"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <Pressable 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#F3F3F7" 
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginButtonText}>LOG IN</Text>
              )}
            </Pressable>

            {/* Biometric Login Button - Always visible for UI */}
            <Pressable
              style={[styles.biometricButton, !biometricAvailable && styles.biometricButtonDisabled]}
              onPress={handleBiometricAuth}
              disabled={isLoading || !biometricAvailable}
            >
              <Ionicons 
                name="scan" 
                size={24} 
                color={biometricAvailable ? "#b4d836" : "#666"} 
              />
              <Text style={[styles.biometricButtonText, !biometricAvailable && styles.biometricButtonTextDisabled]}>
                Log in with Face ID
              </Text>
            </Pressable>

            <Pressable 
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-google" size={32} color="#fff" />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-apple" size={32} color="#fff" />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={32} color="#fff" />
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signUpLink}>Sign up for StatIQ</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40, // Reduced from 60
  },
  header: {
    alignItems: 'center',
    marginBottom: 40, // Reduced from 60
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  form: {
    width: '100%',
    marginBottom: 24, // Reduced from 32
  },
  input: {
    backgroundColor: '#1b1b1b',
    borderRadius: 8,
    padding: 18,
    fontSize: 16,
    color: '#F3F3F7',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 18,
    fontSize: 16,
    color: '#F3F3F7',
  },
  eyeIcon: {
    paddingRight: 18,
    paddingLeft: 12,
  },
  loginButton: {
    backgroundColor: '#b4d836',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16, // Reduced from 24
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16, // Reduced from 24
    paddingVertical: 14, // Reduced from 16
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#b4d836',
    backgroundColor: 'rgba(180, 216, 54, 0.1)',
  },
  biometricButtonDisabled: {
    borderColor: '#666',
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    opacity: 0.5,
  },
  biometricButtonText: {
    fontSize: 16,
    color: '#b4d836',
    fontWeight: '700',
  },
  biometricButtonTextDisabled: {
    color: '#666',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24, // Reduced from 32
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    fontSize: 12,
    color: '#F3F3F7',
    marginHorizontal: 16,
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24, // Reduced from 32
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#F3F3F7',
    fontWeight: '500',
  },
  signUpLink: {
    fontSize: 14,
    color: '#b4d836',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
