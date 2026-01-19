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
  SafeAreaView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Password validation states
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  // Username availability check (debounced)
  React.useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCheckingUsername(true);
        const BACKEND_URL = 'https://catechismal-cyndy-teacherly.ngrok-free.dev';
        const response = await fetch(
          `${BACKEND_URL}/api/v1/auth/check-username/${username.toLowerCase()}`
        );
        const data = await response.json();
        setUsernameAvailable(data.available);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleZipCodeChange = (text: string) => {
    setZipCode(text);
    // Auto-dismiss keyboard after 5 digits
    if (text.length === 5) {
      Keyboard.dismiss();
    }
  };

  const handleUsernameChange = (text: string) => {
    // Only allow letters, numbers, and underscores
    const filtered = text.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(filtered);
  };

  const handleSignup = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!username.trim() || username.length < 3 || username.length > 20) {
      Alert.alert('Error', 'Username must be 3-20 characters');
      return;
    }

    if (!usernameAvailable) {
      Alert.alert('Error', 'Username is not available');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert('Error', 'Password must be at least 8 characters and include uppercase, lowercase, and number');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate zip code if provided
    if (zipCode && !/^\d{5}$/.test(zipCode)) {
      Alert.alert('Error', 'Please enter a valid 5-digit zip code');
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, username.trim(), password, firstName.trim(), lastName.trim(), zipCode.trim());
    } catch (error: any) {
      const message = error.message || 'Could not create account. Please try again.';
      Alert.alert('Signup Failed', message);
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <Image 
              source={require('../../assets/images/statiq-stacked.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Create Your Account</Text>

            <View style={styles.form}>
              {/* First Name & Last Name Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameInputContainer}>
                  <Ionicons name="person-outline" size={20} color="#b4d836" style={styles.inputIcon} />
                  <TextInput
                    style={styles.nameInput}
                    placeholder="First Name"
                    placeholderTextColor="#aaaaad"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                </View>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={[styles.nameInput, { paddingLeft: 16 }]}
                    placeholder="Last Name"
                    placeholderTextColor="#aaaaad"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#b4d836" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#aaaaad"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              {/* Username */}
              <View style={[
                styles.inputContainer,
                username.length >= 3 && {
                  borderColor: usernameAvailable === true ? '#b4d836' : usernameAvailable === false ? '#ff3636' : '#333',
                  borderWidth: 2,
                }
              ]}>
                <Ionicons name="at-outline" size={20} color="#b4d836" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#aaaaad"
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  maxLength={20}
                />
                {checkingUsername && (
                  <Text style={styles.usernameStatus}>Checking...</Text>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <Ionicons name="checkmark-circle" size={20} color="#b4d836" style={styles.eyeIcon} />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <Ionicons name="close-circle" size={20} color="#ff3636" style={styles.eyeIcon} />
                )}
              </View>
              {username.length > 0 && (
                <Text style={styles.zipHint}>
                  {username.length < 3 ? 'At least 3 characters required' : 
                   usernameAvailable === false ? 'Username is already taken' :
                   usernameAvailable === true ? 'Username is available!' :
                   '3-20 characters. Letters, numbers, and underscores only.'}
                </Text>
              )}

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#b4d836" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#aaaaad"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
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

              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.requirements}>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={hasMinLength ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={hasMinLength ? '#b4d836' : '#F3F3F7'} 
                    />
                    <Text style={[styles.requirementText, hasMinLength && styles.requirementMet]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={hasUpperCase ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={hasUpperCase ? '#b4d836' : '#F3F3F7'} 
                    />
                    <Text style={[styles.requirementText, hasUpperCase && styles.requirementMet]}>
                      One uppercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={hasLowerCase ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={hasLowerCase ? '#b4d836' : '#F3F3F7'} 
                    />
                    <Text style={[styles.requirementText, hasLowerCase && styles.requirementMet]}>
                      One lowercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={hasNumber ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={hasNumber ? '#b4d836' : '#F3F3F7'} 
                    />
                    <Text style={[styles.requirementText, hasNumber && styles.requirementMet]}>
                      One number
                    </Text>
                  </View>
                </View>
              )}

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#b4d836" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#aaaaad"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                    size={20} 
                    color="#F3F3F7" 
                  />
                </Pressable>
              </View>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  <Ionicons 
                    name={passwordsMatch ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={passwordsMatch ? '#b4d836' : '#ff3636'} 
                  />
                  <Text style={[styles.matchText, passwordsMatch && styles.matchTextSuccess]}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                </View>
              )}

              {/* Zip Code */}
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#b4d836" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Zip Code (Optional)"
                  placeholderTextColor="#aaaaad"
                  value={zipCode}
                  onChangeText={handleZipCodeChange}
                  keyboardType="number-pad"
                  maxLength={5}
                  autoComplete="postal-code"
                />
              </View>
              <Text style={styles.zipHint}>
                We'll show you schools in your area
              </Text>

              {/* Sign Up Button */}
              <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>Login</Text>
              </Pressable>
            </View>

            <Text style={styles.note}>
              By signing up, you agree to StatIQ's Terms of Service and Privacy Policy
            </Text>
          </View>
        </TouchableWithoutFeedback>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3F3F7',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  nameInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
  },
  nameInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#F3F3F7',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    marginBottom: 14,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#F3F3F7',
  },
  eyeIcon: {
    paddingRight: 16,
    paddingLeft: 10,
  },
  requirements: {
    backgroundColor: '#1b1b1b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
    color: '#aaaaad',
    fontWeight: '500',
  },
  requirementMet: {
    color: '#b4d836',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginLeft: 2,
  },
  matchText: {
    fontSize: 13,
    color: '#ff3636',
    fontWeight: '500',
  },
  matchTextSuccess: {
    color: '#b4d836',
  },
  zipHint: {
    fontSize: 13,
    color: '#aaaaad',
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 6,
  },
  button: {
    backgroundColor: '#b4d836',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: '#aaaaad',
  },
  linkText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#b4d836',
  },
  note: {
    fontSize: 12,
    color: '#6a6a6d',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  usernameStatus: {
    fontSize: 13,
    color: '#aaaaad',
    paddingRight: 16,
    fontWeight: '500',
  },
});
