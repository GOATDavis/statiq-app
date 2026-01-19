import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

export default function PlayerLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // CRITICAL: Block non-player users from accessing player screens
  React.useEffect(() => {
    if (user && user.userType !== 'player') {
      // Unauthorized access attempt - redirect to their proper home
      const redirectMap = {
        'coach': '/(coach)/dashboard',
        'fan': '/(fan)/scores',
      };
      router.replace(redirectMap[user.userType] || '/(auth)/welcome');
    }
  }, [user]);

  // If not player, show nothing while redirecting
  if (!user || user.userType !== 'player') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#b4d836',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2a2a2a',
        },
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="my-stats"
        options={{
          title: 'My Stats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
