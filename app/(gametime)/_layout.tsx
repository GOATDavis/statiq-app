import { Slot, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Platform, Pressable } from "react-native";
import { useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";

export default function GameTimeLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;

  useEffect(() => {
    // CRITICAL: Only coaches can access GameTime
    if (user && user.userType !== 'coach') {
      const redirectMap = {
        'fan': '/(fan)/scores',
        'player': '/(player)/my-stats',
      };
      router.replace(redirectMap[user.userType] || '/(auth)/welcome');
      return;
    }

    // Redirect iPhone users back to dashboard
    if (!isIPad) {
      router.replace("/(coach)/dashboard");
    }
  }, [isIPad, user]);

  // Block non-coaches completely
  if (!user || user.userType !== 'coach') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#262626" }} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <Text style={{ color: "#FF3636", fontSize: 32, fontFamily: "NeueHaas-Bold", marginBottom: 16, textAlign: "center" }}>
            Access Denied
          </Text>
          <Text style={{ color: "#999", fontSize: 18, fontFamily: "NeueHaas-Roman", marginBottom: 32, textAlign: "center" }}>
            GAME TIME is only available to coaches for live stat tracking during games.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ backgroundColor: "#0066cc", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Show error screen for non-iPad devices before redirect
  if (!isIPad) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#262626" }} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <Text style={{ color: "#FF3636", fontSize: 32, fontFamily: "NeueHaas-Bold", marginBottom: 16, textAlign: "center" }}>
            iPad Required
          </Text>
          <Text style={{ color: "#999", fontSize: 18, fontFamily: "NeueHaas-Roman", marginBottom: 32, textAlign: "center" }}>
            GAME TIME is only available on iPad due to its complex interface and real-time stat tracking requirements.
          </Text>
          <Pressable
            onPress={() => router.replace("/(coach)/dashboard")}
            style={{ backgroundColor: "#0066cc", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
              Return to Dashboard
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#262626" }} edges={["top", "left", "right"]}>
      <Slot />
    </SafeAreaView>
  );
}
