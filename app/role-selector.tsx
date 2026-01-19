import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';

/**
 * This route has been deprecated.
 * Role selection now happens through the auth flow.
 * This file only exists to handle old links gracefully.
 */
export default function DeprecatedRoleSelector() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.errorIcon}>⛔</Text>
        <Text style={styles.title}>Route Deprecated</Text>
        <Text style={styles.message}>
          This role selector has been removed for security.{'\n\n'}
          Please log in through the app to access your account.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(auth)/welcome')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SHADOW,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.BLAZE,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  button: {
    backgroundColor: Colors.SURGE,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.BASALT,
    letterSpacing: 0.5,
  },
});
