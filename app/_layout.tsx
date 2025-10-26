import { Stack } from "expo-router";
import { View } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "NeueHaas-Black": require("../assets/fonts/NeueHaasDisplayBlack.ttf"),
    "NeueHaas-Bold": require("../assets/fonts/NeueHaasDisplayBold.ttf"),
    "NeueHaas-Medium": require("../assets/fonts/NeueHaasDisplayMediu.ttf"),
    "NeueHaas-Roman": require("../assets/fonts/NeueHaasDisplayRoman.ttf"),
    "NeueHaas-Light": require("../assets/fonts/NeueHaasDisplayLight.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}