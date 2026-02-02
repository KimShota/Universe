import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../contexts/AuthContext';
import { BackgroundAudio } from '../components/BackgroundAudio';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';
import React, { useState } from 'react';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

function SplashOrApp() {
  const [splashVisible, setSplashVisible] = useState(true);

  if (splashVisible) {
    return <AnimatedSplashScreen onFinish={() => setSplashVisible(false)} />;
  }

  return (
    <>
      <BackgroundAudio />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SplashOrApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}