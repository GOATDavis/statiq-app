import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="team-profile" />
      <Stack.Screen name="my-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="team-management" />
      <Stack.Screen name="plan" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="notifications-settings" />
      <Stack.Screen name="integrations" />
    </Stack>
  );
}
