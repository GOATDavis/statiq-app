import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AppDataProvider, useAppData } from '../src/context/AppDataContext';
import { SplashScreen as CustomSplash } from '../components/SplashScreen';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isFullyLoaded, loadingProgress, loadingMessage } = useAppData();
  const { isLoading: authLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Minimum splash display time for branding
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000); // Show splash for at least 3 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // Wait for: data loaded + auth loaded + minimum time
  const showSplash = !isFullyLoaded || authLoading || !minTimeElapsed;

  if (showSplash) {
    return <CustomSplash progress={loadingProgress} message={loadingMessage} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role-selector" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(coach)" options={{ headerShown: false }} />
      <Stack.Screen name="(coach-phone)" options={{ headerShown: false }} />
      <Stack.Screen name="(fan)" options={{ headerShown: false }} />
      <Stack.Screen name="(player)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(gametime)"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'NeueHaas-Roman': require('../assets/fonts/NeueHaasDisplayRoman.ttf'),
    'NeueHaas-Medium': require('../assets/fonts/NeueHaasDisplayMediu.ttf'),
    'NeueHaas-Bold': require('../assets/fonts/NeueHaasDisplayBold.ttf'),
  });

  const [trackingRequested, setTrackingRequested] = useState(false);

  // Request App Tracking Transparency permission (iOS 14.5+)
  useEffect(() => {
    async function requestTracking() {
      if (Platform.OS === 'ios') {
        try {
          const { status: existingStatus } = await getTrackingPermissionsAsync();
          
          if (existingStatus === 'undetermined') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { status } = await requestTrackingPermissionsAsync();
            console.log('[ATT] Tracking permission status:', status);
          } else {
            console.log('[ATT] Tracking already determined:', existingStatus);
          }
        } catch (error) {
          console.log('[ATT] Error requesting tracking:', error);
        }
      }
      setTrackingRequested(true);
    }

    if (fontsLoaded) {
      requestTracking();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && trackingRequested) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, trackingRequested]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </AuthProvider>
  );
}
