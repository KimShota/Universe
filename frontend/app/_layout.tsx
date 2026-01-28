import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { BackgroundAudio } from '../components/BackgroundAudio';
import React from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
      <BackgroundAudio />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}