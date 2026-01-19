import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/design';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to backend
      // await sendPasswordResetEmail(email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Back Button */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
          </Pressable>

          {/* Success State */}
          <View style={styles.successContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.SURGE} />
            </View>
            
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try again.
            </Text>

            <Pressable
              style={styles.resendButton}
              onPress={() => setEmailSent(false)}
            >
              <Text style={styles.resendButtonText}>Send again</Text>
            </Pressable>

            <Pressable
              style={styles.backToLoginButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>Back to login</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.TEXT_PRIMARY} />
          </Pressable>

          {/* Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/statiq-stacked.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#aaaaad"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
            />

            <Pressable
              style={[styles.resetButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.resetButtonText}>SEND RESET LINK</Text>
              )}
            </Pressable>
          </View>

          {/* Back to Login Link */}
          <View style={styles.footer}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>
                <Ionicons name="arrow-back" size={16} color={Colors.SURGE} />
                {' '}Back to login
              </Text>
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
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F3F3F7',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaaaad',
    lineHeight: 22,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1b1b1b',
    borderRadius: 8,
    padding: 18,
    fontSize: 16,
    color: '#F3F3F7',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  resetButton: {
    backgroundColor: '#b4d836',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },
  footer: {
    alignItems: 'center',
  },
  backLink: {
    fontSize: 15,
    color: '#b4d836',
    fontWeight: '600',
  },

  // Success State
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F3F3F7',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 16,
    color: '#aaaaad',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emailText: {
    fontSize: 16,
    color: '#F3F3F7',
    fontWeight: '700',
    marginBottom: 24,
  },
  helpText: {
    fontSize: 14,
    color: '#aaaaad',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  resendButton: {
    backgroundColor: '#1b1b1b',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F3F7',
  },
  backToLoginButton: {
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 15,
    color: '#b4d836',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
