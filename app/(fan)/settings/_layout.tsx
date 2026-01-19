import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-name" />
      <Stack.Screen name="edit-email" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="change-username" />
    </Stack>
  );
}
