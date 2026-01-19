/**
 * Admin Layout - Standalone admin section
 * Only accessible by users with admin role
 */

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BG = "#262626";
const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

export default function AdminLayout() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setIsAdmin(userData.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#B4D836" />
        <Text style={{ color: '#999', marginTop: 16 }}>Verifying admin access...</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🛡️</Text>
        <Text style={{ color: '#F3F3F7', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
          Access Denied
        </Text>
        <Text style={{ color: '#999', fontSize: 16, textAlign: 'center' }}>
          Admin privileges required to access this area.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top", "left", "right"]}>
      <Slot />
    </SafeAreaView>
  );
}
